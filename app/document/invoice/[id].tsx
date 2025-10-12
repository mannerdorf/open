import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Modal, Pressable, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useThemeColors } from '@/constants/colors';
import { Share2, ChevronDown, ChevronUp, CreditCard, FileText, Download, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';

interface InvoiceItem {
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  total: number;
  vat: number;
}

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const Colors = useThemeColors();
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceImage, setShowInvoiceImage] = useState(false);

  const invoiceItems: InvoiceItem[] = [
    {
      name: 'Транспортные услуги',
      quantity: 1,
      unit: 'шт',
      pricePerUnit: 50000,
      total: 50000,
      vat: 10000,
    },
    {
      name: 'Погрузочно-разгрузочные работы',
      quantity: 2,
      unit: 'час',
      pricePerUnit: 2500,
      total: 5000,
      vat: 1000,
    },
    {
      name: 'Страхование груза',
      quantity: 1,
      unit: 'шт',
      pricePerUnit: 3000,
      total: 3000,
      vat: 600,
    },
  ];

  const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
  const totalVat = invoiceItems.reduce((sum, item) => sum + item.vat, 0);
  const grandTotal = subtotal + totalVat;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Счет на оплату\nПеревозка ${id}\nДата: ${new Date().toLocaleDateString('ru-RU')}\nСумма: ${grandTotal.toLocaleString('ru-RU')} ₽`,
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === 'web' ? 20 : insets.bottom + 70 }]}
      >
        <View style={[styles.documentCard, { backgroundColor: Colors.surface1 }]}>
          <Text style={[styles.documentTitle, { color: Colors.text }]}>
            Счет на оплату
          </Text>
          <Text style={[styles.documentSubtitle, { color: Colors.textSecondary }]}>
            Перевозка {id}
          </Text>

          <TouchableOpacity
            style={[styles.orderCard, { backgroundColor: Colors.surface2 }]}
            onPress={() => router.push(`/order/${id}`)}
          >
            <View style={styles.orderInfo}>
              <Text style={[styles.orderLabel, { color: Colors.textSecondary }]}>Перевозка</Text>
              <Text style={[styles.orderNumber, { color: Colors.text }]}>№{id}</Text>
            </View>
            <View style={styles.orderStatusContainer}>
              <View style={[styles.orderStatusBadge, { backgroundColor: Colors.successBg }]}>
                <Text style={[styles.orderStatusText, { color: Colors.success }]}>В пути</Text>
              </View>
              <ChevronRight size={20} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <View style={[styles.infoSection, { borderTopColor: Colors.border }]}>
            <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>Дата выставления</Text>
            <Text style={[styles.infoValue, { color: Colors.text }]}>
              {new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
          </View>

          <View style={[styles.infoSection, { borderTopColor: Colors.border }]}>
            <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>Плановая дата оплаты</Text>
            <Text style={[styles.infoValue, { color: Colors.text }]}>
              {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
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

          <TouchableOpacity
            style={[styles.expandButton, { backgroundColor: Colors.surface2 }]}
            onPress={() => setExpanded(!expanded)}
          >
            <Text style={[styles.expandButtonText, { color: Colors.text }]}>Номенклатура</Text>
            {expanded ? (
              <ChevronUp size={20} color={Colors.text} />
            ) : (
              <ChevronDown size={20} color={Colors.text} />
            )}
          </TouchableOpacity>

          {expanded && (
            <View style={styles.itemsContainer}>
              {invoiceItems.map((item, index) => (
                <View key={index} style={[styles.itemCard, { backgroundColor: Colors.surface2 }]}>
                  <Text style={[styles.itemName, { color: Colors.text }]}>{item.name}</Text>
                  <View style={styles.itemRow}>
                    <Text style={[styles.itemLabel, { color: Colors.textSecondary }]}>Количество:</Text>
                    <Text style={[styles.itemValue, { color: Colors.text }]}>{item.quantity} {item.unit}</Text>
                  </View>
                  <View style={styles.itemRow}>
                    <Text style={[styles.itemLabel, { color: Colors.textSecondary }]}>Цена за единицу:</Text>
                    <Text style={[styles.itemValue, { color: Colors.text }]}>{item.pricePerUnit.toLocaleString('ru-RU')} ₽</Text>
                  </View>
                  <View style={styles.itemRow}>
                    <Text style={[styles.itemLabel, { color: Colors.textSecondary }]}>Сумма:</Text>
                    <Text style={[styles.itemValue, { color: Colors.text }]}>{item.total.toLocaleString('ru-RU')} ₽</Text>
                  </View>
                  <View style={styles.itemRow}>
                    <Text style={[styles.itemLabel, { color: Colors.textSecondary }]}>НДС (20%):</Text>
                    <Text style={[styles.itemValue, { color: Colors.text }]}>{item.vat.toLocaleString('ru-RU')} ₽</Text>
                  </View>
                </View>
              ))}
              
              <View style={[styles.totalSection, { borderTopColor: Colors.border }]}>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: Colors.textSecondary }]}>Итого без НДС:</Text>
                  <Text style={[styles.totalValue, { color: Colors.text }]}>{subtotal.toLocaleString('ru-RU')} ₽</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: Colors.textSecondary }]}>НДС:</Text>
                  <Text style={[styles.totalValue, { color: Colors.text }]}>{totalVat.toLocaleString('ru-RU')} ₽</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={[styles.grandTotalLabel, { color: Colors.text }]}>Всего к оплате:</Text>
                  <Text style={[styles.grandTotalValue, { color: Colors.primary }]}>{grandTotal.toLocaleString('ru-RU')} ₽</Text>
                </View>
              </View>
            </View>
          )}

          <View style={[styles.updSection, { borderTopColor: Colors.border }]}>
            <Text style={[styles.updTitle, { color: Colors.text }]}>Связанные документы</Text>
            <TouchableOpacity
              style={[styles.updCard, { backgroundColor: Colors.surface2 }]}
              onPress={() => router.push(`/order/${id}/upd`)}
            >
              <FileText size={24} color={Colors.primary} />
              <View style={styles.updInfo}>
                <Text style={[styles.updName, { color: Colors.text }]}>УПД-{id}</Text>
                <Text style={[styles.updDate, { color: Colors.textSecondary }]}>
                  {new Date().toLocaleDateString('ru-RU')}
                </Text>
              </View>
              <View style={[styles.updBadge, { backgroundColor: Colors.successBg }]}>
                <Text style={[styles.updBadgeText, { color: Colors.success }]}>Подписан</Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.payButton, { backgroundColor: Colors.primary }]}
            onPress={() => setShowPaymentModal(true)}
          >
            <CreditCard size={20} color={Colors.white} />
            <Text style={[styles.payButtonText, { color: Colors.white }]}>Оплатить</Text>
          </TouchableOpacity>
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
                  setShowInvoiceImage(true);
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

      <Modal
        visible={showInvoiceImage}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInvoiceImage(false)}
      >
        <View style={styles.imageModalOverlay}>
          <View style={[styles.imageModalContent, { backgroundColor: Colors.background }]}>
            <View style={styles.imageHeader}>
              <Text style={[styles.imageTitle, { color: Colors.text }]}>Счет на оплату</Text>
              <TouchableOpacity onPress={() => setShowInvoiceImage(false)}>
                <Text style={[styles.closeButton, { color: Colors.primary }]}>Закрыть</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.imageScroll} contentContainerStyle={styles.imageScrollContent}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1554224311-beee460c201f?w=800' }}
                style={styles.invoiceImage}
                resizeMode="contain"
              />
            </ScrollView>

            <View style={[styles.imageActions, { backgroundColor: Colors.surface1, borderTopColor: Colors.border }]}>
              <TouchableOpacity
                style={[styles.imageActionButton, { backgroundColor: Colors.surface2 }]}
                onPress={async () => {
                  try {
                    await Share.share({
                      message: `Счет на оплату №СЧ-${id}`,
                      title: 'Счет на оплату',
                    });
                  } catch (error) {
                    console.error('Error sharing:', error);
                  }
                }}
              >
                <Share2 size={20} color={Colors.primary} />
                <Text style={[styles.imageActionText, { color: Colors.text }]}>Отправить</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.imageActionButton, { backgroundColor: Colors.surface2 }]}
                onPress={() => {
                  console.log('Download invoice');
                }}
              >
                <Download size={20} color={Colors.primary} />
                <Text style={[styles.imageActionText, { color: Colors.text }]}>Скачать</Text>
              </TouchableOpacity>
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
    marginBottom: 16,
  },
  orderCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  orderStatusContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  orderStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  orderStatusText: {
    fontSize: 14,
    fontWeight: '600' as const,
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
  updSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  updTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  updCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  updInfo: {
    flex: 1,
  },
  updName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  updDate: {
    fontSize: 14,
  },
  updBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  updBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  payButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
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
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  imageModalContent: {
    flex: 1,
  },
  imageHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 20,
    paddingTop: 60,
  },
  imageTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  imageScroll: {
    flex: 1,
  },
  imageScrollContent: {
    padding: 20,
  },
  invoiceImage: {
    width: '100%',
    height: 600,
    borderRadius: 12,
  },
  imageActions: {
    flexDirection: 'row' as const,
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  imageActionButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  imageActionText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
