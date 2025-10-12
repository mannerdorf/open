import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import {
  Weight,
  Boxes,
  MapPin,
  Calendar,
  Package,
  TrendingUp,
  Smartphone,
  Globe,
  Rocket,
} from 'lucide-react-native';

import { useAchievements } from '@/contexts/AchievementsContext';
import { useThemeColors } from '@/constants/colors';
import type { Achievement } from '@/types/achievements';

const iconMap: Record<string, any> = {
  weight: Weight,
  boxes: Boxes,
  'map-pin': MapPin,
  calendar: Calendar,
  package: Package,
  'trending-up': TrendingUp,
  smartphone: Smartphone,
  globe: Globe,
  rocket: Rocket,
};

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const Colors = useThemeColors();
  const { achievements, completedCount, totalCount } = useAchievements();
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Package;
  };

  const formatProgress = (achievement: Achievement) => {
    if (achievement.status === 'completed') return '100%';
    const percent = (achievement.progress / achievement.target) * 100;
    return `${Math.round(percent)}%`;
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'кг') return `${(value / 1000).toFixed(1)}т`;
    if (unit === 'м³') return `${value.toFixed(1)}м³`;
    if (unit === 'км') return `${(value / 1000).toFixed(0)}тыс км`;
    if (unit === 'дней') return `${value} ${value === 1 ? 'день' : value < 5 ? 'дня' : 'дней'}`;
    return `${value} ${unit}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
      >
        <View style={[styles.header, { backgroundColor: Colors.surface1 }]}>
          <Text style={[styles.headerTitle, { color: Colors.text }]}>Мои достижения</Text>
          <Text style={[styles.headerProgress, { color: Colors.primary }]}>
            {completedCount}/{totalCount}
          </Text>
          <View style={[styles.progressBar, { backgroundColor: Colors.surface2 }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: Colors.primary, width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.achievementsGrid}>
          {achievements.map((achievement) => {
            const Icon = getIcon(achievement.icon);
            const isLocked = achievement.status === 'locked';
            const isCompleted = achievement.status === 'completed';

            return (
              <TouchableOpacity
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  { backgroundColor: Colors.surface1 },
                  isLocked && { opacity: 0.5 },
                ]}
                onLongPress={() => setSelectedAchievement(achievement)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.achievementIcon,
                    { backgroundColor: achievement.color + '20' },
                    isCompleted && { backgroundColor: achievement.color },
                  ]}
                >
                  <Icon size={28} color={isCompleted ? '#FFFFFF' : achievement.color} />
                </View>
                <Text style={[styles.achievementTitle, { color: Colors.text }]} numberOfLines={2}>
                  {achievement.title}
                </Text>
                {!isLocked && (
                  <>
                    <View style={[styles.achievementProgressBar, { backgroundColor: Colors.surface2 }]}>
                      <View
                        style={[
                          styles.achievementProgressFill,
                          {
                            backgroundColor: achievement.color,
                            width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.achievementProgress, { color: Colors.textSecondary }]}>
                      {formatValue(achievement.progress, achievement.unit)} / {formatValue(achievement.target, achievement.unit)}
                    </Text>
                  </>
                )}
                {isLocked && (
                  <Text style={[styles.achievementLocked, { color: Colors.textSecondary }]}>Заблокировано</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        visible={selectedAchievement !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAchievement(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedAchievement(null)}>
          <View style={[styles.modalContent, { backgroundColor: Colors.surface1 }]}>
            {selectedAchievement && (
              <>
                <View
                  style={[
                    styles.modalIcon,
                    { backgroundColor: selectedAchievement.color + '20' },
                    selectedAchievement.status === 'completed' && { backgroundColor: selectedAchievement.color },
                  ]}
                >
                  {(() => {
                    const Icon = getIcon(selectedAchievement.icon);
                    return (
                      <Icon
                        size={48}
                        color={selectedAchievement.status === 'completed' ? '#FFFFFF' : selectedAchievement.color}
                      />
                    );
                  })()}
                </View>
                <Text style={[styles.modalTitle, { color: Colors.text }]}>{selectedAchievement.title}</Text>
                <Text style={[styles.modalDescription, { color: Colors.textSecondary }]}>
                  {selectedAchievement.description}
                </Text>
                <View style={[styles.modalProgressBar, { backgroundColor: Colors.surface2 }]}>
                  <View
                    style={[
                      styles.modalProgressFill,
                      {
                        backgroundColor: selectedAchievement.color,
                        width: `${Math.min((selectedAchievement.progress / selectedAchievement.target) * 100, 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.modalProgress, { color: Colors.text }]}>
                  {formatValue(selectedAchievement.progress, selectedAchievement.unit)} /{' '}
                  {formatValue(selectedAchievement.target, selectedAchievement.unit)} ({formatProgress(selectedAchievement)})
                </Text>
                {selectedAchievement.status === 'completed' && selectedAchievement.earnedAt && (
                  <Text style={[styles.modalEarned, { color: Colors.success }]}>
                    Получено {new Date(selectedAchievement.earnedAt).toLocaleDateString('ru-RU')}
                  </Text>
                )}
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    gap: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    textAlign: 'center' as const,
  },
  headerProgress: {
    fontSize: 20,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  progressBar: {
    height: 12,
    borderRadius: 8,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: 12,
    borderRadius: 8,
  },
  achievementsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  achievementCard: {
    width: '48%',
    borderRadius: 16,
    padding: 12,
    gap: 8,
    alignItems: 'center' as const,
    height: 140,
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  achievementTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
    minHeight: 32,
  },
  achievementProgressBar: {
    width: '100%',
    height: 6,
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  achievementProgressFill: {
    height: 6,
    borderRadius: 4,
  },
  achievementProgress: {
    fontSize: 10,
    textAlign: 'center' as const,
  },
  achievementLocked: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center' as const,
    gap: 16,
  },
  modalIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    textAlign: 'center' as const,
  },
  modalDescription: {
    fontSize: 16,
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  modalProgressBar: {
    width: '100%',
    height: 12,
    borderRadius: 8,
    overflow: 'hidden' as const,
  },
  modalProgressFill: {
    height: 12,
    borderRadius: 8,
  },
  modalProgress: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  modalEarned: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
