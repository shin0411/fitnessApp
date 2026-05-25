import { useState, useRef } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { useLevels } from './useLevels';
import { useUserStore } from '../store/userStore';
import { ActivityType } from '../types';

interface Coord { latitude: number; longitude: number }

function haversineMeters(a: Coord, b: Coord): number {
  const R = 6371000;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function useGpsSession() {
  const profile = useUserStore((s) => s.profile);
  const { addXp } = useLevels();

  const [isTracking, setIsTracking] = useState(false);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [activityType, setActivityType] = useState<ActivityType>('walk');

  const subRef = useRef<Location.LocationSubscription | null>(null);
  const startRef = useRef(0);
  const coordsRef = useRef<Coord[]>([]);
  const distRef = useRef(0);

  async function startTracking(type: ActivityType): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return false;
    setActivityType(type);
    setIsTracking(true);
    setDistanceMeters(0);
    startRef.current = Date.now();
    coordsRef.current = [];
    distRef.current = 0;

    subRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
      (loc) => {
        const coord: Coord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        const prev = coordsRef.current[coordsRef.current.length - 1];
        if (prev) {
          distRef.current += haversineMeters(prev, coord);
          setDistanceMeters(distRef.current);
        }
        coordsRef.current.push(coord);
      }
    );
    return true;
  }

  async function stopTracking(): Promise<number> {
    subRef.current?.remove();
    setIsTracking(false);
    const durationSeconds = Math.round((Date.now() - startRef.current) / 1000);
    const distKm = distRef.current / 1000;
    const xpEarned = Math.min(Math.floor(distKm * 50 + (durationSeconds / 60) * 2), 300);

    if (profile?.id && distRef.current > 10) {
      await supabase.from('gps_sessions').insert({
        user_id: profile.id,
        activity_type: activityType,
        distance_meters: Math.round(distRef.current),
        duration_seconds: durationSeconds,
        physical_xp_earned: xpEarned,
      });
      if (xpEarned > 0) await addXp('physical', xpEarned);
    }

    const result = xpEarned;
    setDistanceMeters(0);
    return result;
  }

  return { isTracking, distanceMeters, activityType, startTracking, stopTracking };
}
