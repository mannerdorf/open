import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useMemo } from 'react';
import { AlertCircle, FileText, Camera, Image as ImageIcon, X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useCompanies } from '@/contexts/CompanyContext';
import * as ImagePicker from 'expo-image-picker';
import type { Claim, ClaimStatus } from '@/types';

type ClaimType = 'damage' | 'shortage' | 'delay' | 'other';

export default function ClaimScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const Colors = useThemeColors();
  const { markOrderWithClaim, orders } = useCompanies();
  const [selectedType, setSelectedType] = useState<ClaimType | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);

  const order = useMemo(() => orders.find(o => o.id === id), [orders, id]);
  const existingClaim = order?.claim;

  const claimTypes = [
    { id: 'damage' as ClaimType, label: 'Повреждение груза', icon: AlertCircle },
    { id: 'shortage' as ClaimType, label: 'Недостача', icon: FileText },
    { id: 'delay' as ClaimType, label: 'Задержка доставки', icon: AlertCircle },
    { id: 'other' as ClaimType, label: 'Другое', icon: FileText },
  ];

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Ошибка', 'Необходимо разрешение на доступ к галерее');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newUris = result.assets.map(asset => asset.uri);
      setAttachments(prev => [...prev, ...newUris]);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Ошибка', 'Необходимо разрешение на доступ к камере');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      setAttachments(prev => [...prev, result.assets[0].uri]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!selectedType) {
      Alert.alert('Ошибка', 'Выберите тип претензии');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Ошибка', 'Опишите проблему');
      return;
    }
    if (!amount.trim()) {
      Alert.alert('Ошибка', 'Укажите сумму претензии');
      return;
    }

    if (id) {
      const newClaim: Claim = {
        id: `CLM-${Date.now()}`,
        orderId: id,
        type: selectedType,
        description,
        amount: parseFloat(amount),
        attachments,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      markOrderWithClaim(id, newClaim);
    }

    Alert.alert(
      'Претензия отправлена',
      'Ваша претензия успешно отправлена. Мы рассмотрим её в течение 3 рабочих дней.',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const getStatusInfo = (status: ClaimStatus) => {
    switch (status) {
      case 'approved':
        return { label: 'Удовлетворена', icon: CheckCircle, color: Colors.success };
      case 'partially_approved':
        return { label: 'Удовлетворена частично', icon: AlertTriangle, color: Colors.warning };
      case 'rejected':
        return { label: 'Отказано', icon: XCircle, color: Colors.error };
      default:
        return { label: 'На рассмотрении', icon: AlertCircle, color: Colors.textSecondary };
    }
  };

  if (existingClaim) {
    const statusInfo = getStatusInfo(existingClaim.status);
    const StatusIcon = statusInfo.icon;

    return (
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        >
          <View style={[styles.infoCard, { backgroundColor: Colors.surface1 }]}>
            <Text style={[styles.infoText, { color: Colors.textSecondary }]}>
              Перевозка: <Text style={[styles.infoTextBold, { color: Colors.text }]}>{id}</Text>
            </Text>
          </View>

          <View style={[styles.statusCard, { backgroundColor: Colors.surface1 }]}>
            <View style={styles.statusHeader}>
              <StatusIcon size={32} color={statusInfo.color} />
              <View style={styles.statusTextContainer}>
                <Text style={[styles.statusLabel, { color: Colors.textSecondary }]}>Статус претензии</Text>
                <Text style={[styles.statusValue, { color: statusInfo.color }]}>{statusInfo.label}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors.text }]}>Информация о претензии</Text>
            <View style={[styles.detailCard, { backgroundColor: Colors.surface1 }]}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: Colors.textSecondary }]}>Номер претензии:</Text>
                <Text style={[styles.detailValue, { color: Colors.text }]}>{existingClaim.id}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: Colors.textSecondary }]}>Сумма:</Text>
                <Text style={[styles.detailValue, { color: Colors.text }]}>{existingClaim.amount.toLocaleString('ru-RU')} ₽</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: Colors.textSecondary }]}>Дата создания:</Text>
                <Text style={[styles.detailValue, { color: Colors.text }]}>
                  {new Date(existingClaim.createdAt).toLocaleDateString('ru-RU')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors.text }]}>Описание</Text>
            <View style={[styles.descriptionCard, { backgroundColor: Colors.surface1 }]}>
              <Text style={[styles.descriptionText, { color: Colors.text }]}>{existingClaim.description}</Text>
            </View>
          </View>

          {existingClaim.attachments && existingClaim.attachments.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: Colors.text }]}>Приложения</Text>
              <View style={styles.attachmentGrid}>
                {existingClaim.attachments.map((uri, index) => (
                  <View key={index} style={styles.attachmentItem}>
                    <Image source={{ uri }} style={styles.attachmentImage} />
                  </View>
                ))}
              </View>
            </View>
          )}

          {existingClaim.response && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: Colors.text }]}>Ответ</Text>
              <View style={[styles.responseCard, { backgroundColor: Colors.surface1, borderLeftColor: statusInfo.color }]}>
                <Text style={[styles.responseText, { color: Colors.text }]}>{existingClaim.response}</Text>
                <Text style={[styles.responseDate, { color: Colors.textSecondary }]}>
                  {new Date(existingClaim.updatedAt).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: Colors.surface1, borderColor: Colors.border }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: Colors.text }]}>Назад</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: Colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.infoCard, { backgroundColor: Colors.surface1 }]}>
          <Text style={[styles.infoText, { color: Colors.textSecondary }]}>
            Перевозка: <Text style={[styles.infoTextBold, { color: Colors.text }]}>{id}</Text>
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Тип претензии</Text>
          <View style={styles.typeGrid}>
            {claimTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeCard,
                    { 
                      backgroundColor: Colors.surface1,
                      borderColor: isSelected ? Colors.primary : Colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    }
                  ]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <Icon size={24} color={isSelected ? Colors.primary : Colors.textSecondary} />
                  <Text style={[
                    styles.typeLabel,
                    { color: isSelected ? Colors.primary : Colors.text }
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Описание проблемы</Text>
          <TextInput
            style={[
              styles.textArea,
              { 
                backgroundColor: Colors.surface1,
                color: Colors.text,
                borderColor: Colors.border,
              }
            ]}
            placeholder="Опишите подробно суть претензии..."
            placeholderTextColor={Colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Сумма претензии *</Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: Colors.surface1,
                color: Colors.text,
                borderColor: Colors.border,
              }
            ]}
            placeholder="0.00"
            placeholderTextColor={Colors.textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
          <Text style={[styles.hint, { color: Colors.textSecondary }]}>
            Укажите сумму ущерба в рублях
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Фото и видео</Text>
          <View style={styles.attachmentButtons}>
            <TouchableOpacity
              style={[styles.attachmentButton, { backgroundColor: Colors.surface1, borderColor: Colors.border }]}
              onPress={takePhoto}
            >
              <Camera size={24} color={Colors.primary} />
              <Text style={[styles.attachmentButtonText, { color: Colors.text }]}>Сделать фото</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.attachmentButton, { backgroundColor: Colors.surface1, borderColor: Colors.border }]}
              onPress={pickImage}
            >
              <ImageIcon size={24} color={Colors.primary} />
              <Text style={[styles.attachmentButtonText, { color: Colors.text }]}>Из галереи</Text>
            </TouchableOpacity>
          </View>
          {attachments.length > 0 && (
            <View style={styles.attachmentGrid}>
              {attachments.map((uri, index) => (
                <View key={index} style={styles.attachmentItem}>
                  <Image source={{ uri }} style={styles.attachmentImage} />
                  <TouchableOpacity
                    style={[styles.removeButton, { backgroundColor: Colors.error }]}
                    onPress={() => removeAttachment(index)}
                  >
                    <X size={16} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            { 
              backgroundColor: selectedType && description.trim() && amount.trim() ? Colors.primary : Colors.surface2,
            }
          ]}
          onPress={handleSubmit}
          disabled={!selectedType || !description.trim() || !amount.trim()}
        >
          <Text style={[
            styles.submitButtonText,
            { color: selectedType && description.trim() && amount.trim() ? Colors.white : Colors.textSecondary }
          ]}>
            Отправить претензию
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 15,
  },
  infoTextBold: {
    fontWeight: '600' as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  typeCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
    gap: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  textArea: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    borderWidth: 1,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  hint: {
    fontSize: 13,
    marginTop: 8,
  },
  attachmentButtons: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  attachmentButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  attachmentButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  attachmentGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
    marginTop: 12,
  },
  attachmentItem: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  statusCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  detailCard: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  detailLabel: {
    fontSize: 15,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  descriptionCard: {
    padding: 16,
    borderRadius: 12,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  responseCard: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  responseText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  responseDate: {
    fontSize: 13,
  },
  backButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 8,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
});
