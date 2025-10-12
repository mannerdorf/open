import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Platform, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { Fingerprint, Lock } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import type { PinLength } from '@/contexts/AuthContext';
import { useThemeColors } from '@/constants/colors';
import * as LocalAuthentication from 'expo-local-authentication';

import { useCompanies } from '@/contexts/CompanyContext';

export default function SetupSecurityScreen() {
  const insets = useSafeAreaInsets();
  const { setupPin, enableBiometric } = useAuth();
  const Colors = useThemeColors();
  const { companies } = useCompanies();
  const [step, setStep] = useState<'settings' | 'pin-input' | 'pin-confirm'>('settings');
  const [pinLength] = useState<PinLength>(4);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [useBiometric, setUseBiometric] = useState(false);
  const [usePin, setUsePin] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    if (Platform.OS !== 'web') {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
    }
  };

  const handleSkip = () => {
    console.log('Setup security - Skip pressed, companies count:', companies?.length ?? 0);
    if ((companies?.length ?? 0) === 0) {
      console.log('No companies found, redirecting to companies select-method');
      router.replace('/(tabs)/companies?start=select-method');
    } else {
      console.log('Companies exist, redirecting to home');
      router.replace('/(tabs)/home');
    }
  };

  const handleContinue = () => {
    if (!usePin && !useBiometric) {
      console.log('Setup security - Continue without security, companies count:', companies?.length ?? 0);
      if ((companies?.length ?? 0) === 0) {
        console.log('No companies found, redirecting to companies select-method');
        router.replace('/(tabs)/companies?start=select-method');
      } else {
        console.log('Companies exist, redirecting to home');
        router.replace('/(tabs)/home');
      }
      return;
    }
    setStep('pin-input');
  };

  const handleBiometricToggle = (value: boolean) => {
    if (value && !biometricAvailable) {
      Alert.alert(
        'Биометрия недоступна',
        'На вашем устройстве не настроена биометрическая аутентификация.'
      );
      return;
    }
    setUseBiometric(value);
    if (value) {
      setUsePin(true);
    }
  };

  const handlePinInput = (value: string) => {
    if (value.length <= pinLength) {
      setPin(value);
      if (value.length === pinLength) {
        setTimeout(() => setStep('pin-confirm'), 300);
      }
    }
  };

  const handlePinConfirm = async (value: string) => {
    if (value.length <= pinLength) {
      setConfirmPin(value);
      if (value.length === pinLength) {
        if (value === pin) {
          await setupPin(pin, pinLength);
          if (useBiometric) {
            await enableBiometric(true);
          }
          if ((companies?.length ?? 0) === 0) {
            router.replace('/(tabs)/companies?start=select-method');
          } else {
            router.replace('/(tabs)/home');
          }
        } else {
          Alert.alert('Ошибка', 'PIN-коды не совпадают', [
            { text: 'OK', onPress: () => {
              setPin('');
              setConfirmPin('');
              setStep('pin-input');
            }}
          ]);
        }
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors.text }]}>Настройка безопасности</Text>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={[styles.skipButton, { color: Colors.primary }]}>Пропустить</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {step === 'settings' && (
          <View style={styles.settingsContainer}>
            <Text style={[styles.question, { color: Colors.text }]}>
              Настройка безопасности
            </Text>
            <Text style={[styles.description, { color: Colors.textSecondary }]}>
              Выберите способы защиты вашего аккаунта
            </Text>

            <View style={styles.settingsList}>
              <View style={[styles.settingItem, { backgroundColor: Colors.surface1 }]}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingIcon}>
                    <Lock size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: Colors.text }]}>PIN-код</Text>
                    <Text style={[styles.settingSubtitle, { color: Colors.textSecondary }]}>
                      Защита с помощью PIN-кода
                    </Text>
                  </View>
                </View>
                <Switch
                  value={usePin}
                  onValueChange={setUsePin}
                  trackColor={{ false: Colors.surface2, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={[styles.settingItem, { backgroundColor: Colors.surface1, opacity: biometricAvailable ? 1 : 0.5 }]}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingIcon}>
                    <Fingerprint size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: Colors.text }]}>Биометрия</Text>
                    <Text style={[styles.settingSubtitle, { color: Colors.textSecondary }]}>
                      {biometricAvailable ? 'Вход по отпечатку или Face ID' : 'Недоступно на устройстве'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={useBiometric}
                  onValueChange={handleBiometricToggle}
                  disabled={!biometricAvailable}
                  trackColor={{ false: Colors.surface2, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.continueButton, { backgroundColor: Colors.primary }]}
              onPress={handleContinue}
            >
              <Text style={[styles.continueButtonText, { color: Colors.white }]}>Продолжить</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'pin-input' && (
          <View style={styles.pinContainer}>
            <Text style={[styles.question, { color: Colors.text }]}>
              Введите PIN-код
            </Text>
            <Text style={[styles.description, { color: Colors.textSecondary }]}>
              Создайте {pinLength}-значный PIN-код
            </Text>

            <View style={styles.pinDotsContainer}>
              {Array.from({ length: pinLength }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.pinDot,
                    { borderColor: Colors.border },
                    i < pin.length && { backgroundColor: Colors.primary, borderColor: Colors.primary }
                  ]}
                />
              ))}
            </View>

            <TextInput
              style={styles.hiddenInput}
              value={pin}
              onChangeText={handlePinInput}
              keyboardType="number-pad"
              maxLength={pinLength}
              autoFocus
              secureTextEntry
            />
          </View>
        )}

        {step === 'pin-confirm' && (
          <View style={styles.pinContainer}>
            <Text style={[styles.question, { color: Colors.text }]}>
              Подтвердите PIN-код
            </Text>
            <Text style={[styles.description, { color: Colors.textSecondary }]}>
              Введите PIN-код еще раз
            </Text>

            <View style={styles.pinDotsContainer}>
              {Array.from({ length: pinLength }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.pinDot,
                    { borderColor: Colors.border },
                    i < confirmPin.length && { backgroundColor: Colors.primary, borderColor: Colors.primary }
                  ]}
                />
              ))}
            </View>

            <TextInput
              style={styles.hiddenInput}
              value={confirmPin}
              onChangeText={handlePinConfirm}
              keyboardType="number-pad"
              maxLength={pinLength}
              autoFocus
              secureTextEntry
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    flex: 1,
    marginRight: 12,
  },
  skipButton: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center' as const,
  },
  settingsContainer: {
    alignItems: 'center' as const,
  },
  choiceContainer: {
    alignItems: 'center' as const,
  },
  question: {
    fontSize: 22,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center' as const,
    marginBottom: 40,
    lineHeight: 24,
  },
  buttonGroup: {
    width: '100%',
    gap: 16,
  },
  choiceButton: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center' as const,
    gap: 12,
  },
  choiceButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  pinLengthText: {
    fontSize: 48,
    fontWeight: '700' as const,
  },
  pinContainer: {
    alignItems: 'center' as const,
  },
  pinDotsContainer: {
    flexDirection: 'row' as const,
    gap: 16,
    marginTop: 40,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  hiddenInput: {
    position: 'absolute' as const,
    opacity: 0,
  },
  settingsList: {
    width: '100%',
    gap: 12,
    marginTop: 32,
    marginBottom: 32,
  },
  settingItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 16,
    borderRadius: 16,
  },
  settingInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  continueButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
});
