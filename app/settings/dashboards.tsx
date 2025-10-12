import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/constants/colors';
import { ChevronLeft } from 'lucide-react-native';
import { useDashboardSettings, type DashboardKey } from '@/contexts/DashboardSettingsContext';

type DashboardItem = { key: DashboardKey; title: string; description: string };

const DASHBOARDS: DashboardItem[] = [
  { key: 'main_tiles', title: 'Плитки главной', description: 'Основные KPI и метрики на главной' },
  { key: 'sla', title: 'SLA', description: 'Соблюдение сроков и качество сервиса' },
  { key: 'cashflow', title: 'Кэшфлоу', description: 'Движение денежных средств' },
  { key: 'delivery_forecast', title: 'Прогноз доставки', description: 'Вероятность доставки вовремя' },
  { key: 'damage_monitor', title: 'Монитор ущерба/повреждения', description: 'Претензии по перевозкам и статусы' },
  { key: 'edo_monitor', title: 'Монитор ЭДО', description: 'Всего/подписано/не подписано по ЭР/УПД/АПП' },
];


export default function DashboardsSettingsScreen() {
  const Colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { enabled, toggle } = useDashboardSettings();

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]} testID="dashboards-settings-screen">
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Дашборды',
          headerStyle: { backgroundColor: Colors.surface1 },
          headerTintColor: Colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton} testID="back-button">
              <ChevronLeft size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 + insets.bottom }]}>        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Отображение дашбордов</Text>
          {DASHBOARDS.map((item) => (
            <View key={item.key} style={[styles.row, { backgroundColor: Colors.surface1 }]} testID={`row-${item.key}`}>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: Colors.text }]}>{item.title}</Text>
                <Text style={[styles.rowDesc, { color: Colors.textSecondary }]}>{item.description}</Text>
              </View>
              <Switch
                value={enabled[item.key]}
                onValueChange={(v) => toggle(item.key, v)}
                trackColor={{ false: Colors.surface2, true: Colors.primaryLight }}
                thumbColor={enabled[item.key] ? Colors.primary : Colors.textSecondary}
                testID={`switch-${item.key}`}
              />
            </View>
          ))}
        </View>

        <View style={styles.hintBox} testID="hint-box">
          <Text style={[styles.hintTitle, { color: Colors.text }]}>Как это работает</Text>
          <Text style={[styles.hintText, { color: Colors.textSecondary }]}>
            Вы можете скрыть любой дашборд, отключив тумблер. Эти настройки применяются к отображению на главном экране и соответствующих разделах.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: { padding: 8, marginLeft: 8 },
  content: { flex: 1 },
  scrollContent: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700' as const, marginBottom: 12, paddingHorizontal: 4 },
  row: { flexDirection: 'row' as const, alignItems: 'center' as const, padding: 16, borderRadius: 16, marginBottom: 8, gap: 12 },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '600' as const },
  rowDesc: { fontSize: 13 },
  hintBox: { padding: 16, borderRadius: 16, marginTop: 8 },
  hintTitle: { fontSize: 16, fontWeight: '700' as const, marginBottom: 6 },
  hintText: { fontSize: 14, lineHeight: 20 },
});
