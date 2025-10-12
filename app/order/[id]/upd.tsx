import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useThemeColors } from '@/constants/colors';
import { Share2, FileText } from 'lucide-react-native';

export default function UpdScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const Colors = useThemeColors();
  const router = useRouter();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Универсальный передаточный документ\nПеревозка ${id}\nДата: ${new Date().toLocaleDateString('ru-RU')}`,
        title: 'УПД',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: 'УПД',
          headerRight: () => (
            <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
              <Share2 size={24} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        <View style={[styles.documentCard, { backgroundColor: Colors.surface1 }]}>
          <Text style={[styles.documentTitle, { color: Colors.text }]}>
            Универсальный передаточный документ
          </Text>
          <Text style={[styles.documentSubtitle, { color: Colors.textSecondary }]}>
            Перевозка {id}
          </Text>
          
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800&q=80' }}
              style={styles.documentImage}
              resizeMode="contain"
            />
          </View>

          <View style={[styles.infoSection, { borderTopColor: Colors.border }]}>
            <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>Дата составления</Text>
            <Text style={[styles.infoValue, { color: Colors.text }]}>
              {new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
          </View>

          <View style={[styles.infoSection, { borderTopColor: Colors.border }]}>
            <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>Номер документа</Text>
            <Text style={[styles.infoValue, { color: Colors.text }]}>УПД-{id}</Text>
          </View>

          <View style={[styles.infoSection, { borderTopColor: Colors.border }]}>
            <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>Статус</Text>
            <View style={[styles.statusBadge, { backgroundColor: Colors.successBg }]}>
              <Text style={[styles.statusText, { color: Colors.success }]}>Подписан</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.detailsButton, { backgroundColor: Colors.primary }]}
            onPress={() => router.push(`/document/invoice/${id}`)}
          >
            <FileText size={20} color={Colors.white} />
            <Text style={[styles.detailsButtonText, { color: Colors.white }]}>Перейти к счету</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  documentCard: {
    padding: 20,
    borderRadius: 16,
  },
  documentTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  documentSubtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 0.7,
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden' as const,
  },
  documentImage: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    marginTop: 16,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  statusBadge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  shareButton: {
    padding: 8,
    marginRight: 8,
  },
  detailsButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  detailsButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
