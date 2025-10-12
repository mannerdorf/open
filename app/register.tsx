import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { Package, Square, CheckSquare } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/constants/colors';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const insets = useSafeAreaInsets();
  const Colors = useThemeColors();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const codeInputs = useRef<(TextInput | null)[]>([null, null, null, null, null, null]);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(false);

  const formatPhoneNumber = (text: string) => {
    let cleaned = text.replace(/\D/g, '');
    
    if (cleaned.startsWith('8')) {
      cleaned = '7' + cleaned.slice(1);
    } else if (cleaned.startsWith('7')) {
      cleaned = '7' + cleaned.slice(1);
    } else if (cleaned.length > 0 && !cleaned.startsWith('7')) {
      cleaned = '7' + cleaned;
    }
    
    if (cleaned.length > 11) {
      cleaned = cleaned.slice(0, 11);
    }
    
    let formatted = '';
    if (cleaned.length > 0) {
      formatted = '+7';
      if (cleaned.length > 1) {
        formatted += ' (' + cleaned.slice(1, 4);
        if (cleaned.length > 4) {
          formatted += ') ' + cleaned.slice(4, 7);
          if (cleaned.length > 7) {
            formatted += '-' + cleaned.slice(7, 9);
            if (cleaned.length > 9) {
              formatted += '-' + cleaned.slice(9, 11);
            }
          }
        } else if (cleaned.length === 4) {
          formatted += ')';
        }
      }
    }
    
    return formatted;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhone(formatted);
  };

  const handleSendCode = async () => {
    if (!phone) {
      setError('Введите номер телефона');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 11) {
      setError('Введите корректный номер телефона');
      return;
    }

    if (!agreeToTerms) {
      setError('Необходимо согласие с публичной офертой');
      return;
    }

    if (!agreeToPrivacy) {
      setError('Необходимо согласие на обработку персональных данных');
      return;
    }

    setIsLoading(true);
    setError('');

    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsLoading(false);
    setCodeSent(true);
  };

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) {
      value = value[value.length - 1];
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      codeInputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      codeInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const enteredCode = code.join('');
    
    if (enteredCode.length !== 6) {
      setError('Введите код полностью');
      return;
    }

    if (enteredCode !== '111111') {
      setError('Неверный код. Попробуйте еще раз');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await signUp(phone);

    setIsLoading(false);

    if (result.success) {
      router.replace('/home');
    } else {
      setError(result.error || 'Ошибка регистрации');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: Colors.surface1 }]}>
            <Package size={56} color={Colors.primary} strokeWidth={2} />
          </View>
          <Text style={[styles.title, { color: Colors.text }]}>Регистрация</Text>
          <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>Введите номер телефона для регистрации</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: Colors.text }]}>Номер телефона</Text>
            <TextInput
              style={[styles.input, { backgroundColor: Colors.surface1, color: Colors.text }, codeSent && styles.inputDisabled]}
              placeholder="+7 (999) 123-45-67"
              placeholderTextColor={Colors.textSecondary}
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              autoComplete="tel"
              editable={!isLoading && !codeSent}
              autoFocus={!codeSent}
            />
          </View>

          {codeSent && (
            <View style={styles.codeSection}>
              <Text style={[styles.codeLabel, { color: Colors.text }]}>Введите код из СМС</Text>
              <Text style={[styles.codeHint, { color: Colors.textSecondary }]}>Мы отправили код на номер {phone}</Text>
              
              <View style={styles.codeInputContainer}>
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      codeInputs.current[index] = ref;
                    }}
                    style={[styles.codeInput, { backgroundColor: Colors.surface1, color: Colors.text }]}
                    value={digit}
                    onChangeText={(value) => handleCodeChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    autoFocus={index === 0}
                  />
                ))}
              </View>

              <TouchableOpacity 
                style={styles.resendButton}
                onPress={() => {
                  setCodeSent(false);
                  setCode(['', '', '', '', '', '']);
                  setError('');
                }}
              >
                <Text style={[styles.resendText, { color: Colors.primary }]}>Отправить код повторно</Text>
              </TouchableOpacity>
            </View>
          )}

          {!codeSent && (
            <View style={styles.agreementsContainer}>
              <TouchableOpacity 
                style={styles.checkboxRow}
                onPress={() => setAgreeToTerms(!agreeToTerms)}
                activeOpacity={0.7}
              >
                {agreeToTerms ? (
                  <CheckSquare size={24} color={Colors.primary} strokeWidth={2} />
                ) : (
                  <Square size={24} color={Colors.textSecondary} strokeWidth={2} />
                )}
                <Text style={[styles.checkboxText, { color: Colors.textSecondary }]}>
                  Согласен с{' '}
                  <Text style={[styles.checkboxLink, { color: Colors.primary }]}>публичной офертой</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.checkboxRow}
                onPress={() => setAgreeToPrivacy(!agreeToPrivacy)}
                activeOpacity={0.7}
              >
                {agreeToPrivacy ? (
                  <CheckSquare size={24} color={Colors.primary} strokeWidth={2} />
                ) : (
                  <Square size={24} color={Colors.textSecondary} strokeWidth={2} />
                )}
                <Text style={[styles.checkboxText, { color: Colors.textSecondary }]}>
                  Согласен на{' '}
                  <Text style={[styles.checkboxLink, { color: Colors.primary }]}>обработку персональных данных</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: Colors.surface1, borderLeftColor: Colors.error }]}>
              <Text style={[styles.errorText, { color: Colors.error }]}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: Colors.primary }, isLoading && styles.buttonDisabled]}
            onPress={codeSent ? handleVerifyCode : handleSendCode}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={[styles.buttonText, { color: Colors.white }]}>
                {codeSent ? 'Подтвердить' : 'Получить код'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: Colors.textSecondary }]}>Уже есть аккаунт?</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.footerLink, { color: Colors.primary }]}>Войти</Text>
          </TouchableOpacity>
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
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center' as const,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
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
  footer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: 32,
    gap: 8,
  },
  footerText: {
    fontSize: 15,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  codeSection: {
    marginBottom: 28,
  },
  codeLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  codeHint: {
    fontSize: 14,
    marginBottom: 20,
  },
  codeInputContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 10,
    marginBottom: 20,
  },
  codeInput: {
    width: 50,
    height: 60,
    borderWidth: 0,
    borderRadius: 16,
    fontSize: 28,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  resendButton: {
    alignItems: 'center' as const,
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  agreementsContainer: {
    marginBottom: 24,
    gap: 16,
  },
  checkboxRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 2,
  },
  checkboxLink: {
    fontWeight: '600' as const,
  },
});
