import { Tabs } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'ホーム', tabBarIcon: () => null }} />
      <Tabs.Screen name="log" options={{ title: '記録', tabBarIcon: () => null }} />
      <Tabs.Screen name="quiz" options={{ title: 'クイズ', tabBarIcon: () => null }} />
      <Tabs.Screen name="nutrition" options={{ title: '食事', tabBarIcon: () => null }} />
      <Tabs.Screen name="analyze" options={{ title: 'AI診断', tabBarIcon: () => null }} />
      <Tabs.Screen name="peer" options={{ title: '対戦', tabBarIcon: () => null }} />
      <Tabs.Screen name="profile" options={{ title: '設定', tabBarIcon: () => null }} />
    </Tabs>
  );
}
