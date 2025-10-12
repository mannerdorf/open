import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Smartphone, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/constants/colors';
import OtpInput from '@/components/OtpInput';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { phone, isLogin } = useLocalSearchParams<{ phone: string; isLogin?: string }>();
  const { verifyOtp, signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const Colors = useThemeColors();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }

    setIsLoading(true);
    setError('');

    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = '+' + cleanPhone;
    const result = await verifyOtp(formattedPhone, code);

    setIsLoading(false);

    if (result.success) {
      router.replace('/setup-security');
    } else {
      setError(result.error || 'Неверный код верификации');
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setCanResend(false);
    setResendTimer(60);
    setError('');

    try {
      const result = await signIn(phone);
      
      if (result.success) {
        Alert.alert('Успешно', 'SMS с кодом отправлено повторно');
      } else {
        setError(result.error || 'Не удалось отправить код повторно');
        setCanResend(true);
        setResendTimer(0);
      }
    } catch (error) {
      console.error('Resend error:', error);
      setError('Не удалось отправить код повторно');
      setCanResend(true);
      setResendTimer(0);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: Colors.surface1 }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: Colors.surface1 }]}>
            <Smartphone size={48} color={Colors.primary} strokeWidth={2} />
          </View>
          <Text style={[styles.title, { color: Colors.text }]}>Проверьте SMS</Text>
          <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
            Мы отправили код на номер{"\n"}<Text style={[styles.email, { color: Colors.primary }]}>{phone}</Text>
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: Colors.text }]}>Код из SMS</Text>
            <OtpInput
              length={6}
              value={code}
              onChangeText={setCode}
              onComplete={handleVerify}
              disabled={isLoading}
              autoFocus
            />
          </View>

          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: Colors.surface1, borderLeftColor: Colors.error }]}>
              <Text style={[styles.errorText, { color: Colors.error }]}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: Colors.primary }, isLoading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={[styles.buttonText, { color: Colors.white }]}>Подтвердить</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={[styles.resendText, { color: Colors.textSecondary }]}>Не получили код?</Text>
            {canResend ? (
              <TouchableOpacity onPress={handleResend}>
                <Text style={[styles.resendLink, { color: Colors.primary }]}>Отправить повторно</Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.resendTimer, { color: Colors.textSecondary }]}>
                Повторная отправка через {resendTimer} сек
              </Text>
            )}
          </View>
        </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 56,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  email: {
    fontWeight: '600' as const,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 28,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  errorContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 3,
  },
  errorText: {
    fontSize: 15,
  },
  button: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  resendContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: 28,
    gap: 8,
  },
  resendText: {
    fontSize: 15,
  },
  resendLink: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  resendTimer: {
    fontSize: 15,
  },
});
