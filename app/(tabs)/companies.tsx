import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Building2, Plus, Trash2, Check, ArrowLeft } from 'lucide-react-native';
import { useCompanies } from '@/contexts/CompanyContext';
import { useThemeColors } from '@/constants/colors';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Step = 'list' | 'select-method';

export default function CompaniesScreen() {
  const Colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { companies, selectedCompanyId, removeCompany, selectCompany } = useCompanies();
  
  const [step, setStep] = useState<Step>('list');
  const params = useLocalSearchParams();

  const handleRemoveCompany = (companyId: string, companyName: string) => {
    if (Platform.OS === 'web') {
      const ok = window.confirm(`Удалить компанию «${companyName}»?`);
      if (ok) {
        void removeCompany(companyId);
      }
      return;
    }

    Alert.alert(
      'Удалить компанию',
      `Вы уверены, что хотите удалить ${companyName}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => removeCompany(companyId),
        },
      ]
    );
  };

  const handleCancel = () => {
    if (companies.length === 0) {
      router.push('/(tabs)/home');
    } else {
      setStep('list');
    }
  };

  useEffect(() => {
    const startParamRaw = params?.start;
    const startParam = Array.isArray(startParamRaw) ? startParamRaw[0] : startParamRaw;
    if ((companies?.length ?? 0) === 0) {
      if (startParam === 'select-method') {
        setStep('select-method');
      } else if (step === 'list') {
        setStep('select-method');
      }
    }
  }, [params, companies, step]);

  const renderList = () => (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} testID="companies-list">

      {companies.length === 0 ? (
        <View style={styles.emptyState}>
          <Building2 size={64} color={Colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: Colors.text }]}>Нет компаний</Text>
          <Text style={[styles.emptyDescription, { color: Colors.textSecondary }]}>
            Добавьте компанию по ИНН для управления перевозками
          </Text>
        </View>
      ) : (
        <View style={styles.companiesList}>
          {companies.map((company) => (
            <View key={company.id} style={[styles.companyCard, { backgroundColor: Colors.surface1 }]}>
              <TouchableOpacity
                style={styles.companyContent}
                onPress={() => selectCompany(company.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.companyIcon, { backgroundColor: Colors.surface2 }]}>
                  <Building2 size={24} color={Colors.primary} />
                </View>
                <View style={styles.companyInfo}>
                  <Text style={[styles.companyName, { color: Colors.text }]}>{company.name}</Text>
                  <Text style={[styles.companyInn, { color: Colors.textSecondary }]}>ИНН: {company.inn}</Text>
                </View>
                {selectedCompanyId === company.id && (
                  <View style={[styles.selectedBadge, { backgroundColor: Colors.primary }]}>
                    <Check size={16} color={Colors.white} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: `${Colors.error}15` }]}
                onPress={() => handleRemoveCompany(company.id, company.name)}
                activeOpacity={0.7}
              >
                <Trash2 size={22} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: Colors.primary }]}
        onPress={() => setStep('select-method')}
      >
        <Plus size={24} color={Colors.white} strokeWidth={2.5} />
        <Text style={[styles.addButtonText, { color: Colors.white }]}>Добавить компанию</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderSelectMethod = () => (
    <View style={[styles.formContainer, { backgroundColor: Colors.background }]} testID="select-method-screen">
      <View style={styles.formContent}>
        <View style={[styles.iconCircle, { backgroundColor: Colors.surface1 }]}>
          <Building2 size={48} color={Colors.primary} />
        </View>
        
        <Text style={[styles.formTitle, { color: Colors.text }]}>Выберите способ добавления</Text>
        <Text style={[styles.formDescription, { color: Colors.textSecondary }]}>
          Добавьте компанию по ИНН или используя логин и пароль
        </Text>

        <TouchableOpacity
          style={[styles.methodButton, { backgroundColor: Colors.surface1, borderColor: Colors.border }]}
          onPress={() => {
            console.log('По ИНН button pressed, navigating to /add-company-inn');
            router.push('/add-company-inn');
          }}
          activeOpacity={0.7}
          testID="inn-method-button"
        >
          <Text style={[styles.methodButtonTitle, { color: Colors.text }]}>По ИНН</Text>
          <Text style={[styles.methodButtonDescription, { color: Colors.textSecondary }]}>
            Введите ИНН компании для добавления
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.methodButton, { backgroundColor: Colors.surface1, borderColor: Colors.border }]}
          onPress={() => {
            console.log('По логину и паролю button pressed, navigating to /add-company-credentials');
            router.push('/add-company-credentials');
          }}
          activeOpacity={0.7}
          testID="credentials-method-button"
        >
          <Text style={[styles.methodButtonTitle, { color: Colors.text }]}>По логину и паролю</Text>
          <Text style={[styles.methodButtonDescription, { color: Colors.textSecondary }]}>
            Используйте логин и пароль для доступа
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={[styles.cancelButtonText, { color: Colors.textSecondary }]}>Отмена</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: Colors.background, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.topHeader, { paddingTop: insets.top + 12, backgroundColor: Colors.surface1 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.backButton} />
      </View>
      {step === 'list' && renderList()}
      {step === 'select-method' && renderSelectMethod()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 12,
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 80,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center' as const,
    paddingHorizontal: 40,
    lineHeight: 24,
  },
  companiesList: {
    gap: 12,
    marginBottom: 24,
  },
  companyCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  companyContent: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  companyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 17,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  companyInn: {
    fontSize: 14,
  },
  selectedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  addButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  formContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 100,
  },
  formContent: {
    alignItems: 'center' as const,
    gap: 20,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
    letterSpacing: -0.5,
  },
  formDescription: {
    fontSize: 16,
    textAlign: 'center' as const,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  cancelButton: {
    padding: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  methodButton: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  methodButtonTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  methodButtonDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
