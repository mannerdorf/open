import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { Building2, Check } from 'lucide-react-native';
import { useCompanies } from '@/contexts/CompanyContext';
import { useThemeColors } from '@/constants/colors';
import { useMemo, useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OtpInput from '@/components/OtpInput';

 type Step = 'enter-inn' | 'enter-code' | 'success';

export default function InnScreen() {
  const Colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { addCompany, validateINN, selectCompany } = useCompanies();

  const [step, setStep] = useState<Step>('enter-inn');
  const [inn, setInn] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleInnChange = useCallback((text: string) => {
    const cleaned = text.replace(/\D/g, '');
    setInn(cleaned);
    setError('');
  }, []);

  const handleSendCode = useCallback(async () => {
    if (!inn) {
      setError('Введите ИНН');
      return;
    }

    const validation = validateINN(inn);
    if (!validation.valid) {
      setError(validation.error ?? 'Неверный ИНН');
      return;
    }

    setIsLoading(true);
    setError('');
    await new Promise((r) => setTimeout(r, 500));
    setIsLoading(false);
    setStep('enter-code');
  }, [inn, validateINN]);

  const handleVerifyCode = useCallback(async () => {
    if (code.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }

    if (code !== '111111') {
      setError('Неверный код');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await addCompany(inn, code);

    setIsLoading(false);

    if (result.success && result.company) {
      await selectCompany(result.company.id);
      setStep('success');
      setTimeout(() => {
        console.log('Success timeout, navigating to home');
        router.push('/home');
      }, 1500);
    } else {
      setError(result.error ?? 'Ошибка добавления компании');
    }
  }, [code, addCompany, inn, selectCompany]);

  const handleCodeChange = useCallback((text: string) => {
    setCode(text);
    setError('');
    
    if (text.length === 6) {
      setTimeout(() => {
        if (text === '111111') {
          handleVerifyCode();
        }
      }, 100);
    }
  }, [handleVerifyCode]);

  const handleSkip = useCallback(() => {
    console.log('Skip button pressed, navigating to home');
    router.push('/home');
  }, []);

  const handleCancel = useCallback(() => {
    router.back();
  }, []);

  const renderEnterInn = useMemo(() => (
    <View style={[styles.formContainer, { backgroundColor: Colors.background }]} testID="inn-enter-inn">
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        testID="inn-skip-button"
      >
        <Text style={[styles.skipButtonText, { color: Colors.textSecondary }]}>Пропустить</Text>
      </TouchableOpacity>

      <View style={styles.formContent}>
        <View style={[styles.iconCircle, { backgroundColor: Colors.surface1 }]}>
          <Building2 size={48} color={Colors.primary} />
        </View>

        <Text style={[styles.formTitle, { color: Colors.text }]}>Введите ИНН компании</Text>
        <Text style={[styles.formDescription, { color: Colors.textSecondary }]}>Мы проверим компанию и отправим код подтверждения на почту руководителя</Text>

        <TextInput
          style={[styles.input, { backgroundColor: Colors.surface1, color: Colors.text, borderColor: error ? Colors.error : Colors.border }]}
          value={inn}
          onChangeText={handleInnChange}
          placeholder="ИНН (10 или 12 цифр)"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="number-pad"
          maxLength={12}
          autoFocus
          testID="inn-input"
        />

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: Colors.error }]}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: Colors.primary, opacity: isLoading ? 0.6 : 1 }]}
          onPress={handleSendCode}
          disabled={isLoading}
          testID="inn-send-code"
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={[styles.primaryButtonText, { color: Colors.white }]}>Получить код</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleCancel}
          testID="inn-cancel"
        >
          <Text style={[styles.secondaryButtonText, { color: Colors.textSecondary }]}>Отмена</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [Colors, error, inn, handleInnChange, handleSendCode, isLoading, handleSkip, handleCancel]);

  const renderEnterCode = useMemo(() => (
    <View style={[styles.formContainer, { backgroundColor: Colors.background }]} testID="inn-enter-code">
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        testID="inn-skip-button-code"
      >
        <Text style={[styles.skipButtonText, { color: Colors.textSecondary }]}>Пропустить</Text>
      </TouchableOpacity>

      <View style={styles.formContent}>
        <View style={[styles.iconCircle, { backgroundColor: Colors.surface1 }]}>
          <Building2 size={48} color={Colors.primary} />
        </View>

        <Text style={[styles.formTitle, { color: Colors.text }]}>Введите код подтверждения</Text>
        <Text style={[styles.formDescription, { color: Colors.textSecondary }]}>Код отправлен на почту руководителя компании</Text>

        <OtpInput
          length={6}
          value={code}
          onChangeText={handleCodeChange}
          autoFocus
        />

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: Colors.error }]}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: Colors.primary, opacity: isLoading ? 0.6 : 1 }]}
          onPress={handleVerifyCode}
          disabled={isLoading}
          testID="inn-verify-code"
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={[styles.primaryButtonText, { color: Colors.white }]}>Подтвердить</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => { setStep('enter-inn'); setCode(''); setError(''); }}
          testID="inn-back-button"
        >
          <Text style={[styles.secondaryButtonText, { color: Colors.textSecondary }]}>Отмена</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [Colors, code, error, isLoading, handleVerifyCode, handleSkip, handleCodeChange]);

  const renderSuccess = useMemo(() => (
    <View style={[styles.formContainer, { backgroundColor: Colors.background, paddingTop: insets.top + 100 }]} testID="inn-success">
      <View style={styles.formContent}>
        <View style={[styles.iconCircle, { backgroundColor: `${Colors.success}20` }]}>
          <Check size={48} color={Colors.success} strokeWidth={3} />
        </View>
        <Text style={[styles.formTitle, { color: Colors.text }]}>Компания добавлена</Text>
        <Text style={[styles.formDescription, { color: Colors.textSecondary }]}>Теперь вы можете управлять перевозками этой компании</Text>
      </View>
    </View>
  ), [Colors, insets.top]);

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      {step === 'enter-inn' && renderEnterInn}
      {step === 'enter-code' && renderEnterCode}
      {step === 'success' && renderSuccess}
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
