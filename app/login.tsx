import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/constants/colors';
import OtpInput from '@/components/OtpInput';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const Colors = useThemeColors();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const formatPhoneNumber = (text: string) => {
    let cleaned = text.replace(/\D/g, '');
    
    if (cleaned.length === 0) {
      return '+7';
    }
    
    if (cleaned.startsWith('8')) {
      cleaned = '7' + cleaned.slice(1);
    } else if (!cleaned.startsWith('7')) {
      cleaned = '7' + cleaned;
    }
    
    cleaned = cleaned.slice(0, 11);
    
    const match = cleaned.match(/^7(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
    
    if (match) {
      let formatted = '+7';
      if (match[1]) formatted += ` (${match[1]}`;
      if (match[1].length === 3) formatted += ')';
      if (match[2]) formatted += ` ${match[2]}`;
      if (match[3]) formatted += `-${match[3]}`;
      if (match[4]) formatted += `-${match[4]}`;
      return formatted;
    }
    
    return '+7';
  };

  const handlePhoneChange = (text: string) => {
    if (text.length < phone.length) {
      const newDigits = text.replace(/\D/g, '');
      
      if (newDigits.length <= 1) {
        setPhone('+7');
        return;
      }
      
      const formatted = formatPhoneNumber(newDigits);
      setPhone(formatted);
    } else {
      const formatted = formatPhoneNumber(text);
      setPhone(formatted);
    }
  };



  const handleGetCode = async () => {
    if (!phone) {
      setError('Введите номер телефона');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 11) {
      setError('Введите корректный номер телефона');
      return;
    }

    if (!agreedToTerms) {
      setError('Необходимо согласие с публичной офертой');
      return;
    }

    if (!agreedToPrivacy) {
      setError('Необходимо согласие на обработку персональных данных');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await signIn(phone);

    setIsLoading(false);

    if (result.success) {
      setShowOtpInput(true);
    } else {
      setError(result.error || 'Ошибка отправки кода');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setError('Введите код из SMS');
      return;
    }

    if (otp !== '111111') {
      setError('Неверный код. Попробуйте еще раз');
      return;
    }

    setIsVerifying(true);
    setError('');

    setTimeout(() => {
      setIsVerifying(false);
      router.replace('/setup-security');
    }, 500);
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Image
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/xb2u2xbeoh04pyv24uxae' }}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>Доставка грузов в Калининград и обратно</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: Colors.text }]}>Номер телефона</Text>
              <TextInput
                style={[styles.input, { backgroundColor: Colors.surface1, color: Colors.text }]}
                placeholder="+7 (999) 123-45-67"
                placeholderTextColor={Colors.textSecondary}
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                autoComplete="tel"
                editable={!isLoading}
                autoFocus
              />
            </View>

            {showOtpInput && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: Colors.text }]}>Код из SMS</Text>
                <OtpInput
                  length={6}
                  value={otp}
                  onChangeText={setOtp}
                  disabled={isVerifying}
                  autoFocus
                />

              </View>
            )}

            {error ? (
              <View style={[styles.errorContainer, { backgroundColor: Colors.surface1, borderLeftColor: Colors.error }]}>
                <Text style={[styles.errorText, { color: Colors.error }]}>{error}</Text>
              </View>
            ) : null}

            {!showOtpInput && <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                disabled={isLoading}
              >
                <View style={[
                  styles.checkbox,
                  { borderColor: Colors.surface2, backgroundColor: Colors.surface1 },
                  agreedToTerms && { borderColor: Colors.primary, backgroundColor: Colors.primary }
                ]}>
                  {agreedToTerms && <View style={[styles.checkboxInner, { backgroundColor: Colors.white }]} />}
                </View>
                <Text style={[styles.checkboxText, { color: Colors.textSecondary }]}>
                  Согласие с <Text 
                    style={[styles.checkboxLink, { color: Colors.primary }]}
                    onPress={() => router.push('/legal/offer')}
                  >публичной офертой</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAgreedToPrivacy(!agreedToPrivacy)}
                disabled={isLoading}
              >
                <View style={[
                  styles.checkbox,
                  { borderColor: Colors.surface2, backgroundColor: Colors.surface1 },
                  agreedToPrivacy && { borderColor: Colors.primary, backgroundColor: Colors.primary }
                ]}>
                  {agreedToPrivacy && <View style={[styles.checkboxInner, { backgroundColor: Colors.white }]} />}
                </View>
                <Text style={[styles.checkboxText, { color: Colors.textSecondary }]}>
                  Согласие на <Text 
                    style={[styles.checkboxLink, { color: Colors.primary }]}
                    onPress={() => router.push('/legal/privacy')}
                  >обработку персональных данных</Text>
                </Text>
              </TouchableOpacity>
            </View>}

            {!showOtpInput ? (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: Colors.primary }, isLoading && styles.buttonDisabled]}
                onPress={handleGetCode}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={[styles.buttonText, { color: Colors.white }]}>Получить код</Text>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.otpActions}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: Colors.primary }, isVerifying && styles.buttonDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={[styles.buttonText, { color: Colors.white }]}>Войти</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: Colors.surface2 }]}
                  onPress={() => {
                    setShowOtpInput(false);
                    setOtp('');
                    setError('');
                  }}
                  disabled={isVerifying}
                >
                  <Text style={[styles.secondaryButtonText, { color: Colors.text }]}>Изменить номер</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 56,
  },
  logo: {
    width: 280,
    height: 100,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 17,
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  input: {
    height: 56,
    borderWidth: 0,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 17,
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
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  checkboxContainer: {
    marginBottom: 24,
    gap: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 2,
  },

  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  checkboxText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  checkboxLink: {
    fontWeight: '500' as const,
  },
  hintText: {
    fontSize: 13,
    marginTop: 8,
  },
  otpActions: {
    gap: 12,
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
});
