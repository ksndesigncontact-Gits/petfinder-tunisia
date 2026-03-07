import { useState, useEffect, useCallback } from 'react';

interface GeoState {
  location: [number, number] | null;
  status: 'prompt' | 'granted' | 'denied' | 'loading';
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>(() => {
    const saved = localStorage.getItem('petfinder_location');
    if (saved) {
      return { location: JSON.parse(saved), status: 'granted', error: null };
    }
    return { location: null, status: 'prompt', error: null };
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, status: 'denied', error: 'Géolocalisation non supportée' }));
      return;
    }
    setState(s => ({ ...s, status: 'loading' }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        localStorage.setItem('petfinder_location', JSON.stringify(loc));
        setState({ location: loc, status: 'granted', error: null });
      },
      (err) => {
        if (err.code === 1) {
          setState(s => ({ ...s, status: 'denied', error: 'Permission refusée' }));
        } else {
          setState(s => ({ ...s, status: 'denied', error: err.message }));
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    // Auto-request on mount if not already granted/denied
    if (state.status === 'prompt') {
      requestLocation();
    }
  }, []);

  return { ...state, requestLocation };
}
