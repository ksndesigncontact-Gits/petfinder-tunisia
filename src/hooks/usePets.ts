import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Pet, DbStatus } from '../types';
import { haversineKm } from '../utils/matching';

const REFRESH_INTERVAL = 30_000;

export function usePets(userLocation: [number, number] | null, radiusKm: number | null, breedFilter: string | null = null) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPets = useCallback(async () => {
    try {
      const res = await fetch('/api/pets');
      const data = await res.json();
      if (Array.isArray(data)) setPets(data);
    } catch (err) {
      console.error('Failed to fetch pets:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDbStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/db-status');
      setDbStatus(await res.json());
    } catch {
      console.error('Failed to fetch DB status');
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchPets();
  }, [fetchPets]);

  useEffect(() => {
    fetchPets();
    fetchDbStatus();
    const interval = setInterval(() => {
      fetchPets();
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Filter pets by radius and breed
  const filteredPets = useMemo(() => {
    let result = [...pets];
    if (radiusKm && userLocation) {
      result = result.filter(p => {
        if (p.lat && p.lng) {
          return haversineKm(userLocation[0], userLocation[1], p.lat, p.lng) <= radiusKm;
        }
        return true;
      });
    }
    if (breedFilter) {
      result = result.filter(p => p.breed?.toLowerCase().includes(breedFilter.toLowerCase()));
    }
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [pets, radiusKm, userLocation, breedFilter]);

  return {
    pets,
    filteredPets,
    dbStatus,
    isLoading,
    fetchPets,
    fetchDbStatus,
    refresh,
  };
}
