export interface Pet {
  id: number;
  type: 'lost';
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
  sighting_count: number;
  owner_notified: boolean;
}

export interface Sighting {
  id: number;
  pet_id: number;
  user_id?: string;
  contact: string;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

export interface ReportForm {
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
  image: File | null;
  imagePreview: string;
}

export interface Notification {
  id: number;
  pet_id: number;
  sighting_id: number;
  owner_id: string | null;
  contact_phone: string | null;
  message: string | null;
  location: string | null;
  lat: number | null;
  lng: number | null;
  is_read: boolean;
  created_at: string;
}

export interface DbStatus {
  petsTable: boolean;
  missingColumns: string[];
  error: string | null;
}

export const INITIAL_FORM: ReportForm = {
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
  image: null,
  imagePreview: ''
};
