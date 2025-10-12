import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { Building2, Check } from 'lucide-react-native';
import { useCompanies } from '@/contexts/CompanyContext';
import { useThemeColors } from '@/constants/colors';
import { useState, useCallback, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Step = 'enter-credentials' | 'success' | 'error';

export default function CredentialsScreen() {
  const Colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { addCompanyByCredentials, selectCompany } = useCompanies();

  const [step, setStep] = useState<Step>('enter-credentials');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const handleVerifyCredentials = useCallback(async () => {
    if (!email || !password) {
      setError('Введите логин и пароль');
      return;
    }

    if (!validateEmail(email)) {
      setError('Неверный формат email');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await addCompanyByCredentials(email, password);

    setIsLoading(false);

    if (result.success && result.company) {
      await selectCompany(result.company.id);
      setStep('success');
      setTimeout(() => {
        console.log('Success timeout, navigating to home');
        router.push('/home');
      }, 1500);
    } else {
      setErrorMessage(result.error || 'Ошибка добавления компании');
      setStep('error');
    }
  }, [email, password, validateEmail, addCompanyByCredentials, selectCompany]);

  const handleSkip = useCallback(() => {
    console.log('Skip button pressed, navigating to home');
    router.push('/home');
  }, []);

  const handleCancel = useCallback(() => {
    router.back();
  }, []);

  const renderEnterCredentials = useMemo(() => (
    <View style={[styles.formContainer, { backgroundColor: Colors.background }]} testID="credentials-enter">
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        testID="credentials-skip-button"
      >
        <Text style={[styles.skipButtonText, { color: Colors.textSecondary }]}>Пропустить</Text>
      </TouchableOpacity>

      <View style={styles.formContent}>
        <View style={[styles.iconCircle, { backgroundColor: Colors.surface1 }]}>
          <Building2 size={48} color={Colors.primary} />
        </View>

        <Text style={[styles.formTitle, { color: Colors.text }]}>Введите логин и пароль</Text>
        <Text style={[styles.formDescription, { color: Colors.textSecondary }]}>
          Используйте ваши учетные данные для доступа к перевозкам
        </Text>

        <TextInput
          style={[styles.input, { backgroundColor: Colors.surface1, color: Colors.text, borderColor: error ? Colors.error : Colors.border }]}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError('');
          }}
          placeholder="Логин (email)"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          testID="credentials-email-input"
        />

        <TextInput
          style={[styles.input, { backgroundColor: Colors.surface1, color: Colors.text, borderColor: error ? Colors.error : Colors.border }]}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError('');
          }}
          placeholder="Пароль"
          placeholderTextColor={Colors.textSecondary}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          testID="credentials-password-input"
        />

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: Colors.error }]}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: Colors.primary, opacity: isLoading ? 0.6 : 1 }]}
          onPress={handleVerifyCredentials}
          disabled={isLoading}
          testID="credentials-submit"
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={[styles.primaryButtonText, { color: Colors.white }]}>Подтвердить</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleCancel}
          testID="credentials-cancel"
        >
          <Text style={[styles.secondaryButtonText, { color: Colors.textSecondary }]}>Отмена</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [Colors, email, password, error, isLoading, handleVerifyCredentials, handleSkip, handleCancel]);

  const renderSuccess = useMemo(() => (
    <View style={[styles.formContainer, { backgroundColor: Colors.background, paddingTop: insets.top + 100 }]} testID="credentials-success">
      <View style={styles.formContent}>
        <View style={[styles.iconCircle, { backgroundColor: `${Colors.success}20` }]}>
          <Check size={48} color={Colors.success} strokeWidth={3} />
        </View>
        <Text style={[styles.formTitle, { color: Colors.text }]}>Компания добавлена</Text>
        <Text style={[styles.formDescription, { color: Colors.textSecondary }]}>
          Теперь вы можете управлять перевозками этой компании
        </Text>
      </View>
    </View>
  ), [Colors, insets.top]);

  const renderError = useMemo(() => (
    <View style={[styles.formContainer, { backgroundColor: Colors.background }]} testID="credentials-error">
      <View style={styles.formContent}>
        <View style={[styles.iconCircle, { backgroundColor: `${Colors.error}20` }]}>
          <Building2 size={48} color={Colors.error} />
        </View>

        <Text style={[styles.formTitle, { color: Colors.text }]}>Не удалось добавить компанию</Text>
        <Text style={[styles.formDescription, { color: Colors.textSecondary }]}>
          {errorMessage || 'Авторизация не найдена. Проверьте логин и пароль.'}
        </Text>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: Colors.primary }]}
          onPress={() => {
            setStep('enter-credentials');
            setErrorMessage('');
            setError('');
          }}
          testID="credentials-retry"
        >
          <Text style={[styles.primaryButtonText, { color: Colors.white }]}>Попробовать снова</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleCancel}
          testID="credentials-cancel-error"
        >
          <Text style={[styles.secondaryButtonText, { color: Colors.textSecondary }]}>Отмена</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [Colors, errorMessage, handleCancel]);

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      {step === 'enter-credentials' && renderEnterCredentials}
      {step === 'success' && renderSuccess}
      {step === 'error' && renderError}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  input: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 17,
    borderWidth: 1,
  },
  errorContainer: {
    width: '100%',
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center' as const,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  secondaryButton: {
    width: '100%',
    height: 56,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '500' as const,
  },
  skipButton: {
    position: 'absolute' as const,
    top: 20,
    right: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
});
