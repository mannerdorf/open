import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Platform, ActionSheetIOS, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Share2, MessageCircle, FileText, ClipboardList, AlertCircle, Archive } from 'lucide-react-native';
import { useCompanies } from '@/contexts/CompanyContext';
import { useThemeColors } from '@/constants/colors';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const Colors = useThemeColors();
  const { orders, archiveOrder } = useCompanies();

  const order = orders.find(o => o.id === id);

  if (!order) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <Stack.Screen options={{ title: 'Детали перевозки' }} />
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: Colors.text }]}>Перевозка не найдена</Text>
        </View>
      </View>
    );
  }

  const statusConfig = {
    created: { label: 'Создана', color: Colors.statusCreated },
    accepted: { label: 'Принят', color: Colors.statusCreated },
    in_transit: { label: 'В пути', color: Colors.statusInTransit },
    ready_for_pickup: { label: 'Готов к выдаче', color: Colors.statusAtWarehouse },
    out_for_delivery: { label: 'На доставке', color: Colors.statusOutForDelivery },
    delivered: { label: 'Выдан', color: Colors.statusDelivered },
  };

  const status = statusConfig[order.status];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: 'long', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleShare = async () => {
    const message = `Перевозка ${order.id}\nСтатус: ${status.label}\nОтправитель: ${order.sender?.name || 'Не указан'}\nПолучатель: ${order.receiver?.name || 'Не указан'}`;
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showShareActionSheetWithOptions(
        {
          message,
        },
        (error) => console.error('Error sharing:', error),
        (success, method) => {
          if (success) {
            console.log('Shared via', method);
          }
        }
      );
    } else if (Platform.OS === 'android') {
      try {
        await Share.share({
          message,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Перевозка ${order.id}`,
            text: message,
          });
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            console.error('Error sharing:', error);
            showWebShareFallback();
          }
        }
      } else {
        showWebShareFallback();
      }
    }
  };

  const showWebShareFallback = () => {
    Alert.alert(
      'Поделиться',
      'Выберите способ отправки',
      [
        { text: 'WhatsApp', onPress: () => console.log('WhatsApp') },
        { text: 'Telegram', onPress: () => console.log('Telegram') },
        { text: 'SMS', onPress: () => console.log('SMS') },
        { text: 'Email', onPress: () => console.log('Email') },
        { text: 'Отмена', style: 'cancel' },
      ]
    );
  };

  const handleChatPress = () => {
    router.push({
      pathname: '/support/chat',
      params: {
        prefilledMessage: `Добрый день у меня вопрос по перевозке ${order.id}`,
      },
    });
  };

  const handleArchive = () => {
    Alert.alert(
      'Архивировать перевозку',
      'Перевозка будет перемещена в архив',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Архивировать',
          style: 'destructive',
          onPress: async () => {
            await archiveOrder(order.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Stack.Screen options={{ title: 'Детали перевозки' }} />
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        <View style={[styles.statusCard, { backgroundColor: Colors.surface1 }]}>
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              <Text style={[styles.orderId, { color: Colors.text }]}>{order.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
                <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={[styles.iconButton, { backgroundColor: Colors.surface2 }]}
                onPress={handleChatPress}
              >
                <MessageCircle size={20} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.iconButton, { backgroundColor: Colors.surface2 }]}
                onPress={handleShare}
              >
                <Share2 size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>



        {order.sender && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors.text }]}>Отправитель</Text>
            <View style={[styles.infoCard, { backgroundColor: Colors.surface1 }]}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>Наименование</Text>
                <Text style={[styles.infoValue, { color: Colors.text }]}>{order.sender.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>ИНН</Text>
                <Text style={[styles.infoValue, { color: Colors.text }]}>{order.sender.inn}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>Телефон</Text>
                <Text style={[styles.infoValue, { color: Colors.text }]}>{order.sender.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>Адрес</Text>
                <Text style={[styles.infoValue, { color: Colors.text }]}>{order.sender.address}</Text>
              </View>
              {order.sender.workingHours && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>График работы</Text>
                  <Text style={[styles.infoValue, { color: Colors.text }]}>{order.sender.workingHours}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {order.receiver && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors.text }]}>Получатель</Text>
            <View style={[styles.infoCard, { backgroundColor: Colors.surface1 }]}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>Наименование</Text>
                <Text style={[styles.infoValue, { color: Colors.text }]}>{order.receiver.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>ИНН</Text>
                <Text style={[styles.infoValue, { color: Colors.text }]}>{order.receiver.inn}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>Телефон</Text>
                <Text style={[styles.infoValue, { color: Colors.text }]}>{order.receiver.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>Адрес</Text>
                <Text style={[styles.infoValue, { color: Colors.text }]}>{order.receiver.address}</Text>
              </View>
            </View>
          </View>
        )}

        {order.cargo && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors.text }]}>Груз</Text>
            <View style={[styles.infoCard, { backgroundColor: Colors.surface1 }]}>
              {order.plannedLoadingDate && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>Плановая дата погрузки</Text>
                  <Text style={[styles.infoValue, { color: Colors.text }]}>{formatDate(order.plannedLoadingDate)}</Text>
                </View>
              )}
              {order.cargo.description && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>Наименование</Text>
                  <Text style={[styles.infoValue, { color: Colors.text }]}>{order.cargo.description}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>Вид тары (короб, паллет и т.д.)</Text>
                <Text style={[styles.infoValue, { color: Colors.text }]}>
                  {order.cargo.type === 'pallet' ? 'Паллеты' : 
                   order.cargo.type === 'box' ? 'Коробки' : 
                   order.cargo.type === 'envelope' ? 'Конверты' : 'Другое'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>Вес, кг</Text>
                <Text style={[styles.infoValue, { color: Colors.text }]}>{order.cargo.weightKg}</Text>
              </View>
              {order.cargo.chargeableWeight && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>Платный вес, кг</Text>
                  <Text style={[styles.infoValue, { color: Colors.text }]}>{order.cargo.chargeableWeight}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>Объем, м3</Text>
                <Text style={[styles.infoValue, { color: Colors.text }]}>{order.cargo.volumeM3}</Text>
              </View>
              {order.cargo.dimensions && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>Габаритные размеры, м</Text>
                  <Text style={[styles.infoValue, { color: Colors.text }]}>{order.cargo.dimensions}</Text>
                </View>
              )}
              {order.cargo.density && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>Плотность</Text>
                  <Text style={[styles.infoValue, { color: Colors.text }]}>{order.cargo.density}</Text>
                </View>
              )}
              {order.customer?.transportationType && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: Colors.textSecondary }]}>Вид транспортировки</Text>
                  <Text style={[styles.infoValue, { color: Colors.text }]}>
                    {order.customer.transportationType === 'auto' ? 'Авто' : 'Паром'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {order.tracking?.checkpoints && order.tracking.checkpoints.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors.text }]}>Статус доставки</Text>
            {order.plannedDeliveryDate && (
              <View style={[styles.plannedDateCard, { backgroundColor: Colors.surface2 }]}>
                <Text style={[styles.plannedDateLabel, { color: Colors.textSecondary }]}>Плановая дата доставки</Text>
                <Text style={[styles.plannedDateValue, { color: Colors.text }]}>{formatDate(order.plannedDeliveryDate)}</Text>
              </View>
            )}
            <View style={[styles.timelineCard, { backgroundColor: Colors.surface1 }]}>
              {order.tracking.checkpoints.map((checkpoint, index) => {
              const checkpointStatus = statusConfig[checkpoint.status];
              const isCompleted = order.tracking!.checkpoints.findIndex(c => c.status === order.status) >= index;
              const isActive = checkpoint.status === order.status;
              
              return (
                <View key={index} style={styles.timelineItem}>
                  <View style={[
                    styles.timelineDot,
                    isCompleted && styles.timelineDotCompleted,
                    isActive && styles.timelineDotActive,
                    { 
                      borderColor: isCompleted ? checkpointStatus.color : Colors.border,
                      backgroundColor: isCompleted ? checkpointStatus.color : Colors.surface1,
                    }
                  ]} />
                  <View style={styles.timelineContent}>
                    <Text style={[
                      styles.timelineTitle, 
                      { color: isCompleted ? Colors.text : Colors.textSecondary }
                    ]}>
                      {checkpoint.title}
                    </Text>
                    <Text style={[styles.timelineDate, { color: Colors.textSecondary }]}>
                      {formatDateTime(checkpoint.ts)}
                    </Text>
                  </View>
                </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.documentsSection}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Документы</Text>
          <View style={styles.documentButtons}>
            <TouchableOpacity 
              style={[styles.documentButton, { backgroundColor: Colors.surface1, borderColor: Colors.border }]}
              onPress={() => router.push(`/order/${order.id}/receipt`)}
            >
              <FileText size={20} color={Colors.primary} />
              <Text style={[styles.documentButtonText, { color: Colors.text }]}>Экспедиторская расписка</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.documentButton, { backgroundColor: Colors.surface1, borderColor: Colors.border }]}
              onPress={() => router.push(`/order/${order.id}/act`)}
            >
              <ClipboardList size={20} color={Colors.primary} />
              <Text style={[styles.documentButtonText, { color: Colors.text }]}>Акт приема-передачи</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.documentButton, { backgroundColor: Colors.surface1, borderColor: Colors.border }]}
              onPress={() => router.push(`/order/${order.id}/invoice`)}
            >
              <FileText size={20} color={Colors.primary} />
              <Text style={[styles.documentButtonText, { color: Colors.text }]}>Счет</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.documentButton, { backgroundColor: Colors.surface1, borderColor: Colors.border }]}
              onPress={() => router.push(`/order/${order.id}/upd`)}
            >
              <FileText size={20} color={Colors.primary} />
              <Text style={[styles.documentButtonText, { color: Colors.text }]}>УПД</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.documentButton, { backgroundColor: Colors.primary }]}
              onPress={() => router.push(`/order/${order.id}/claim`)}
            >
              <AlertCircle size={20} color={Colors.white} />
              <Text style={[styles.documentButtonText, { color: Colors.white }]}>Сформировать претензию</Text>
            </TouchableOpacity>
            {order.hasClaim && (
              <TouchableOpacity 
                style={[styles.documentButton, { backgroundColor: Colors.surface1, borderColor: Colors.border }]}
                onPress={handleArchive}
              >
                <Archive size={20} color={Colors.primary} />
                <Text style={[styles.documentButtonText, { color: Colors.text }]}>Переместить в архив</Text>
              </TouchableOpacity>
            )}
          </View>
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
  emptyState: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 40,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  statusCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  statusInfo: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  orderId: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },

  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  infoCard: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  infoRow: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  timelineCard: {
    padding: 20,
    borderRadius: 16,
  },
  timelineItem: {
    flexDirection: 'row' as const,
    gap: 12,
    paddingBottom: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    marginTop: 4,
  },
  timelineDotCompleted: {},
  timelineDotActive: {},
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 13,
  },
  plannedDateCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  plannedDateLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  plannedDateValue: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  documentsSection: {
    marginBottom: 20,
  },
  documentButtons: {
    gap: 12,
  },
  documentButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
  },
  documentButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    flex: 1,
  },
});
