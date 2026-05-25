import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../hooks/useAuth';
import { useThemeStore } from '../store/themeStore';
import { ThemeProvider } from '../theme/ThemeProvider';
import { useUserStore } from '../store/userStore';

export default function RootLayout() {
  const { session, loading } = useAuth();
  const { themeName, loadTheme } = useThemeStore();
  const profile = useUserStore((s) => s.profile);

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace('/(auth)/login');
    } else if (session && profile && !profile.onboarding_completed) {
      router.replace('/goal-setup');
    } else if (session) {
      router.replace('/(tabs)');
    }
  }, [session, loading, profile?.onboarding_completed]);

  return (
    <ThemeProvider themeName={themeName}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="goal-setup" />
        <Stack.Screen name="theme-settings" />
        <Stack.Screen name="achievements" />
        <Stack.Screen name="progress" />
        <Stack.Screen name="ranking" />
        <Stack.Screen name="guild" />
        <Stack.Screen name="share-card" />
      </Stack>
    </ThemeProvider>
  );
}
