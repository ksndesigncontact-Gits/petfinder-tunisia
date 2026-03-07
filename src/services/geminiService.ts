/**
 * Analyse d'image par Gemini AI — appelé côté CLIENT
 * La clé API est injectée par Vite via process.env.GEMINI_API_KEY
 * 
 * En production, cet appel devrait passer par le serveur Express
 * pour ne jamais exposer la clé au client.
 */

interface PetAnalysis {
  isPet: boolean;
  species: 'dog' | 'cat';
  breed: string;
  color: string;
  description: string;
}

export async function analyzePetImage(base64Image: string): Promise<PetAnalysis> {
  // Try server-side proxy first (secure)
  try {
    const res = await fetch('/api/analyze-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    console.warn('[Gemini] Server proxy failed, falling back to client-side');
  }

  // Fallback: direct client-side call (dev only)
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    console.warn('[Gemini] No API key available — returning default analysis');
    return {
      isPet: true,
      species: 'dog',
      breed: '',
      color: '',
      description: 'Photo uploadée (analyse IA non disponible)',
    };
  }

  const { GoogleGenAI, Type } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          {
            text: `Analyse cette image. Détermine si c'est une vraie photo d'un chien ou d'un chat.
Si c'est un mème, une blague, une personne ou tout autre objet, mets isPet à false.
Si c'est un chien ou chat, identifie l'espèce, la race, les couleurs principales, 
et une brève description en français.
Retourne le résultat en JSON.`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isPet: { type: Type.BOOLEAN, description: 'True si image est un vrai chien ou chat' },
          species: { type: Type.STRING, enum: ['dog', 'cat'] },
          breed: { type: Type.STRING },
          color: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ['isPet', 'species', 'breed', 'color', 'description'],
      },
    },
  });

  return JSON.parse(response.text);
}
