import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Phone, Mail, MessageCircle, HelpCircle, ChevronRight, Menu, AlertTriangle, Settings, Code } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useRouter } from 'expo-router';

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const Colors = useThemeColors();
  const router = useRouter();

  const handleCall = useCallback(() => {
    console.log('[Support] Call pressed');
    Linking.openURL('tel:+74951234567').catch((e) => {
      console.error('Call error', e);
      Alert.alert('Ошибка', 'Не удалось открыть приложение для звонков');
    });
  }, []);

  const handleEmail = useCallback(() => {
    console.log('[Support] Email pressed');
    Linking.openURL('mailto:support@haulz.pro').catch((e) => {
      console.error('Email error', e);
      Alert.alert('Ошибка', 'Не удалось открыть почтовое приложение');
    });
  }, []);

  const handleChat = useCallback(() => {
    console.log('[Support] Chat pressed');
    router.push('/support/chat');
  }, [router]);

  const handleFAQ = useCallback(() => {
    console.log('[Support] FAQ pressed');
    router.push('/support/faq');
  }, [router]);

  const handleReportError = useCallback(() => {
    console.log('[Support] Report Error pressed');
    router.push('/support/report-error');
  }, [router]);

  const handleTestAPI = useCallback(() => {
    console.log('[Support] Test API pressed');
    router.push('/test-api');
  }, [router]);

  const handleAPIIntegration = useCallback(() => {
    console.log('[Support] API Integration pressed');
    router.push('/support/api');
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20, backgroundColor: Colors.surface1 }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: Colors.text }]} testID="support-title">Поддержка</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
            <Menu size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} testID="support-scroll">
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Связаться с нами</Text>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: Colors.surface1 }]} 
            onPress={handleChat}
            testID="contact-chat"
            accessibilityRole="button"
            accessibilityLabel="Написать в чат поддержки"
          >
            <View style={[styles.menuIcon, { backgroundColor: Colors.surface2 }]}>
              <MessageCircle size={20} color={Colors.primary} />
            </View>
            <Text style={[styles.menuText, { color: Colors.text }]}>Написать в чат</Text>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: Colors.surface1 }]} 
            onPress={handleCall}
            testID="contact-call"
            accessibilityRole="button"
            accessibilityLabel="Позвонить в поддержку"
          >
            <View style={[styles.menuIcon, { backgroundColor: Colors.surface2 }]}>
              <Phone size={20} color={Colors.primary} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={[styles.menuText, { color: Colors.text }]}>Позвонить</Text>
              <Text style={[styles.menuSubtext, { color: Colors.textSecondary }]}>+7 (495) 123-45-67</Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: Colors.surface1 }]} 
            onPress={handleEmail}
            testID="contact-email"
            accessibilityRole="button"
            accessibilityLabel="Написать на email поддержку"
          >
            <View style={[styles.menuIcon, { backgroundColor: Colors.surface2 }]}>
              <Mail size={20} color={Colors.primary} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={[styles.menuText, { color: Colors.text }]}>Email</Text>
              <Text style={[styles.menuSubtext, { color: Colors.textSecondary }]}>support@haulz.pro</Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: Colors.surface1 }]} 
            onPress={handleReportError}
            testID="report-error-button"
            accessibilityRole="button"
            accessibilityLabel="Сообщить об ошибке"
          >
            <View style={[styles.menuIcon, { backgroundColor: Colors.surface2 }]}>
              <AlertTriangle size={20} color={Colors.primary} />
            </View>
            <Text style={[styles.menuText, { color: Colors.text }]}>Сообщить об ошибке</Text>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Информация</Text>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: Colors.surface1 }]} 
            onPress={handleFAQ}
            testID="faq-button"
            accessibilityRole="button"
            accessibilityLabel="Часто задаваемые вопросы"
          >
            <View style={[styles.menuIcon, { backgroundColor: Colors.surface2 }]}>
              <HelpCircle size={20} color={Colors.primary} />
            </View>
            <Text style={[styles.menuText, { color: Colors.text }]}>Часто задаваемые вопросы</Text>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: Colors.surface1 }]} 
            onPress={handleAPIIntegration}
            testID="api-integration-button"
            accessibilityRole="button"
            accessibilityLabel="API Интеграция"
          >
            <View style={[styles.menuIcon, { backgroundColor: Colors.surface2 }]}>
              <Code size={20} color={Colors.primary} />
            </View>
            <Text style={[styles.menuText, { color: Colors.text }]}>API Интеграция</Text>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: Colors.surface1 }]} 
            onPress={handleTestAPI}
            testID="test-api-button"
            accessibilityRole="button"
            accessibilityLabel="Тест API"
          >
            <View style={[styles.menuIcon, { backgroundColor: Colors.surface2 }]}>
              <Settings size={20} color={Colors.primary} />
            </View>
            <Text style={[styles.menuText, { color: Colors.text }]}>Тест API</Text>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row' as const,
    padding: 18,
    borderRadius: 16,
    marginBottom: 8,
    alignItems: 'center' as const,
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  menuInfo: {
    flex: 1,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  menuSubtext: {
    fontSize: 14,
    marginTop: 2,
  },
});
