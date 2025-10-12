import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { AlertTriangle, Paperclip, X } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

type ErrorType = 'bug' | 'crash' | 'ui' | 'other';

type AttachedFile = {
  uri: string;
  name: string;
  type: string;
  size?: number;
};

export default function ReportErrorScreen() {
  const insets = useSafeAreaInsets();
  const Colors = useThemeColors();
  const [selectedType, setSelectedType] = useState<ErrorType | null>(null);
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  const errorTypes = [
    { id: 'bug' as ErrorType, label: 'Ошибка в работе', icon: AlertTriangle },
    { id: 'crash' as ErrorType, label: 'Приложение закрылось', icon: AlertTriangle },
    { id: 'ui' as ErrorType, label: 'Проблема с интерфейсом', icon: AlertTriangle },
    { id: 'other' as ErrorType, label: 'Другое', icon: AlertTriangle },
  ];

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Необходимо разрешение для доступа к галерее');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newFiles: AttachedFile[] = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.fileName || `file_${Date.now()}.jpg`,
        type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
        size: asset.fileSize,
      }));
      setAttachedFiles([...attachedFiles, ...newFiles]);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      multiple: true,
    });

    if (!result.canceled) {
      const newFiles: AttachedFile[] = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
        size: asset.size,
      }));
      setAttachedFiles([...attachedFiles, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  };

  const showAttachmentOptions = () => {
    Alert.alert(
      'Прикрепить файл',
      'Выберите источник',
      [
        {
          text: 'Галерея',
          onPress: pickImage,
        },
        {
          text: 'Документы',
          onPress: pickDocument,
        },
        {
          text: 'Отмена',
          style: 'cancel',
        },
      ]
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = () => {
    if (!selectedType) {
      Alert.alert('Ошибка', 'Выберите тип ошибки');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Ошибка', 'Опишите проблему');
      return;
    }

    console.log('Отправка отчета:', {
      type: selectedType,
      description,
      steps,
      files: attachedFiles,
    });

    Alert.alert(
      'Отчет отправлен',
      'Спасибо за ваш отчет! Мы рассмотрим его в ближайшее время.',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Сообщить об ошибке',
          headerBackTitle: 'Назад',
        }}
      />
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
          <AlertTriangle size={24} color={Colors.warning} />
          <Text style={[styles.infoText, { color: Colors.textSecondary }]}>
            Опишите проблему максимально подробно, чтобы мы могли быстрее её исправить
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Тип ошибки</Text>
          <View style={styles.typeGrid}>
            {errorTypes.map((type) => {
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
            placeholder="Опишите, что произошло..."
            placeholderTextColor={Colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Шаги для воспроизведения (необязательно)</Text>
          <TextInput
            style={[
              styles.textArea,
              { 
                backgroundColor: Colors.surface1,
                color: Colors.text,
                borderColor: Colors.border,
              }
            ]}
            placeholder="1. Открыл раздел...&#10;2. Нажал на кнопку...&#10;3. Произошла ошибка..."
            placeholderTextColor={Colors.textSecondary}
            value={steps}
            onChangeText={setSteps}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Прикрепленные файлы</Text>
          
          {attachedFiles.length > 0 && (
            <View style={styles.filesContainer}>
              {attachedFiles.map((file, index) => {
                const isImage = file.type.startsWith('image/');
                return (
                  <View
                    key={index}
                    style={[
                      styles.fileItem,
                      { backgroundColor: Colors.surface1, borderColor: Colors.border }
                    ]}
                  >
                    {isImage ? (
                      <Image source={{ uri: file.uri }} style={styles.filePreview} />
                    ) : (
                      <View style={[styles.filePreview, { backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center' }]}>
                        <Paperclip size={24} color={Colors.textSecondary} />
                      </View>
                    )}
                    <View style={styles.fileInfo}>
                      <Text style={[styles.fileName, { color: Colors.text }]} numberOfLines={1}>
                        {file.name}
                      </Text>
                      {file.size && (
                        <Text style={[styles.fileSize, { color: Colors.textSecondary }]}>
                          {formatFileSize(file.size)}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => removeFile(index)}
                      style={styles.removeButton}
                    >
                      <X size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.attachButton,
              { backgroundColor: Colors.surface1, borderColor: Colors.border }
            ]}
            onPress={showAttachmentOptions}
          >
            <Paperclip size={20} color={Colors.primary} />
            <Text style={[styles.attachButtonText, { color: Colors.primary }]}>
              Прикрепить файл
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            { 
              backgroundColor: selectedType && description.trim() ? Colors.primary : Colors.surface2,
            }
          ]}
          onPress={handleSubmit}
          disabled={!selectedType || !description.trim()}
        >
          <Text style={[
            styles.submitButtonText,
            { color: selectedType && description.trim() ? Colors.white : Colors.textSecondary }
          ]}>
            Отправить отчет
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
    </>
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
    flexDirection: 'row' as const,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
    alignItems: 'center' as const,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
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
  filesContainer: {
    gap: 12,
    marginBottom: 12,
  },
  fileItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  filePreview: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  fileInfo: {
    flex: 1,
    gap: 4,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  fileSize: {
    fontSize: 12,
  },
  removeButton: {
    padding: 4,
  },
  attachButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed' as const,
    gap: 8,
  },
  attachButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
