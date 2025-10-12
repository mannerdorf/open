import { Stack } from 'expo-router';
import { DashboardSettingsProvider } from '@/contexts/DashboardSettingsContext';
import { useThemeColors } from '@/constants/colors';

export default function SettingsLayout() {
  const Colors = useThemeColors();
  return (
    <DashboardSettingsProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      />
    </DashboardSettingsProvider>
  );
}
