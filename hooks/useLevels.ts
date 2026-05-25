import { useUserStore } from '../store/userStore';
import { supabase } from '../lib/supabase';
import { levelFromXp, xpToNextLevel, getTitleForLevel, calcComprehensiveXp } from '../modules/levels/xp';
import { LevelType } from '../types';

export function useLevels() {
  const { levels, profile, setLevels } = useUserStore();

  function getLevelInfo(levelType: LevelType) {
    const lvl = levels[levelType];
    if (!lvl) return { level: 1, totalXp: 0, title: '', progress: { current: 0, required: 1, level: 1 } };
    const progress = xpToNextLevel(lvl.total_xp);
    return {
      level: lvl.level,
      totalXp: lvl.total_xp,
      title: lvl.current_title,
      progress,
    };
  }

  async function addXp(levelType: LevelType, xpAmount: number): Promise<{ leveledUp: boolean; newLevel: number }> {
    if (!profile?.id) return { leveledUp: false, newLevel: 1 };

    const current = levels[levelType];
    const currentXp = current?.total_xp ?? 0;
    const newTotalXp = currentXp + xpAmount;
    const newLevel = levelFromXp(newTotalXp);
    const newTitle = getTitleForLevel(newLevel, levelType);
    const leveledUp = newLevel > (current?.level ?? 1);

    await supabase.from('user_levels').upsert({
      user_id: profile.id,
      level_type: levelType,
      level: newLevel,
      total_xp: newTotalXp,
      current_title: newTitle,
      updated_at: new Date().toISOString(),
    });

    if (levelType !== 'comprehensive') {
      const physXp = levelType === 'physical' ? newTotalXp : (levels['physical']?.total_xp ?? 0);
      const beauXp = levelType === 'beauty' ? newTotalXp : (levels['beauty']?.total_xp ?? 0);
      const knowXp = levelType === 'knowledge' ? newTotalXp : (levels['knowledge']?.total_xp ?? 0);
      const compXp = calcComprehensiveXp(physXp, beauXp, knowXp);
      const compLevel = levelFromXp(compXp);
      const compTitle = getTitleForLevel(compLevel, 'comprehensive');
      await supabase.from('user_levels').upsert({
        user_id: profile.id,
        level_type: 'comprehensive',
        level: compLevel,
        total_xp: compXp,
        current_title: compTitle,
        updated_at: new Date().toISOString(),
      });
    }

    const { data } = await supabase.from('user_levels').select('*').eq('user_id', profile.id);
    if (data) setLevels(data as never);

    return { leveledUp, newLevel };
  }

  return { levels, getLevelInfo, addXp };
}
