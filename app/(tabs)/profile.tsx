import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Bell, Shield, LogOut, ChevronRight, Edit2, Sun, Moon, Smartphone, Building2, Trash2, Info, X, FileText, Lock, LayoutDashboard, TestTube } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import type { ThemeMode } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { useThemeColors } from '@/constants/colors';
import { useState } from 'react';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut, updateUserName, themeMode, setTheme } = useAuth();
  const Colors = useThemeColors();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || 'Пользователь');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleSaveName = async () => {
    if (editedName.trim()) {
      await updateUserName(editedName.trim());
      setIsEditingName(false);
    }
  };

  const handleThemeChange = async (mode: ThemeMode) => {
    await setTheme(mode);
    setShowThemeMenu(false);
  };

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'light':
        return 'Дневной';
      case 'dark':
        return 'Ночной';
      case 'auto':
        return 'Автоматический';
    }
  };

  const getThemeIcon = () => {
    switch (themeMode) {
      case 'light':
        return <Sun size={20} color={Colors.primary} />;
      case 'dark':
        return <Moon size={20} color={Colors.primary} />;
      case 'auto':
        return <Smartphone size={20} color={Colors.primary} />;
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Очистить кэш',
      'Это удалит временные данные приложения. Вы останетесь в системе.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Очистить',
          style: 'destructive',
          onPress: async () => {
            setIsClearingCache(true);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setIsClearingCache(false);
            Alert.alert('Готово', 'Кэш успешно очищен');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20, backgroundColor: Colors.surface1 }]}>
        <Text style={[styles.title, { color: Colors.text }]}>Профиль</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>


        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Настройки</Text>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: Colors.surface1 }]}
            onPress={() => router.push('/(tabs)/companies')}
          >
            <View style={[styles.menuIcon, { backgroundColor: Colors.surface2 }]}>
              <Building2 size={20} color={Colors.primary} />
            </View>
            <Text style={[styles.menuText, { color: Colors.text }]}>Мои компании</Text>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: Colors.surface1 }]}
            onPress={() => setShowThemeMenu(!showThemeMenu)}
          >
            <View style={[styles.menuIcon, { backgroundColor: Colors.surface2 }]}>
              {getThemeIcon()}
            </View>
            <Text style={[styles.menuText, { color: Colors.text }]}>Тема</Text>
            <Text style={[styles.menuValue, { color: Colors.textSecondary }]}>{getThemeLabel()}</Text>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          {showThemeMenu && (
            <View style={[styles.themeMenu, { backgroundColor: Colors.surface2 }]}>
              <TouchableOpacity
                style={[styles.themeOption, themeMode === 'light' && { backgroundColor: Colors.surface1 }]}
                onPress={() => handleThemeChange('light')}
              >
                <Sun size={20} color={Colors.text} />
                <Text style={[styles.themeOptionText, { color: Colors.text }]}>Дневной</Text>
                {themeMode === 'light' && <View style={[styles.themeCheck, { backgroundColor: Colors.primary }]} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeOption, themeMode === 'dark' && { backgroundColor: Colors.surface1 }]}
                onPress={() => handleThemeChange('dark')}
              >
                <Moon size={20} color={Colors.text} />
                <Text style={[styles.themeOptionText, { color: Colors.text }]}>Ночной</Text>
                {themeMode === 'dark' && <View style={[styles.themeCheck, { backgroundColor: Colors.primary }]} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeOption, themeMode === 'auto' && { backgroundColor: Colors.surface1 }]}
                onPress={() => handleThemeChange('auto')}
              >
                <Smartphone size={20} color={Colors.text} />
                <Text style={[styles.themeOptionText, { color: Colors.text }]}>Автоматический</Text>
                {themeMode === 'auto' && <View style={[styles.themeCheck, { backgroundColor: Colors.primary }]} />}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: Colors.surface1 }]}
            onPress={() => router.push('/settings/notifications')}
          >
            <View style={[styles.menuIcon, { backgroundColor: Colors.surface2 }]}>
              <Bell size={20} color={Colors.primary} />
            </View>
            <Text style={[styles.menuText, { color: Colors.text }]}>Уведомления</Text>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: Colors.surface1 }]}
            onPress={() => router.push('/settings/dashboards')}
          >
            <View style={[styles.menuIcon, { backgroundColor: Colors.surface2 }]}>
              <LayoutDashboard size={20} color={Colors.primary} />
            </View>
            <Text style={[styles.menuText, { color: Colors.text }]}>Дашборды</Text>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: Colors.surface1 }]}
            onPress={() => router.push('/settings/security')}
          >
            <View style={[styles.menuIcon, { backgroundColor: Colors.surface2 }]}>
              <Shield size={20} color={Colors.primary} />
            </View>
            <Text style={[styles.menuText, { color: Colors.text }]}>Безопасность</Text>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: Colors.surface1 }]}
            onPress={() => router.push('/test-api')}
          >
            <View style={[styles.menuIcon, { backgroundColor: Colors.surface2 }]}>
              <TestTube size={20} color={Colors.primary} />
            </View>
            <Text style={[styles.menuText, { color: Colors.text }]}>Тест API</Text>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Информация</Text>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: Colors.surface1 }]}
            onPress={() => setShowAbout(true)}
          >
            <View style={[styles.menuIcon, { backgroundColor: Colors.surface2 }]}>
              <Info size={20} color={Colors.primary} />
            </View>
            <Text style={[styles.menuText, { color: Colors.text }]}>О компании</Text>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: Colors.surface1 }]}
            onPress={() => router.push('/legal/offer')}
          >
            <View style={[styles.menuIcon, { backgroundColor: Colors.surface2 }]}>
              <FileText size={20} color={Colors.primary} />
            </View>
            <Text style={[styles.menuText, { color: Colors.text }]}>Публичная оферта</Text>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: Colors.surface1 }]}
            onPress={() => router.push('/legal/privacy')}
          >
            <View style={[styles.menuIcon, { backgroundColor: Colors.surface2 }]}>
              <Lock size={20} color={Colors.primary} />
            </View>
            <Text style={[styles.menuText, { color: Colors.text }]}>Согласие на обработку данных</Text>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: Colors.surface1 }]}
            onPress={() => setShowChangelog(true)}
          >
            <Text style={[styles.menuText, { color: Colors.text }]}>Версия</Text>
            <Text style={[styles.menuValue, { color: Colors.textSecondary }]}>1.0.0</Text>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: Colors.surface1 }]}
            onPress={handleClearCache}
            disabled={isClearingCache}
          >
            <View style={[styles.menuIcon, { backgroundColor: Colors.surface2 }]}>
              {isClearingCache ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Trash2 size={20} color={Colors.primary} />
              )}
            </View>
            <Text style={[styles.menuText, { color: Colors.text }]}>Очистить кэш</Text>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.signOutButton, { backgroundColor: Colors.surface1 }]} onPress={handleSignOut}>
          <LogOut size={20} color={Colors.error} />
          <Text style={[styles.signOutText, { color: Colors.error }]}>Выйти</Text>
        </TouchableOpacity>
      </ScrollView>
      <Modal visible={showAbout} transparent animationType="fade" onRequestClose={() => setShowAbout(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.text }]}>О компании</Text>
              <TouchableOpacity onPress={() => setShowAbout(false)}><X size={20} color={Colors.text} /></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={[styles.infoText, { color: Colors.textSecondary, marginBottom: 16 }]}>Мы — логистическая платформа для создания и отслеживания перевозок. Поддержка 24/7, прозрачные цены, документы в одном месте.</Text>
              
              <Text style={[styles.infoSectionTitle, { color: Colors.text }]}>Реквизиты компании</Text>
              
              <View style={styles.requisiteRow}>
                <Text style={[styles.requisiteLabel, { color: Colors.textSecondary }]}>Наименование:</Text>
                <Text style={[styles.requisiteValue, { color: Colors.text }]}>ООО "Логистик Про"</Text>
              </View>
              
              <View style={styles.requisiteRow}>
                <Text style={[styles.requisiteLabel, { color: Colors.textSecondary }]}>ИНН:</Text>
                <Text style={[styles.requisiteValue, { color: Colors.text }]}>7707083893</Text>
              </View>
              
              <View style={styles.requisiteRow}>
                <Text style={[styles.requisiteLabel, { color: Colors.textSecondary }]}>КПП:</Text>
                <Text style={[styles.requisiteValue, { color: Colors.text }]}>770701001</Text>
              </View>
              
              <View style={styles.requisiteRow}>
                <Text style={[styles.requisiteLabel, { color: Colors.textSecondary }]}>ОГРН:</Text>
                <Text style={[styles.requisiteValue, { color: Colors.text }]}>1157746123456</Text>
              </View>
              
              <View style={styles.requisiteRow}>
                <Text style={[styles.requisiteLabel, { color: Colors.textSecondary }]}>Юридический адрес:</Text>
                <Text style={[styles.requisiteValue, { color: Colors.text }]}>г. Москва, ул. Тверская, д. 1, офис 100</Text>
              </View>
              
              <View style={styles.requisiteRow}>
                <Text style={[styles.requisiteLabel, { color: Colors.textSecondary }]}>Банк:</Text>
                <Text style={[styles.requisiteValue, { color: Colors.text }]}>ПАО "Сбербанк"</Text>
              </View>
              
              <View style={styles.requisiteRow}>
                <Text style={[styles.requisiteLabel, { color: Colors.textSecondary }]}>Р/С:</Text>
                <Text style={[styles.requisiteValue, { color: Colors.text }]}>40702810400000123456</Text>
              </View>
              
              <View style={styles.requisiteRow}>
                <Text style={[styles.requisiteLabel, { color: Colors.textSecondary }]}>К/С:</Text>
                <Text style={[styles.requisiteValue, { color: Colors.text }]}>30101810400000000225</Text>
              </View>
              
              <View style={styles.requisiteRow}>
                <Text style={[styles.requisiteLabel, { color: Colors.textSecondary }]}>БИК:</Text>
                <Text style={[styles.requisiteValue, { color: Colors.text }]}>044525225</Text>
              </View>
              
              <View style={styles.requisiteRow}>
                <Text style={[styles.requisiteLabel, { color: Colors.textSecondary }]}>Телефон:</Text>
                <Text style={[styles.requisiteValue, { color: Colors.text }]}>+7 (495) 123-45-67</Text>
              </View>
              
              <View style={styles.requisiteRow}>
                <Text style={[styles.requisiteLabel, { color: Colors.textSecondary }]}>Email:</Text>
                <Text style={[styles.requisiteValue, { color: Colors.text }]}>info@logistikpro.ru</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showChangelog} transparent animationType="fade" onRequestClose={() => setShowChangelog(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.text }]}>История версий</Text>
              <TouchableOpacity onPress={() => setShowChangelog(false)}><X size={20} color={Colors.text} /></TouchableOpacity>
            </View>
            <View style={{ gap: 12 }}>
              <Text style={{ color: Colors.text }}>[1.0.0] Первый релиз: перевозки, документы, поддержка, профиль.</Text>
              <Text style={{ color: Colors.text }}>[1.0.1] Улучшен поиск и стабильность. Исправлено удаление компаний в веб.</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  modalOverlay: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, padding: 20, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { width: '100%', maxWidth: 480, borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '700' as const },
  infoText: { fontSize: 15, lineHeight: 22 },
  infoSectionTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    marginTop: 8,
    marginBottom: 12,
  },
  requisiteRow: {
    marginBottom: 12,
  },
  requisiteLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  requisiteValue: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  profileCard: {
    flexDirection: 'row' as const,
    padding: 20,
    borderRadius: 20,
    marginBottom: 32,
    alignItems: 'center' as const,
    gap: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  profileInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  nameEditContainer: {
    marginBottom: 6,
  },
  nameInput: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  profileEmail: {
    fontSize: 15,
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
  menuItem: {
    flexDirection: 'row' as const,
    padding: 18,
    borderRadius: 16,
    marginBottom: 8,
    alignItems: 'center' as const,
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  menuValue: {
    fontSize: 15,
    marginRight: 8,
  },
  themeMenu: {
    borderRadius: 12,
    marginBottom: 8,
    marginLeft: 8,
    marginRight: 8,
    overflow: 'hidden' as const,
  },
  themeOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    gap: 12,
  },
  themeOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500' as const,
  },
  themeCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  signOutButton: {
    flexDirection: 'row' as const,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    marginTop: 16,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
