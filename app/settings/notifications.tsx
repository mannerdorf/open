import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import { Stack, router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { useThemeColors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft } from 'lucide-react-native';
import OtpInput from '@/components/OtpInput';

function TimePicker({ value, onChange, max, Colors }: { value: number; onChange: (v: number) => void; max: number; Colors: any }) {
  const scrollRef = useRef<ScrollView>(null);
  const ITEM_HEIGHT = 50 as const;

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: value * ITEM_HEIGHT,
        animated: true,
      });
    }, 100);
  }, [value]);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    if (index >= 0 && index <= max && index !== value) {
      onChange(index);
    }
  };

  return (
    <View style={styles.pickerColumn}>
      <View style={[styles.pickerHighlight, { borderColor: Colors.primary }]} />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={{ paddingVertical: 100 }}
      >
        {Array.from({ length: max + 1 }, (_, i) => (
          <TouchableOpacity
            key={i}
            style={styles.pickerItem}
            onPress={() => {
              onChange(i);
              scrollRef.current?.scrollTo({
                y: i * ITEM_HEIGHT,
                animated: true,
              });
            }}
          >
            <Text
              style={[
                styles.pickerItemText,
                { color: value === i ? Colors.primary : Colors.textSecondary },
                value === i && styles.pickerItemTextActive,
              ]}
            >
              {i.toString().padStart(2, '0')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export default function NotificationsScreen() {
  const Colors = useThemeColors();
  const { user, updateUserEmail } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(!!user?.email);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const [nightModeStart, setNightModeStart] = useState('22:00');
  const [nightModeEnd, setNightModeEnd] = useState('08:00');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tempStartHour, setTempStartHour] = useState(22);
  const [tempStartMinute, setTempStartMinute] = useState(0);
  const [tempEndHour, setTempEndHour] = useState(8);
  const [tempEndMinute, setTempEndMinute] = useState(0);

  const handleEmailToggle = (value: boolean) => {
    if (value && !user?.email) {
      setShowEmailInput(true);
      setEmailEnabled(false);
    } else {
      setEmailEnabled(value);
      if (!value) {
        setShowEmailInput(false);
        setShowCodeInput(false);
      }
    }
  };

  const handleSendCode = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Ошибка', 'Введите корректный email');
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    setCodeSent(true);
    setShowCodeInput(true);
    Alert.alert('Код отправлен', `Код подтверждения отправлен на ${email}`);
  };

  const handleVerifyCode = async () => {
    if (emailVerificationCode !== '111111') {
      Alert.alert('Ошибка', 'Неверный код');
      return;
    }

    setIsLoading(true);
    await updateUserEmail(email);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
    setEmailEnabled(true);
    setShowEmailInput(false);
    setShowCodeInput(false);
    Alert.alert('Успех', 'Email подтвержден');
  };
  
  const [email, setEmail] = useState(user?.email || '');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Уведомления',
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
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Каналы уведомлений</Text>

          <View style={[styles.settingItem, { backgroundColor: Colors.surface1 }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: Colors.text }]}>Push-уведомления</Text>
              <Text style={[styles.settingDescription, { color: Colors.textSecondary }]}>
                Получать уведомления на устройство
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: Colors.surface2, true: Colors.primaryLight }}
              thumbColor={pushEnabled ? Colors.primary : Colors.textSecondary}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: Colors.surface1 }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: Colors.text }]}>Email-уведомления</Text>
              <Text style={[styles.settingDescription, { color: Colors.textSecondary }]}>
                Получать уведомления на почту
              </Text>
            </View>
            <Switch
              value={emailEnabled}
              onValueChange={handleEmailToggle}
              trackColor={{ false: Colors.surface2, true: Colors.primaryLight }}
              thumbColor={emailEnabled ? Colors.primary : Colors.textSecondary}
            />
          </View>

          {showEmailInput && (
            <View style={[styles.emailContainer, { backgroundColor: Colors.surface1 }]}>
              <Text style={[styles.emailLabel, { color: Colors.text }]}>Email адрес</Text>
              <TextInput
                style={[styles.emailInput, { backgroundColor: Colors.surface2, color: Colors.text, borderColor: Colors.border }]}
                placeholder="example@mail.com"
                placeholderTextColor={Colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!codeSent}
              />
              
              {!showCodeInput && (
                <TouchableOpacity
                  style={[styles.sendCodeButton, { backgroundColor: Colors.primary }]}
                  onPress={handleSendCode}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={[styles.sendCodeButtonText, { color: Colors.white }]}>Отправить код проверки</Text>
                  )}
                </TouchableOpacity>
              )}

              {showCodeInput && (
                <View style={styles.codeSection}>
                  <Text style={[styles.codeLabel, { color: Colors.text }]}>Код подтверждения</Text>
                  <OtpInput
                    length={6}
                    value={emailVerificationCode}
                    onChangeText={setEmailVerificationCode}
                    disabled={isLoading}
                    autoFocus={true}
                  />
                  <TouchableOpacity
                    style={[styles.verifyButton, { backgroundColor: Colors.primary }]}
                    onPress={handleVerifyCode}
                    disabled={isLoading || emailVerificationCode.length !== 6}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <Text style={[styles.verifyButtonText, { color: Colors.white }]}>Подтвердить</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Типы уведомлений</Text>

          <View style={[styles.settingItem, { backgroundColor: Colors.surface1 }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: Colors.text }]}>Обновления заказов</Text>
              <Text style={[styles.settingDescription, { color: Colors.textSecondary }]}>
                Изменения статуса перевозок
              </Text>
            </View>
            <Switch
              value={orderUpdates}
              onValueChange={setOrderUpdates}
              trackColor={{ false: Colors.surface2, true: Colors.primaryLight }}
              thumbColor={orderUpdates ? Colors.primary : Colors.textSecondary}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: Colors.surface1 }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: Colors.text }]}>Акции и предложения</Text>
              <Text style={[styles.settingDescription, { color: Colors.textSecondary }]}>
                Специальные предложения и скидки
              </Text>
            </View>
            <Switch
              value={promotions}
              onValueChange={setPromotions}
              trackColor={{ false: Colors.surface2, true: Colors.primaryLight }}
              thumbColor={promotions ? Colors.primary : Colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Ночной режим</Text>

          <View style={[styles.settingItem, { backgroundColor: Colors.surface1 }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: Colors.text }]}>Не беспокоить ночью</Text>
              <Text style={[styles.settingDescription, { color: Colors.textSecondary }]}>
                Отключить уведомления в ночное время
              </Text>
            </View>
            <Switch
              value={nightMode}
              onValueChange={setNightMode}
              trackColor={{ false: Colors.surface2, true: Colors.primaryLight }}
              thumbColor={nightMode ? Colors.primary : Colors.textSecondary}
            />
          </View>

          {nightMode && (
            <View style={[styles.timeRangeContainer, { backgroundColor: Colors.surface1 }]}>
              <TouchableOpacity 
                style={styles.timeItem}
                onPress={() => {
                  const [h, m] = nightModeStart.split(':').map(Number);
                  setTempStartHour(h);
                  setTempStartMinute(m);
                  setShowStartPicker(true);
                }}
              >
                <Text style={[styles.timeLabel, { color: Colors.textSecondary }]}>С</Text>
                <Text style={[styles.timeValue, { color: Colors.text }]}>{nightModeStart}</Text>
              </TouchableOpacity>
              <View style={[styles.timeSeparator, { backgroundColor: Colors.border }]} />
              <TouchableOpacity 
                style={styles.timeItem}
                onPress={() => {
                  const [h, m] = nightModeEnd.split(':').map(Number);
                  setTempEndHour(h);
                  setTempEndMinute(m);
                  setShowEndPicker(true);
                }}
              >
                <Text style={[styles.timeLabel, { color: Colors.textSecondary }]}>До</Text>
                <Text style={[styles.timeValue, { color: Colors.text }]}>{nightModeEnd}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showStartPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStartPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStartPicker(false)}
        >
          <View style={[styles.pickerContainer, { backgroundColor: Colors.surface1 }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: Colors.text }]}>Начало периода</Text>
            </View>
            <View style={styles.pickerContent}>
              <TimePicker
                value={tempStartHour}
                onChange={setTempStartHour}
                max={23}
                Colors={Colors}
              />
              <Text style={[styles.pickerSeparator, { color: Colors.text }]}>:</Text>
              <TimePicker
                value={tempStartMinute}
                onChange={setTempStartMinute}
                max={59}
                Colors={Colors}
              />
            </View>
            <View style={styles.pickerActions}>
              <TouchableOpacity
                style={[styles.pickerButton, { backgroundColor: Colors.surface2 }]}
                onPress={() => setShowStartPicker(false)}
              >
                <Text style={[styles.pickerButtonText, { color: Colors.text }]}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerButton, { backgroundColor: Colors.primary }]}
                onPress={() => {
                  setNightModeStart(`${tempStartHour.toString().padStart(2, '0')}:${tempStartMinute.toString().padStart(2, '0')}`);
                  setShowStartPicker(false);
                }}
              >
                <Text style={[styles.pickerButtonText, { color: Colors.white }]}>Готово</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showEndPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEndPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEndPicker(false)}
        >
          <View style={[styles.pickerContainer, { backgroundColor: Colors.surface1 }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: Colors.text }]}>Конец периода</Text>
            </View>
            <View style={styles.pickerContent}>
              <TimePicker
                value={tempEndHour}
                onChange={setTempEndHour}
                max={23}
                Colors={Colors}
              />
              <Text style={[styles.pickerSeparator, { color: Colors.text }]}>:</Text>
              <TimePicker
                value={tempEndMinute}
                onChange={setTempEndMinute}
                max={59}
                Colors={Colors}
              />
            </View>
            <View style={styles.pickerActions}>
              <TouchableOpacity
                style={[styles.pickerButton, { backgroundColor: Colors.surface2 }]}
                onPress={() => setShowEndPicker(false)}
              >
                <Text style={[styles.pickerButtonText, { color: Colors.text }]}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerButton, { backgroundColor: Colors.primary }]}
                onPress={() => {
                  setNightModeEnd(`${tempEndHour.toString().padStart(2, '0')}:${tempEndMinute.toString().padStart(2, '0')}`);
                  setShowEndPicker(false);
                }}
              >
                <Text style={[styles.pickerButtonText, { color: Colors.white }]}>Готово</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  settingItem: {
    flexDirection: 'row' as const,
    padding: 18,
    borderRadius: 16,
    marginBottom: 8,
    alignItems: 'center' as const,
    gap: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  timeRangeContainer: {
    flexDirection: 'row' as const,
    padding: 18,
    borderRadius: 16,
    marginTop: 8,
    alignItems: 'center' as const,
  },
  timeItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  timeLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  timeSeparator: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
  },
  emailContainer: {
    padding: 18,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  emailLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  emailInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  sendCodeButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sendCodeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  codeSection: {
    marginTop: 16,
  },
  codeLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 16,
  },
  verifyButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  pickerContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    overflow: 'hidden' as const,
  },
  pickerHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  pickerContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 20,
    height: 250,
  },
  pickerColumn: {
    flex: 1,
    height: 250,
    position: 'relative' as const,
  },
  pickerHighlight: {
    position: 'absolute' as const,
    top: 100,
    left: 0,
    right: 0,
    height: 50,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    zIndex: 1,
    pointerEvents: 'none' as const,
  },
  pickerItem: {
    height: 50,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  pickerItemText: {
    fontSize: 20,
    fontWeight: '400' as const,
    opacity: 0.4,
  },
  pickerItemTextActive: {
    fontSize: 28,
    fontWeight: '700' as const,
    opacity: 1,
  },
  pickerSeparator: {
    fontSize: 32,
    fontWeight: '700' as const,
    marginHorizontal: 10,
  },
  pickerActions: {
    flexDirection: 'row' as const,
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  pickerButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  pickerButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
