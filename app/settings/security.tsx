import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, TextInput, ActivityIndicator, Modal } from 'react-native';
import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useThemeColors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, Smartphone, Lock, Eye, X } from 'lucide-react-native';

import { useCompanies } from '@/contexts/CompanyContext';

export default function SecurityScreen() {
  const Colors = useThemeColors();
  const { biometricEnabled, pinEnabled, enableBiometric, disablePin, updateUserPhone, setupPin } = useAuth();
  const { companies } = useCompanies();
  const [autoLock, setAutoLock] = useState(true);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneStep, setPhoneStep] = useState<'input' | 'verify'>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [pinToggleRequested, setPinToggleRequested] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const formatPhoneNumber = (text: string) => {
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.startsWith('8')) cleaned = '7' + cleaned.slice(1);
    else if (!cleaned.startsWith('7')) cleaned = '7' + cleaned;
    const match = cleaned.match(/^7(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
    if (match) {
      let formatted = '+7';
      if (match[1]) formatted += ` (${match[1]}`;
      if (match[1] && match[1].length === 3) formatted += ')';
      if (match[2]) formatted += ` ${match[2]}`;
      if (match[3]) formatted += `-${match[3]}`;
      if (match[4]) formatted += `-${match[4]}`;
      return formatted;
    }
    return '+7';
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setNewPhone(formatted);
  };

  const handleChangePhone = () => {
    setShowPhoneModal(true);
    setPhoneStep('input');
    setNewPhone('');
    setPhoneCode('');
  };

  const handleSendPhoneCode = async () => {
    const cleanPhone = newPhone.replace(/\D/g, '');
    if (cleanPhone.length < 11) {
      Alert.alert('Ошибка', 'Введите корректный номер телефона');
      return;
    }
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    setPhoneStep('verify');
    Alert.alert('Код отправлен', `Код подтверждения отправлен на ${newPhone}`);
  };

  const handleVerifyPhoneCode = async () => {
    if (phoneCode !== '111111') {
      Alert.alert('Ошибка', 'Неверный код');
      return;
    }
    setIsLoading(true);
    await updateUserPhone(newPhone);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
    setShowPhoneModal(false);
    Alert.alert('Успех', 'Номер телефона изменен');
  };

  const handleBiometricToggle = async (value: boolean) => {
    await enableBiometric(value);
  };

  const handlePinToggle = async (value: boolean) => {
    if (value) {
      setPinToggleRequested(true);
      return;
    }

    if (pinToggleRequested && !pinEnabled) {
      setPinToggleRequested(false);
      setPinInput('');
      return;
    }

    Alert.alert(
      'Отключить PIN-код?',
      'Вы будете входить через SMS каждый раз',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Отключить', style: 'destructive', onPress: async () => {
          await disablePin();
          await enableBiometric(false);
          setPinInput('');
          setPinToggleRequested(false);
        }}
      ]
    );
  };

  useEffect(() => {
    if (pinInput.length === 4 && pinToggleRequested && !pinEnabled) {
      (async () => {
        await setupPin(pinInput, 4);
      })();
    }
  }, [pinInput, pinToggleRequested, pinEnabled, setupPin]);

  useEffect(() => {
    if ((biometricEnabled || pinEnabled) && companies.length === 0) {
      router.replace('/(tabs)/companies');
    }
  }, [biometricEnabled, pinEnabled, companies.length]);

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Безопасность',
          headerStyle: { backgroundColor: Colors.surface1 },
          headerTintColor: Colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Вход в приложение</Text>

          <View style={[styles.settingItem, { backgroundColor: Colors.surface1 }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: Colors.text }]}>Биометрия</Text>
              <Text style={[styles.settingDescription, { color: Colors.textSecondary }]}>Вход по отпечатку пальца или Face ID</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: Colors.surface2, true: Colors.primaryLight }}
              thumbColor={biometricEnabled ? Colors.primary : Colors.textSecondary}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: Colors.surface1 }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: Colors.text }]}>PIN-код</Text>
              <Text style={[styles.settingDescription, { color: Colors.textSecondary }]}>Защита приложения PIN-кодом</Text>
            </View>
            <Switch
              value={pinEnabled || pinToggleRequested}
              onValueChange={handlePinToggle}
              trackColor={{ false: Colors.surface2, true: Colors.primaryLight }}
              thumbColor={(pinEnabled || pinToggleRequested) ? Colors.primary : Colors.textSecondary}
            />
          </View>

          {(pinEnabled || pinToggleRequested) && (
            <View style={[styles.pinInlineContainer, { backgroundColor: Colors.surface1, borderColor: Colors.surface2 }]}>
              <View style={[styles.actionIcon, { backgroundColor: Colors.surface2 }]}>
                <Lock size={20} color={Colors.primary} />
              </View>
              <TextInput
                testID="security-pin-input"
                style={[styles.pinInput, { color: Colors.text, backgroundColor: Colors.surface2, borderColor: Colors.border }]}
                keyboardType="number-pad"
                placeholder={pinEnabled ? 'Введите новый PIN (4 цифры)' : 'Создайте PIN (4 цифры)'}
                placeholderTextColor={Colors.textSecondary}
                value={pinInput}
                onChangeText={(t) => setPinInput(t.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
              />
            </View>
          )}

          <View style={[styles.settingItem, { backgroundColor: Colors.surface1 }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: Colors.text }]}>Автоблокировка</Text>
              <Text style={[styles.settingDescription, { color: Colors.textSecondary }]}>Блокировать приложение при выходе</Text>
            </View>
            <Switch
              value={autoLock}
              onValueChange={setAutoLock}
              trackColor={{ false: Colors.surface2, true: Colors.primaryLight }}
              thumbColor={autoLock ? Colors.primary : Colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Учетная запись</Text>

          <TouchableOpacity style={[styles.actionItem, { backgroundColor: Colors.surface1 }]} onPress={handleChangePhone}>
            <View style={[styles.actionIcon, { backgroundColor: Colors.surface2 }]}>
              <Smartphone size={20} color={Colors.primary} />
            </View>
            <Text style={[styles.actionText, { color: Colors.text }]}>Изменить номер телефона</Text>
          </TouchableOpacity>

          <View style={[styles.settingItem, { backgroundColor: Colors.surface1 }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: Colors.text }]}>Двухфакторная аутентификация</Text>
              <Text style={[styles.settingDescription, { color: Colors.textSecondary }]}>Дополнительная защита аккаунта</Text>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={setTwoFactorEnabled}
              trackColor={{ false: Colors.surface2, true: Colors.primaryLight }}
              thumbColor={twoFactorEnabled ? Colors.primary : Colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Конфиденциальность</Text>
          <View style={[styles.infoCard, { backgroundColor: Colors.surface1 }]}>
            <Eye size={24} color={Colors.primary} />
            <Text style={[styles.infoText, { color: Colors.textSecondary }]}>Мы серьезно относимся к защите ваших данных. Все данные передаются по защищенному соединению и хранятся в зашифрованном виде.</Text>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showPhoneModal} transparent animationType="fade" onRequestClose={() => setShowPhoneModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.text }]}>{phoneStep === 'input' ? 'Изменить номер' : 'Подтверждение'}</Text>
              <TouchableOpacity onPress={() => setShowPhoneModal(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {phoneStep === 'input' ? (
              <View style={styles.modalBody}>
                <Text style={[styles.modalLabel, { color: Colors.text }]}>Новый номер телефона</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: Colors.surface1, color: Colors.text }]}
                  placeholder="+7 (999) 123-45-67"
                  placeholderTextColor={Colors.textSecondary}
                  value={newPhone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  autoFocus
                />
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: Colors.primary }]} onPress={handleSendPhoneCode} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color={Colors.white} /> : <Text style={[styles.modalButtonText, { color: Colors.white }]}>Отправить код</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.modalBody}>
                <Text style={[styles.modalLabel, { color: Colors.text }]}>Код из SMS</Text>
                <TextInput
                  style={[styles.modalInput, styles.codeInput, { backgroundColor: Colors.surface1, color: Colors.text }]}
                  placeholder="000000"
                  placeholderTextColor={Colors.textSecondary}
                  value={phoneCode}
                  onChangeText={setPhoneCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: Colors.primary }]} onPress={handleVerifyPhoneCode} disabled={isLoading || phoneCode.length !== 6}>
                  {isLoading ? <ActivityIndicator color={Colors.white} /> : <Text style={[styles.modalButtonText, { color: Colors.white }]}>Подтвердить</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: { padding: 8, marginLeft: 8 },
  content: { flex: 1 },
  scrollContent: { padding: 20 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '700' as const, marginBottom: 16, paddingHorizontal: 4 },
  settingItem: { flexDirection: 'row' as const, padding: 18, borderRadius: 16, marginBottom: 8, alignItems: 'center' as const, gap: 12 },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 16, fontWeight: '600' as const, marginBottom: 4 },
  settingDescription: { fontSize: 14, lineHeight: 20 },
  actionItem: { flexDirection: 'row' as const, padding: 18, borderRadius: 16, marginBottom: 8, alignItems: 'center' as const, gap: 12 },
  actionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center' as const, justifyContent: 'center' as const },
  actionText: { fontSize: 16, fontWeight: '500' as const, flex: 1 },
  infoCard: { padding: 20, borderRadius: 16, flexDirection: 'row' as const, gap: 16, alignItems: 'flex-start' as const },
  infoText: { flex: 1, fontSize: 14, lineHeight: 20 },
  modalOverlay: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, padding: 20, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { width: '100%', maxWidth: 400, borderRadius: 20, padding: 24 },
  modalHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '700' as const },
  modalBody: { gap: 16 },
  modalLabel: { fontSize: 15, fontWeight: '600' as const },
  modalInput: { height: 56, borderRadius: 12, paddingHorizontal: 16, fontSize: 17 },
  modalButton: { height: 56, borderRadius: 12, alignItems: 'center' as const, justifyContent: 'center' as const, marginTop: 8 },
  modalButtonText: { fontSize: 17, fontWeight: '600' as const },
  codeInput: { textAlign: 'center' as const, fontSize: 24, letterSpacing: 8 },
  pinInlineContainer: { marginTop: 8, padding: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 },
  pinInput: { flex: 1, height: 44, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, fontSize: 18, letterSpacing: 6, textAlign: 'center' as const },
});