import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronDown, ChevronUp, ArrowLeft, Menu } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'Как создать новый заказ?',
    answer: 'Для создания нового заказа перейдите на вкладку "Заказы" и нажмите кнопку "Создать заказ". Заполните все необходимые поля: адрес погрузки, адрес разгрузки, тип груза и другие детали.',
  },
  {
    id: '2',
    question: 'Как отследить статус заказа?',
    answer: 'Вы можете отследить статус заказа на вкладке "Заказы". Нажмите на нужный заказ, чтобы увидеть подробную информацию и текущий статус выполнения.',
  },
  {
    id: '3',
    question: 'Как изменить данные профиля?',
    answer: 'Перейдите в раздел "Профиль" и нажмите на кнопку редактирования. Вы сможете изменить имя, контактные данные и другую информацию.',
  },
  {
    id: '4',
    question: 'Как настроить уведомления?',
    answer: 'В разделе "Профиль" выберите "Настройки" → "Уведомления". Здесь вы можете настроить типы уведомлений и режим "Не беспокоить".',
  },
  {
    id: '5',
    question: 'Как обеспечивается безопасность данных?',
    answer: 'Мы используем современные методы шифрования для защиты ваших данных. Вы можете дополнительно настроить биометрическую защиту в разделе "Настройки" → "Безопасность".',
  },
  {
    id: '6',
    question: 'Как связаться с поддержкой?',
    answer: 'Вы можете связаться с нами через чат в разделе "Поддержка", позвонить по телефону +7 (495) 123-45-67 или написать на email support@haulz.pro.',
  },
  {
    id: '7',
    question: 'Как добавить новую компанию?',
    answer: 'Перейдите в раздел "Компании" и нажмите кнопку "Добавить компанию". Заполните информацию о компании: название, ИНН, адрес и контактные данные.',
  },
  {
    id: '8',
    question: 'Можно ли отменить заказ?',
    answer: 'Да, вы можете отменить заказ до момента его подтверждения перевозчиком. Откройте детали заказа и выберите опцию "Отменить заказ".',
  },
];

export default function FAQScreen() {
  const Colors = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: Colors.surface1, borderBottomColor: Colors.border }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            accessibilityRole="button"
            testID="faq-back-button"
            onPress={() => {
              try {
                console.log('[FAQ] Back pressed');
                if (router.canGoBack?.()) {
                  console.log('[FAQ] canGoBack = true, navigating back');
                  router.back();
                } else {
                  console.log('[FAQ] canGoBack = false, replacing to Support tab');
                  router.replace('/(tabs)/support');
                }
              } catch (e) {
                console.error('[FAQ] Error handling back, fallback replace to home', e);
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
        {faqData.map((item) => {
          const isExpanded = expandedId === item.id;
          
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.faqItem, { backgroundColor: Colors.surface1 }]}
              onPress={() => toggleExpand(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.questionContainer}>
                <Text style={[styles.question, { color: Colors.text }]}>
                  {item.question}
                </Text>
                {isExpanded ? (
                  <ChevronUp size={20} color={Colors.primary} />
                ) : (
                  <ChevronDown size={20} color={Colors.textSecondary} />
                )}
              </View>
              
              {isExpanded && (
                <Text style={[styles.answer, { color: Colors.textSecondary }]}>
                  {item.answer}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
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
  faqItem: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  questionContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  question: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  answer: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
  },
});
