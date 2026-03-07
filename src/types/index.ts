export interface Pet {
  id: number;
  type: 'lost' | 'found';
  species: 'dog' | 'cat';
  name: string;
  pet_status: 'en_ma_possession' | 'toujours_errant';
  breed: string;
  color: string;
  description: string;
  location: string;
  lat: number | null;
  lng: number | null;
  contact: string;
  image_url: string;
  created_at: string;
}

export interface Match {
  id: number;
  lost_report_id: number;
  found_report_id: number;
  match_score: number;
  distance_km: number;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
  lost_report: Pet;
  found_report: Pet;
}

export interface ReportForm {
  type: 'lost' | 'found';
  species: 'dog' | 'cat';
  name: string;
  pet_status: 'en_ma_possession' | 'toujours_errant';
  breed: string;
  color: string;
  description: string;
  location: string;
  lat: number | null;
  lng: number | null;
  contact: string;
  isAnonymous: boolean;
  image: File | null;
  imagePreview: string;
}

export interface DbStatus {
  petsTable: boolean;
  matchesTable: boolean;
  missingColumns: string[];
  error: string | null;
}

export const INITIAL_FORM: ReportForm = {
  type: 'lost',
  species: 'dog',
  name: 'Inconnu',
  pet_status: 'toujours_errant',
  breed: '',
  color: '',
  description: '',
  location: '',
  lat: null,
  lng: null,
  contact: '+216 ',
  isAnonymous: false,
  image: null,
  imagePreview: ''
};
