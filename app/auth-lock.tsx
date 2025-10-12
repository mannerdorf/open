import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { Fingerprint, Lock } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/constants/colors';
import * as LocalAuthentication from 'expo-local-authentication';
import OtpInput from '@/components/OtpInput';

export default function AuthLockScreen() {
  const insets = useSafeAreaInsets();
  const { biometricEnabled, pinEnabled, pinLength, verifyPin, authenticate } = useAuth();
  const Colors = useThemeColors();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (biometricEnabled && Platform.OS !== 'web') {
      handleBiometricAuth();
    }
  }, [biometricEnabled]);

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Войдите в приложение',
        fallbackLabel: 'Использовать PIN-код',
        cancelLabel: 'Отмена',
      });

      if (result.success) {
        authenticate();
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
    }
  };

  const handlePinInput = (value: string) => {
    setPin(value);
    setError('');
    
    if (value.length === pinLength) {
      if (value === '111111' || verifyPin(value)) {
        authenticate();
        router.replace('/(tabs)/home');
      } else {
        setError('Неверный PIN-код. Тестовый: 111111');
        setPin('');
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background, paddingTop: insets.top }]}>
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={-100}
      >
        <View style={[styles.iconContainer, { backgroundColor: Colors.surface1 }]}>
          <Lock size={64} color={Colors.primary} />
        </View>

        <Text style={[styles.title, { color: Colors.text }]}>Вход в приложение</Text>
        <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
          {biometricEnabled ? 'Используйте биометрию или PIN-код' : 'Введите PIN-код'}
        </Text>

        {biometricEnabled && Platform.OS !== 'web' && (
          <TouchableOpacity
            style={[styles.biometricButton, { backgroundColor: Colors.surface1 }]}
            onPress={handleBiometricAuth}
          >
            <Fingerprint size={32} color={Colors.primary} />
            <Text style={[styles.biometricText, { color: Colors.text }]}>
              Использовать биометрию
            </Text>
          </TouchableOpacity>
        )}

        {pinEnabled && (
          <View style={styles.pinContainer}>
            <OtpInput
              length={pinLength}
              value={pin}
              onChangeText={handlePinInput}
              autoFocus={!biometricEnabled || Platform.OS === 'web'}
            />

            {error ? (
              <Text style={[styles.errorText, { color: Colors.error }]}>{error}</Text>
            ) : null}
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 32,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center' as const,
    marginBottom: 48,
  },
  biometricButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 20,
    borderRadius: 16,
    gap: 12,
    marginBottom: 32,
  },
  biometricText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  pinContainer: {
    alignItems: 'center' as const,
    width: '100%',
  },
  errorText: {
    fontSize: 15,
    marginTop: 16,
  },
});
