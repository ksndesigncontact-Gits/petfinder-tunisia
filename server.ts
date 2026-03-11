import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import path from "path";
import fs from "fs";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

dotenv.config();

// =============================================================================
// CONFIG — all from env, no hardcoded secrets
// =============================================================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme";
const PORT = parseInt(process.env.PORT || "3000");

// =============================================================================
// MATCHING ENGINE v2 — imported inline to keep single-file server
// =============================================================================
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/g, '').trim();
}

function bigramSimilarity(a: string, b: string): number {
  const na = normalize(a), nb = normalize(b);
  if (na === nb) return 1;
  const bA = new Set<string>(), bB = new Set<string>();
  for (let i = 0; i < na.length - 1; i++) bA.add(na.slice(i, i + 2));
  for (let i = 0; i < nb.length - 1; i++) bB.add(nb.slice(i, i + 2));
  let inter = 0;
  for (const bg of bA) if (bB.has(bg)) inter++;
  const union = bA.size + bB.size - inter;
  return union === 0 ? 0 : inter / union;
}

function computeScore(newPet: any, candidate: any): { score: number; distance: number } | null {
  if (newPet.lat == null || newPet.lng == null || candidate.lat == null || candidate.lng == null) return null;
  if (newPet.species !== candidate.species) return null;

  const distance = haversineKm(newPet.lat, newPet.lng, candidate.lat, candidate.lng);
  if (distance > 30) return null;

  let score = 20; // species match (base)

  // Proximity: 0km→25, decays exponentially
  score += Math.max(0, Math.round(25 * Math.exp(-distance / 12)));

  // Color: CRITICAL — if both have color, mismatch is a penalty
  if (newPet.color && candidate.color) {
    const colorSim = bigramSimilarity(newPet.color, candidate.color);
    if (colorSim > 0.5) {
      score += Math.round(colorSim * 20); // strong match: up to +20
    } else if (colorSim < 0.2) {
      score -= 15; // clearly different color: PENALTY
    }
  }

  // Breed (fuzzy): up to 20
  if (newPet.breed && candidate.breed) {
    const breedSim = bigramSimilarity(newPet.breed, candidate.breed);
    if (breedSim > 0.4) {
      score += Math.round(breedSim * 20);
    }
  }

  // Description overlap: up to 10
  if (newPet.description && candidate.description) {
    const stopwords = new Set(['dans', 'avec', 'pour', 'une', 'des', 'les', 'est', 'pas', 'qui', 'que', 'the', 'and']);
    const w1 = normalize(newPet.description).split(/\s+/).filter((w: string) => w.length > 2 && !stopwords.has(w));
    const w2 = new Set(normalize(candidate.description).split(/\s+/).filter((w: string) => w.length > 2 && !stopwords.has(w)));
    const overlap = w1.filter((w: string) => w2.has(w)).length;
    const maxP = Math.min(w1.length, w2.size);
    if (maxP > 0) score += Math.round((overlap / maxP) * 10);
  }

  // Recency: up to 5
  if (candidate.created_at) {
    const hours = Math.abs(Date.now() - new Date(candidate.created_at).getTime()) / 3.6e6;
    if (hours < 24) score += 5;
    else if (hours < 48) score += 3;
    else if (hours < 72) score += 1;
  }

  return { score: Math.max(0, score), distance };
}

const MATCH_THRESHOLD = 45;
const PREVIEW_THRESHOLD = 35;

// =============================================================================
// SUPABASE CLIENT
// =============================================================================
let supabaseClient: any = null;

function getSupabase() {
  if (supabaseClient) return supabaseClient;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env");
  }
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  return supabaseClient;
}

// =============================================================================
// MULTER + SUPABASE STORAGE (for production on Render/etc)
// =============================================================================
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// In dev: disk storage. In prod: memory buffer → Supabase Storage
const IS_PROD = process.env.NODE_ENV === "production";

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/"),
  filename: (_req, file, cb) => {
    const suffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${suffix}${path.extname(file.originalname)}`);
  },
});
const memStorage = multer.memoryStorage();

const upload = multer({
  storage: IS_PROD ? memStorage : diskStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

/**
 * Upload image to Supabase Storage (production)
 * Requires a 'pet-images' bucket in Supabase (public access)
 */
async function uploadToSupabaseStorage(file: any): Promise<string> {
  const supabase = getSupabase();
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
  
  const { error } = await supabase.storage
    .from("pet-images")
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      cacheControl: "3600",
    });
  
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  
  const { data: urlData } = supabase.storage.from("pet-images").getPublicUrl(filename);
  return urlData.publicUrl;
}

// =============================================================================
// SERVER
// =============================================================================
async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "15mb" }));

  // Static uploads
  app.use("/uploads", express.static("uploads"));

  // ---- DB Status ----
  let dbStatus = { petsTable: false, missingColumns: [] as string[], error: null as string | null };

  const checkTables = async () => {
    dbStatus = { petsTable: false, missingColumns: [], error: null };
    try {
      const supabase = getSupabase();
      const { error: pe } = await supabase.from("pets").select("id").limit(1);
      dbStatus.petsTable = !pe;
      if (pe) dbStatus.error = pe.message;

      // Check columns
      for (const col of ["name", "pet_status"]) {
        const { error: ce } = await supabase.from("pets").select(col).limit(0);
        if (ce && ce.message.includes(col)) dbStatus.missingColumns.push(col);
      }
    } catch (err: any) {
      dbStatus.error = err.message;
    }
  };
  checkTables();

  app.get("/api/db-status", async (_req, res) => { await checkTables(); res.json(dbStatus); });

  // ---- Rate limit ----
  const reportLimiter = rateLimit({
    windowMs: 3600_000, max: 10,
    message: { error: "Trop de signalements. Réessayez dans une heure." },
    standardHeaders: true, legacyHeaders: false,
  });

  // ---- Matching ----
  async function processMatching(newPet: any) {
    if (newPet.lat == null || newPet.lng == null) return;
    console.log(`[MATCH] Processing pet ${newPet.id} (${newPet.species}) at [${newPet.lat}, ${newPet.lng}]`);

    try {
      const supabase = getSupabase();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: candidates, error } = await supabase
        .from("pets").select("*")
        .eq("species", newPet.species)
        .neq("type", newPet.type)
        .gt("created_at", thirtyDaysAgo.toISOString());

      if (error || !candidates?.length) {
        console.log(`[MATCH] ${error ? 'Error: ' + error.message : 'No candidates'}`);
        return;
      }

      console.log(`[MATCH] ${candidates.length} candidates found`);

      for (const c of candidates) {
        const result = computeScore(newPet, c);
        if (!result) continue;

        console.log(`[MATCH] Candidate ${c.id}: score=${result.score}, dist=${result.distance.toFixed(1)}km`);

        if (result.score >= MATCH_THRESHOLD) {
          const lostId = newPet.type === "lost" ? newPet.id : c.id;
          const foundId = newPet.type === "found" ? newPet.id : c.id;

          // Dedup
          const { data: existing } = await supabase.from("matches").select("id")
            .eq("lost_report_id", lostId).eq("found_report_id", foundId).maybeSingle();
          if (existing) continue;

          const { error: ie } = await supabase.from("matches").insert([{
            lost_report_id: lostId,
            found_report_id: foundId,
            match_score: result.score,
            distance_km: result.distance,
            status: "pending",
          }]);

          if (ie) console.error(`[MATCH] Insert error:`, ie);
          else console.log(`[MATCH] ✅ Match created: ${lostId} ↔ ${foundId} (score: ${result.score})`);
        }
      }
    } catch (err) {
      console.error("[MATCH] Critical error:", err);
    }
  }

  // ---- API Routes ----

  // GET /api/pets
  app.get("/api/pets", async (_req, res) => {
    try {
      const { data, error } = await getSupabase().from("pets").select("*").order("created_at", { ascending: false });
      if (error) {
        if (error.message.includes("not found") || error.message.includes("find the table")) return res.json([]);
        return res.status(500).json({ error: error.message });
      }
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: "Supabase non configuré. Vérifiez vos variables d'environnement." });
    }
  });

  // POST /api/pets
  app.post("/api/pets", reportLimiter, upload.single("image"), async (req: any, res) => {
    try {
      if (req.body.website) return res.status(400).json({ error: "Spam détecté" });

      const supabase = getSupabase();
      const { type, species, breed, color, description, location, contact, lat, lng, name, pet_status } = req.body;

      const insertData: any = {
        type: 'lost', species, breed, color, description, location, contact,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        image_url: null as string | null,
        name: name || "Inconnu",
        pet_status: pet_status || "toujours_errant",
        sighting_count: 0,
        owner_notified: false,
      };

      // Handle image upload
      if (req.file) {
        if (IS_PROD && req.file.buffer) {
          // Production: upload to Supabase Storage
          try {
            insertData.image_url = await uploadToSupabaseStorage(req.file);
          } catch (err: any) {
            console.warn("[UPLOAD] Supabase Storage failed:", err.message);
            // Fallback: skip image
          }
        } else {
          // Dev: local disk
          insertData.image_url = `/uploads/${req.file.filename}`;
        }
      }

      let { data, error } = await supabase.from("pets").insert([insertData]).select();

      // Fallback without new columns
      if (error?.message?.includes("column") && (error.message.includes("name") || error.message.includes("pet_status"))) {
        const fb = { ...insertData };
        delete fb.name;
        delete fb.pet_status;
        const retry = await supabase.from("pets").insert([fb]).select();
        data = retry.data;
        error = retry.error;
      }

      if (error) return res.status(500).json({ error: error.message });

      const newPet = data![0];
      res.json({ id: newPet.id, success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/pets/:id
  app.delete("/api/pets/:id", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== ADMIN_PASSWORD) return res.status(401).json({ error: "Non autorisé" });

    try {
      const { id } = req.params;
      const numId = parseInt(id);
      const queryId = !isNaN(numId) && String(numId) === id ? numId : id;
      const { data, error } = await getSupabase().from("pets").delete().eq("id", queryId).select();
      if (error) return res.status(500).json({ error: error.message });
      res.json({ success: true, deletedCount: data?.length || 0 });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/pets/:id/sightings
  app.post("/api/pets/:id/sightings", upload.single("image"), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { contact_phone, lat, lng, location, message, user_id } = req.body;
      const petId = parseInt(id);

      let photoUrl = null;
      if (req.file) {
        if (IS_PROD && req.file.buffer) {
          try {
            photoUrl = await uploadToSupabaseStorage(req.file);
          } catch (err: any) {
            console.warn("[UPLOAD] Photo upload failed:", err.message);
          }
        } else {
          photoUrl = `/uploads/${req.file.filename}`;
        }
      }

      const supabase = getSupabase();

      // Insert sighting
      const { data: sighting, error: sightingError } = await supabase
        .from("sightings")
        .insert([{
          pet_id: petId,
          contact_phone: contact_phone || null,
          lat: lat || null,
          lng: lng || null,
          location: location || null,
          photo_url: photoUrl,
          message: message || null,
          user_id: user_id || null,
        }])
        .select();

      if (sightingError) return res.status(500).json({ error: sightingError.message });

      // Increment sighting count and create notification
      const { data: pet, error: petError } = await supabase
        .from("pets")
        .select("sighting_count")
        .eq("id", petId)
        .single();

      if (!petError && pet) {
        await supabase
          .from("pets")
          .update({ sighting_count: (pet.sighting_count || 0) + 1 })
          .eq("id", petId);
      }

      // Create notification for pet owner
      if (sighting?.[0]) {
        await supabase
          .from("notifications")
          .insert([{
            pet_id: petId,
            sighting_id: sighting[0].id,
            contact_phone: contact_phone || null,
            message: message || null,
            location: location || null,
            lat: lat || null,
            lng: lng || null,
            is_read: false,
          }])
          .catch(err => console.warn("[NOTIFICATION] Insert error:", err));
      }

      res.json({ success: true, sighting: sighting?.[0] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DEPRECATED ENDPOINTS — kept for compatibility
  app.get("/api/matches", async (_req, res) => res.json([]));
  app.post("/api/matches/preview", async (_req, res) => res.json([]));
  app.post("/api/matches/recheck", async (_req, res) => res.json({ success: true }));
  app.post("/api/matches/:id/status", async (req, res) => {
    const { status } = req.body;
    try {
      const { data, error } = await getSupabase()
        .from("matches").update({ status }).eq("id", req.params.id).select();
      if (error) return res.status(500).json({ error: error.message });
      res.json(data?.[0] || {});
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/analyze-image — Gemini proxy (keeps API key server-side)
  app.post("/api/analyze-image", async (req, res) => {
    if (!GEMINI_API_KEY) return res.status(503).json({ error: "Gemini API key not configured" });

    try {
      const { GoogleGenAI, Type } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

      const base64 = req.body.image;
      const imageData = base64.includes(",") ? base64.split(",")[1] : base64;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: imageData } },
            { text: `Analyse cette image. Détermine si c'est une vraie photo d'un chien ou d'un chat. Si c'est un mème, une blague, une personne ou autre, mets isPet à false. Sinon identifie espèce, race, couleurs, description en français. JSON uniquement.` },
          ],
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isPet: { type: Type.BOOLEAN },
              species: { type: Type.STRING, enum: ["dog", "cat"] },
              breed: { type: Type.STRING },
              color: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ["isPet", "species", "breed", "color", "description"],
          },
        },
      });

      res.json(JSON.parse(response.text));
    } catch (err: any) {
      console.error("[Gemini] Error:", err.message);
      res.status(500).json({ error: "Analyse IA échouée" });
    }
  });

  // ---- Vite ----
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (_req, res) => res.sendFile(path.resolve("dist/index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] 🐾 PetFinder Tunisia started on http://localhost:${PORT}`);
    console.log(`[SERVER] Supabase: ${SUPABASE_URL ? '✅' : '❌'} | Gemini: ${GEMINI_API_KEY ? '✅' : '❌'} | Admin: ${ADMIN_PASSWORD !== 'changeme' ? '✅' : '⚠️ default'}`);
  });
}

startServer();
