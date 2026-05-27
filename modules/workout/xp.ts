/**
 * Workout XP calculation module.
 */

const MAX_WORKOUT_XP = 500;

/**
 * Calculate physical XP from a completed workout session.
 *
 * @param totalSets - Number of sets completed
 * @param totalVolume - Total volume in kg (weight × reps)
 * @param durationMinutes - Session duration in minutes
 */
export function calcWorkoutXp(
  totalSets: number,
  totalVolume: number,
  durationMinutes: number
): number {
  const base = totalSets * 15 + totalVolume * 0.01 + durationMinutes * 2;
  return Math.min(Math.floor(base), MAX_WORKOUT_XP);
}

/**
 * Calculate XP for a GPS activity session.
 *
 * @param distanceKm - Distance covered in km
 * @param durationSeconds - Session duration in seconds
 */
export function calcGpsXp(distanceKm: number, durationSeconds: number): number {
  const MAX_GPS_XP = 300;
  const xp = distanceKm * 50 + (durationSeconds / 60) * 2;
  return Math.min(Math.floor(xp), MAX_GPS_XP);
}

/**
 * Determine if a set is a personal record given previous bests.
 */
export function isPersonalRecord(
  exerciseId: string,
  weight: number,
  reps: number,
  previousBests: Record<string, { weight: number; reps: number }>
): boolean {
  const prev = previousBests[exerciseId];
  if (!prev) return true;
  const newVolume = weight * reps;
  const prevVolume = prev.weight * prev.reps;
  return newVolume > prevVolume;
}
