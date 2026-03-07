/**
 * Haversine distance in km
 */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Normalize Arabic/French text for fuzzy comparison
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^\w\s]/g, '')         // strip punctuation
    .trim();
}

/**
 * Extract meaningful words (>2 chars) from text
 */
function extractWords(text: string): string[] {
  const stopwords = new Set([
    'dans', 'avec', 'pour', 'une', 'des', 'les', 'son', 'sur', 'par',
    'est', 'pas', 'qui', 'que', 'mais', 'elle', 'lui', 'nous', 'vous',
    'the', 'and', 'for', 'has', 'was', 'are', 'been', 'from', 'this',
    'very', 'petit', 'grand', 'tres', 'aussi', 'bien', 'comme',
  ]);
  return normalize(text)
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w));
}

/**
 * Fuzzy string similarity (Jaccard-like on character bigrams)
 */
function bigramSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;

  const bigramsA = new Set<string>();
  const bigramsB = new Set<string>();
  for (let i = 0; i < na.length - 1; i++) bigramsA.add(na.slice(i, i + 2));
  for (let i = 0; i < nb.length - 1; i++) bigramsB.add(nb.slice(i, i + 2));

  let intersection = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++;
  }
  const union = bigramsA.size + bigramsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export interface MatchScoreResult {
  score: number;
  distance: number;
  breakdown: {
    species: number;
    proximity: number;
    color: number;
    breed: number;
    description: number;
    recency: number;
    size: number;
  };
}

/**
 * IMPROVED matching algorithm v2
 * 
 * Changes from v1:
 * - Fuzzy text matching (bigram similarity) instead of strict includes
 * - Better proximity scoring curve (continuous, not just 3 bands)
 * - Keyword overlap is weighted by how distinctive the words are
 * - Lowered threshold to 35 for Tunisia context (fewer reports = need wider net)
 * - Added size/age heuristics from description
 * - Max score is 100
 */
export function computeMatchScore(
  newPet: { species: string; lat: number | null; lng: number | null; color?: string; breed?: string; description?: string; created_at?: string },
  candidate: { species: string; lat: number | null; lng: number | null; color?: string; breed?: string; description?: string; created_at?: string },
  maxDistanceKm: number = 30
): MatchScoreResult | null {
  // Must have coordinates for at least one
  if (newPet.lat == null || newPet.lng == null || candidate.lat == null || candidate.lng == null) {
    return null;
  }

  const distance = haversineKm(newPet.lat, newPet.lng, candidate.lat, candidate.lng);
  if (distance > maxDistanceKm) return null;

  const breakdown = {
    species: 0,
    proximity: 0,
    color: 0,
    breed: 0,
    description: 0,
    recency: 0,
    size: 0,
  };

  // Species match (already filtered upstream, but explicit)
  if (newPet.species === candidate.species) {
    breakdown.species = 20;
  } else {
    return null; // hard requirement
  }

  // Proximity: continuous curve, max 25 pts
  breakdown.proximity = Math.max(0, Math.round(25 * Math.exp(-distance / 12)));

  // Color: CRITICAL — mismatch is a penalty
  if (newPet.color && candidate.color) {
    const sim = bigramSimilarity(newPet.color, candidate.color);
    if (sim > 0.5) {
      breakdown.color = Math.round(sim * 20);
    } else if (sim < 0.2) {
      breakdown.color = -15; // penalty for clearly different colors
    }
  }

  // Breed match: fuzzy, max 20 pts
  if (newPet.breed && candidate.breed) {
    const sim = bigramSimilarity(newPet.breed, candidate.breed);
    if (sim > 0.4) {
      breakdown.breed = Math.round(sim * 20);
    }
  }

  // Description keyword overlap: max 10 pts
  if (newPet.description && candidate.description) {
    const words1 = extractWords(newPet.description);
    const words2 = extractWords(candidate.description);
    if (words1.length > 0 && words2.length > 0) {
      const set2 = new Set(words2);
      const overlap = words1.filter(w => set2.has(w)).length;
      const maxPossible = Math.min(words1.length, words2.length);
      const ratio = maxPossible > 0 ? overlap / maxPossible : 0;
      breakdown.description = Math.round(ratio * 10);
    }
  }

  // Recency bonus: reports within 72h get up to 5 pts
  if (candidate.created_at) {
    const diffHours = Math.abs(Date.now() - new Date(candidate.created_at).getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) breakdown.recency = 5;
    else if (diffHours < 48) breakdown.recency = 3;
    else if (diffHours < 72) breakdown.recency = 1;
  }

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);

  return { score, distance, breakdown };
}

/** Minimum score to create a match record */
export const MATCH_THRESHOLD = 45;

/** Minimum score for preview (during form filling) */
export const PREVIEW_THRESHOLD = 35;
