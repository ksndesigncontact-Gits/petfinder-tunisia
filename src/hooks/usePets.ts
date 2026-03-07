import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Pet, Match, DbStatus } from '../types';
import { haversineKm } from '../utils/matching';

const REFRESH_INTERVAL = 30_000;

export function usePets(userLocation: [number, number] | null, radiusKm: number | null) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [myReports, setMyReports] = useState<number[]>(() => {
    const saved = localStorage.getItem('petfinder_myReports');
    return saved ? JSON.parse(saved) : [];
  });

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

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch('/api/matches');
      const data = await res.json();
      if (Array.isArray(data)) setMatches(data);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
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

  const addMyReport = useCallback((id: number) => {
    setMyReports(prev => {
      const updated = [...prev, id];
      localStorage.setItem('petfinder_myReports', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([
      fetchPets(),
      fetchMatches(),
      fetch('/api/matches/recheck', { method: 'POST' }).catch(() => {}),
    ]);
  }, [fetchPets, fetchMatches]);

  useEffect(() => {
    fetchPets();
    fetchMatches();
    fetchDbStatus();
    const interval = setInterval(() => {
      fetchPets();
      fetchMatches();
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchPets, fetchMatches, fetchDbStatus]);

  // Filter pets by radius
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
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [pets, radiusKm, userLocation]);

  // Filter matches relevant to user
  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      if (m.status !== 'pending') return false;
      const isMyLost = myReports.includes(m.lost_report_id);
      const isMyFound = myReports.includes(m.found_report_id);
      if (!isMyLost && !isMyFound) return false;

      const pet = isMyLost ? m.lost_report : m.found_report;
      if (!pet) return false;

      if (radiusKm && userLocation && pet.lat && pet.lng) {
        return haversineKm(userLocation[0], userLocation[1], pet.lat, pet.lng) <= radiusKm;
      }
      return true;
    });
  }, [matches, radiusKm, userLocation, myReports]);

  const getPetMatch = useCallback((petId: number) => {
    return matches.find(m => m.lost_report_id === petId || m.found_report_id === petId);
  }, [matches]);

  return {
    pets,
    filteredPets,
    matches,
    filteredMatches,
    dbStatus,
    isLoading,
    myReports,
    addMyReport,
    fetchPets,
    fetchMatches,
    fetchDbStatus,
    refresh,
    getPetMatch,
  };
}
