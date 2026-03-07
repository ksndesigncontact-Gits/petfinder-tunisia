# 🐾 PetFinder Tunisia v2

Plateforme communautaire pour signaler et retrouver des animaux perdus en Tunisie.

## Features

- **Signalement** avec photo, géolocalisation, et analyse IA (Gemini)
- **Matching intelligent v2** — algorithme fuzzy avec scoring continu
- **Carte interactive** (Leaflet/OpenStreetMap) avec filtres par rayon
- **Partage WhatsApp** en français
- **Mode Admin** (5 clics sur le logo)
- **Pull-to-refresh** mobile
- **Anti-spam** honeypot + rate limiting

## Stack

React 19 + Vite + Express + Supabase + Gemini AI + Leaflet + Tailwind CSS v4

## Setup

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# Remplir SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.

# 3. Créer les tables Supabase (SQL Editor)
# → Le SQL est affiché automatiquement dans l'app si les tables manquent

# 4. Run
npm run dev
# → http://localhost:3000
```

## Matching v2 — Algorithme

| Critère | Points max | Méthode |
|---------|-----------|---------|
| Même espèce | 25 | Exact match |
| Proximité | 25 | Exponential decay (e^(-d/12)) |
| Race | 20 | Bigram similarity (fuzzy) |
| Couleur | 15 | Bigram similarity (fuzzy) |
| Mots description | 10 | Keyword overlap ratio |
| Récence (<72h) | 5 | Tiered bonus |
| **Total max** | **100** | |
| **Seuil match** | **35** | |
| **Seuil preview** | **30** | |

Améliorations vs v1 :
- Fuzzy matching (bigrams) au lieu de `includes()` strict
- Courbe de proximité continue au lieu de 3 paliers
- Seuil abaissé (35 vs 45) pour le contexte tunisien (peu de données)
- Preview à 30 pour montrer plus de candidats pendant la saisie
- Normalisation unicode/accents pour le français/arabe

## Architecture

```
src/
  components/   Header, PetCard, MatchCard, MatchDetail, ReportForm, AdminModal, DbSetupBanner
  hooks/        useGeolocation, usePets
  services/     geminiService (client → server proxy)
  types/        Pet, Match, ReportForm interfaces
  utils/        matching (haversine, scoring, fuzzy)
server.ts       Express backend (API, Supabase, Gemini proxy, matching engine)
```

## Sécurité v2

- ✅ Clés Supabase uniquement dans `.env` (jamais dans le code)
- ✅ Gemini API proxifiée côté serveur (clé jamais exposée au client)
- ✅ Mot de passe admin configurable via env
- ✅ Rate limiting (10 signalements/h/IP)
- ✅ Honeypot anti-bot
