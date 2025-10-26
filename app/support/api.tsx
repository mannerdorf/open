import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Menu, Code, Key, Database, Zap } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function APIScreen() {
  const Colors = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleRequestIntegration = () => {
    router.push({
      pathname: '/support/chat',
      params: {
        prefilledMessage: 'Здравствуйте! Я хотел бы запросить API интеграцию для моего приложения. Прошу предоставить доступ к API и документацию.'
      }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: Colors.surface1, borderBottomColor: Colors.border }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            accessibilityRole="button"
            testID="api-back-button"
            onPress={() => {
              try {
                console.log('[API] Back pressed');
                if (router.canGoBack?.()) {
                  console.log('[API] canGoBack = true, navigating back');
                  router.back();
                } else {
                  console.log('[API] canGoBack = false, replacing to Support tab');
                  router.replace('/(tabs)/support');
                }
              } catch (e) {
                console.error('[API] Error handling back, fallback replace to home', e);
                try {
                  router.replace('/(tabs)/home');
                } catch {}
              }
            }}
            style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
            <Menu size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.flex}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.heroSection, { backgroundColor: Colors.primary }]}>
          <Code size={48} color="#FFFFFF" />
          <Text style={styles.heroTitle}>API Интеграция HAULZ</Text>
          <Text style={styles.heroSubtitle}>
            Интегрируйте наш сервис в свои приложения
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: Colors.surface1 }]}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>
            Описание API
          </Text>
          <Text style={[styles.description, { color: Colors.textSecondary }]}>
            HAULZ API позволяет получить доступ к функционалу платформы для управления перевозками, создания и отслеживания заказов, работы с документами и многого другого.
          </Text>
        </View>

        <View style={styles.featuresGrid}>
          <View style={[styles.featureCard, { backgroundColor: Colors.surface1 }]}>
            <View style={[styles.iconCircle, { backgroundColor: Colors.primary + '20' }]}>
              <Database size={24} color={Colors.primary} />
            </View>
            <Text style={[styles.featureTitle, { color: Colors.text }]}>
              Управление заказами
            </Text>
            <Text style={[styles.featureDescription, { color: Colors.textSecondary }]}>
              Создание, изменение и отслеживание заказов на перевозку
            </Text>
          </View>

          <View style={[styles.featureCard, { backgroundColor: Colors.surface1 }]}>
            <View style={[styles.iconCircle, { backgroundColor: Colors.primary + '20' }]}>
              <Key size={24} color={Colors.primary} />
            </View>
            <Text style={[styles.featureTitle, { color: Colors.text }]}>
              Безопасность
            </Text>
            <Text style={[styles.featureDescription, { color: Colors.textSecondary }]}>
              OAuth 2.0 аутентификация и шифрование данных
            </Text>
          </View>

          <View style={[styles.featureCard, { backgroundColor: Colors.surface1 }]}>
            <View style={[styles.iconCircle, { backgroundColor: Colors.primary + '20' }]}>
              <Zap size={24} color={Colors.primary} />
            </View>
            <Text style={[styles.featureTitle, { color: Colors.text }]}>
              Быстродействие
            </Text>
            <Text style={[styles.featureDescription, { color: Colors.textSecondary }]}>
              Высокая производительность и минимальная задержка
            </Text>
          </View>

          <View style={[styles.featureCard, { backgroundColor: Colors.surface1 }]}>
            <View style={[styles.iconCircle, { backgroundColor: Colors.primary + '20' }]}>
              <Code size={24} color={Colors.primary} />
            </View>
            <Text style={[styles.featureTitle, { color: Colors.text }]}>
              RESTful API
            </Text>
            <Text style={[styles.featureDescription, { color: Colors.textSecondary }]}>
              Стандартный REST API с JSON форматом данных
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: Colors.surface1 }]}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>
            Основные возможности
          </Text>
          <View style={styles.list}>
            <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
              • Создание и управление заказами
            </Text>
            <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
              • Получение информации о перевозках
            </Text>
            <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
              • Работа с документами (счета, акты, УПД)
            </Text>
            <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
              • Управление компаниями и контрагентами
            </Text>
            <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
              • Получение уведомлений в реальном времени
            </Text>
            <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
              • Интеграция с 1С
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: Colors.surface1 }]}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>
            Тарифы
          </Text>
          <Text style={[styles.description, { color: Colors.textSecondary }]}>
            Мы предлагаем гибкие тарифные планы для разных объемов запросов. Базовый доступ к API предоставляется бесплатно для зарегистрированных пользователей с лимитом 1000 запросов в месяц.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.requestButton, { backgroundColor: Colors.primary }]}
          onPress={handleRequestIntegration}
          activeOpacity={0.8}
        >
          <Text style={styles.requestButtonText}>Запросить интеграцию</Text>
        </TouchableOpacity>

        <Text style={[styles.footerText, { color: Colors.textSecondary }]}>
          После запроса наша команда свяжется с вами для предоставления API ключа и документации
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  backButton: {
    marginRight: 16,
  },
  content: {
    padding: 16,
  },
  heroSection: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginTop: 16,
    textAlign: 'center' as const,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    textAlign: 'center' as const,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  featuresGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
    marginBottom: 16,
  },
  featureCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  list: {
    gap: 8,
  },
  listItem: {
    fontSize: 15,
    lineHeight: 22,
  },
  requestButton: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600' as const,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center' as const,
    marginBottom: 20,
  },
});
