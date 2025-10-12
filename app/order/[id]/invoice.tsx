import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Share, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useThemeColors } from '@/constants/colors';
import { Share2, FileText, CreditCard } from 'lucide-react-native';
import { useState } from 'react';

export default function InvoiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const Colors = useThemeColors();
  const router = useRouter();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const grandTotal = 69600;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Счет на оплату\nПеревозка ${id}\nДата: ${new Date().toLocaleDateString('ru-RU')}`,
        title: 'Счет на оплату',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: 'Счет',
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
            Счет на оплату
          </Text>
          <Text style={[styles.documentSubtitle, { color: Colors.textSecondary }]}>
            Перевозка {id}
          </Text>
          
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1554224311-beee460201f9?w=800&q=80' }}
              style={styles.documentImage}
              resizeMode="contain"
            />
          </View>

          <View style={[styles.infoSection, { borderTopColor: Colors.border }]}>
            <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>Дата выставления</Text>
            <Text style={[styles.infoValue, { color: Colors.text }]}>
              {new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
          </View>

          <View style={[styles.infoSection, { borderTopColor: Colors.border }]}>
            <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>Номер счета</Text>
            <Text style={[styles.infoValue, { color: Colors.text }]}>СЧ-{id}</Text>
          </View>

          <View style={[styles.infoSection, { borderTopColor: Colors.border }]}>
            <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>Статус оплаты</Text>
            <View style={[styles.statusBadge, { backgroundColor: Colors.warningBg }]}>
              <Text style={[styles.statusText, { color: Colors.warning }]}>Ожидает оплаты</Text>
            </View>
          </View>



          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.detailsButton, { backgroundColor: Colors.surface2 }]}
              onPress={() => router.push(`/document/invoice/${id}`)}
            >
              <FileText size={20} color={Colors.primary} />
              <Text style={[styles.detailsButtonText, { color: Colors.primary }]}>Подробнее</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.payButton, { backgroundColor: Colors.primary }]}
              onPress={() => setShowPaymentModal(true)}
            >
              <CreditCard size={20} color={Colors.white} />
              <Text style={[styles.payButtonText, { color: Colors.white }]}>Оплатить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowPaymentModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: Colors.surface1 }]}>
            <Text style={[styles.modalTitle, { color: Colors.text }]}>Оплата счета</Text>
            <Text style={[styles.modalSubtitle, { color: Colors.textSecondary }]}>
              Счет №СЧ-{id}
            </Text>
            <Text style={[styles.modalAmount, { color: Colors.text }]}>
              {grandTotal.toLocaleString('ru-RU')} ₽
            </Text>
            
            <View style={styles.paymentMethods}>
              <TouchableOpacity
                style={[styles.paymentMethod, { backgroundColor: Colors.surface2 }]}
                onPress={() => {
                  setShowPaymentModal(false);
                }}
              >
                <CreditCard size={24} color={Colors.primary} />
                <Text style={[styles.paymentMethodText, { color: Colors.text }]}>Банковская карта</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.paymentMethod, { backgroundColor: Colors.surface2 }]}
                onPress={() => {
                  setShowPaymentModal(false);
                }}
              >
                <Text style={[styles.paymentMethodIcon, { color: Colors.primary }]}>СБП</Text>
                <Text style={[styles.paymentMethodText, { color: Colors.text }]}>Система быстрых платежей</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentMethod, { backgroundColor: Colors.surface2 }]}
                onPress={() => {
                  setShowPaymentModal(false);
                }}
              >
                <FileText size={24} color={Colors.primary} />
                <Text style={[styles.paymentMethodText, { color: Colors.text }]}>Оплатить по счету</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: Colors.surface2 }]}
              onPress={() => setShowPaymentModal(false)}
            >
              <Text style={[styles.cancelButtonText, { color: Colors.text }]}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
  expandButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  expandButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  itemsContainer: {
    marginTop: 16,
    gap: 12,
  },
  itemCard: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  itemLabel: {
    fontSize: 14,
  },
  itemValue: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  totalSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    gap: 8,
  },
  totalRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  totalLabel: {
    fontSize: 15,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  actionsContainer: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 24,
  },
  detailsButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  detailsButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  payButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center' as const,
    marginBottom: 16,
  },
  modalAmount: {
    fontSize: 32,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
    marginBottom: 32,
  },
  paymentMethods: {
    gap: 12,
    marginBottom: 24,
  },
  paymentMethod: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
    padding: 16,
    borderRadius: 12,
  },
  paymentMethodIcon: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
