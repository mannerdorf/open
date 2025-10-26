import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useMemo, useEffect } from 'react';
import { Search, Package, ChevronRight, Clock, Building2, Check, Plus, Copy } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useThemeColors } from '@/constants/colors';
import { useCompanies } from '@/contexts/CompanyContext';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const Colors = useThemeColors();
  const router = useRouter();
  const { orders, selectedCompanyId, companies, selectCompany, documents } = useCompanies();
  const [activeTab, setActiveTab] = useState<'active' | 'archive' | 'action'>('active');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [showCompanySelector, setShowCompanySelector] = useState(false);

  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customDateVisible, setCustomDateVisible] = useState(false);
  const [customDateInput, setCustomDateInput] = useState('');
  const [statusFilterOrders, setStatusFilterOrders] = useState<'all' | 'created' | 'accepted' | 'in_transit' | 'ready_for_pickup' | 'out_for_delivery' | 'delivered'>('all');
  const params = useLocalSearchParams();

  const statusConfig = {
    created: { label: 'Создана', color: Colors.statusCreated },
    accepted: { label: 'Принят', color: Colors.statusCreated },
    in_transit: { label: 'В пути', color: Colors.statusInTransit },
    ready_for_pickup: { label: 'Готов к выдаче', color: Colors.statusAtWarehouse },
    out_for_delivery: { label: 'На доставке', color: Colors.statusOutForDelivery },
    delivered: { label: 'Выдан', color: Colors.statusDelivered },
  };

  useEffect(() => {
    const raw = params?.search;
    const initial = Array.isArray(raw) ? raw[0] : raw;
    if (typeof initial === 'string') {
      setSearchQuery(initial);
      setSearchExpanded(true);
    }
  }, [params]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatETA = (eta: string) => {
    const date = new Date(eta);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `Сегодня, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Завтра, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (selectedCompanyId && order.companyId !== selectedCompanyId) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const from = order.route?.from?.city?.toLowerCase() ?? '';
        const to = order.route?.to?.city?.toLowerCase() ?? '';
        if (!order.id.toLowerCase().includes(q) && !from.includes(q) && !to.includes(q)) {
          return false;
        }
      }
      if (activeTab === 'active') {
        if (!['created', 'accepted', 'in_transit', 'ready_for_pickup', 'out_for_delivery'].includes(order.status)) {
          return false;
        }
      } else if (activeTab === 'archive') {
        if (!['delivered'].includes(order.status)) {
          return false;
        }
      } else if (activeTab === 'action') {
        if (!order.hasClaim) {
          return false;
        }
      }

      if (statusFilterOrders !== 'all' && order.status !== statusFilterOrders) {
        return false;
      }

      if (dateFilter !== 'all' && order.eta) {
        const etaDate = new Date(order.eta);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        if (dateFilter === 'today') {
          const etaDay = new Date(etaDate.getFullYear(), etaDate.getMonth(), etaDate.getDate());
          if (etaDay.getTime() !== today.getTime()) return false;
        } else if (dateFilter === 'week') {
          const weekAhead = new Date(today);
          weekAhead.setDate(weekAhead.getDate() + 7);
          if (etaDate > weekAhead || etaDate < today) return false;
        } else if (dateFilter === 'month') {
          const monthAhead = new Date(today);
          monthAhead.setMonth(monthAhead.getMonth() + 1);
          if (etaDate > monthAhead || etaDate < today) return false;
        }
      }

      return true;
    });
  }, [orders, selectedCompanyId, searchQuery, activeTab, statusFilterOrders, dateFilter]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    const q = text.trim().toLowerCase();
    if (!q) return;
    const ordersMatch = orders.some(o => {
      const from = o.route?.from?.city?.toLowerCase() ?? '';
      const to = o.route?.to?.city?.toLowerCase() ?? '';
      return o.id.toLowerCase().includes(q) || from.includes(q) || to.includes(q);
    });
    const docsMatch = documents.some(d => d.title.toLowerCase().includes(q));
    if (!ordersMatch && docsMatch) {
      router.push({ pathname: '/(tabs)/documents', params: { search: text } });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>

      <View style={[styles.header, { paddingTop: insets.top + 20, backgroundColor: Colors.surface1 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            testID="orders-company-badge"
            onLongPress={() => setShowCompanySelector(true)}
            activeOpacity={0.8}
            style={[styles.companyBadge, { backgroundColor: Colors.surface2 }]}
          >
            <Building2 size={18} color={Colors.primary} />
            <Text style={[styles.companyBadgeText, { color: Colors.text }]} numberOfLines={1}>
              {companies.find(c => c.id === selectedCompanyId)?.name ?? 'Выберите компанию'}
            </Text>
          </TouchableOpacity>

          {searchExpanded ? (
            <View style={[styles.searchField, { backgroundColor: Colors.surface2, flex: 1 }]}
            >
              <Search size={18} color={Colors.textSecondary} />
              <TextInput
                testID="orders-search"
                style={[styles.searchInput, { color: Colors.text }]}
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholder="Поиск"
                placeholderTextColor={Colors.textSecondary}
                autoCorrect={false}
                autoCapitalize="none"
                autoFocus
                onBlur={() => setSearchExpanded(false)}
              />
            </View>
          ) : (
            <TouchableOpacity
              testID="orders-search-button"
              accessibilityLabel="Поиск"
              onPress={() => setSearchExpanded(true)}
              style={styles.headerIconButton}
            >
              <Search size={22} color={Colors.text} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filtersRow}>
          <View style={styles.filterGroup}>
            <Text style={[styles.filterLabel, { color: Colors.textSecondary }]}>Дата</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsScroll}>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: dateFilter === 'all' ? Colors.primary : Colors.surface2, borderColor: Colors.border }]}
                onPress={() => setDateFilter('all')}
              >
                <Text style={[styles.filterChipText, { color: dateFilter === 'all' ? Colors.white : Colors.text }]}>Все</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: dateFilter === 'today' ? Colors.primary : Colors.surface2, borderColor: Colors.border }]}
                onPress={() => setDateFilter('today')}
              >
                <Text style={[styles.filterChipText, { color: dateFilter === 'today' ? Colors.white : Colors.text }]}>Сегодня</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: dateFilter === 'week' ? Colors.primary : Colors.surface2, borderColor: Colors.border }]}
                onPress={() => setDateFilter('week')}
              >
                <Text style={[styles.filterChipText, { color: dateFilter === 'week' ? Colors.white : Colors.text }]}>Неделя</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: dateFilter === 'month' ? Colors.primary : Colors.surface2, borderColor: Colors.border }]}
                onPress={() => setDateFilter('month')}
              >
                <Text style={[styles.filterChipText, { color: dateFilter === 'month' ? Colors.white : Colors.text }]}>Месяц</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: dateFilter === 'custom' ? Colors.primary : Colors.surface2, borderColor: Colors.border }]}
                onPress={() => setCustomDateVisible(true)}
              >
                <Text style={[styles.filterChipText, { color: dateFilter === 'custom' ? Colors.white : Colors.text }]}>Произвольная дата</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <View style={styles.filterGroup}>
            <Text style={[styles.filterLabel, { color: Colors.textSecondary }]}>Статус</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsScroll}>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: statusFilterOrders === 'all' ? Colors.primary : Colors.surface2, borderColor: Colors.border }]}
                onPress={() => setStatusFilterOrders('all')}
              >
                <Text style={[styles.filterChipText, { color: statusFilterOrders === 'all' ? Colors.white : Colors.text }]}>Все</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: statusFilterOrders === 'created' ? Colors.primary : Colors.surface2, borderColor: Colors.border }]}
                onPress={() => setStatusFilterOrders('created')}
              >
                <Text style={[styles.filterChipText, { color: statusFilterOrders === 'created' ? Colors.white : Colors.text }]}>Создана</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: statusFilterOrders === 'accepted' ? Colors.primary : Colors.surface2, borderColor: Colors.border }]}
                onPress={() => setStatusFilterOrders('accepted')}
              >
                <Text style={[styles.filterChipText, { color: statusFilterOrders === 'accepted' ? Colors.white : Colors.text }]}>Принят</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: statusFilterOrders === 'in_transit' ? Colors.primary : Colors.surface2, borderColor: Colors.border }]}
                onPress={() => setStatusFilterOrders('in_transit')}
              >
                <Text style={[styles.filterChipText, { color: statusFilterOrders === 'in_transit' ? Colors.white : Colors.text }]}>В пути</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: statusFilterOrders === 'ready_for_pickup' ? Colors.primary : Colors.surface2, borderColor: Colors.border }]}
                onPress={() => setStatusFilterOrders('ready_for_pickup')}
              >
                <Text style={[styles.filterChipText, { color: statusFilterOrders === 'ready_for_pickup' ? Colors.white : Colors.text }]}>Готов к выдаче</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: statusFilterOrders === 'out_for_delivery' ? Colors.primary : Colors.surface2, borderColor: Colors.border }]}
                onPress={() => setStatusFilterOrders('out_for_delivery')}
              >
                <Text style={[styles.filterChipText, { color: statusFilterOrders === 'out_for_delivery' ? Colors.white : Colors.text }]}>На доставке</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: statusFilterOrders === 'delivered' ? Colors.primary : Colors.surface2, borderColor: Colors.border }]}
                onPress={() => setStatusFilterOrders('delivered')}
              >
                <Text style={[styles.filterChipText, { color: statusFilterOrders === 'delivered' ? Colors.white : Colors.text }]}>Выдан</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryAction, { backgroundColor: Colors.primary }]}
        onPress={() => router.push('/order/new')}
      >
        <Plus size={24} color={Colors.white} strokeWidth={2.5} />
        <Text style={[styles.primaryActionText, { color: Colors.white }]}>Новая перевозка</Text>
      </TouchableOpacity>

      <View style={[styles.tabs, { backgroundColor: Colors.surface1, borderBottomColor: Colors.surface2 }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && { borderBottomColor: Colors.primary }]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, { color: Colors.textSecondary }, activeTab === 'active' && { color: Colors.primary }]}>
            Активные
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'archive' && { borderBottomColor: Colors.primary }]}
          onPress={() => setActiveTab('archive')}
        >
          <Text style={[styles.tabText, { color: Colors.textSecondary }, activeTab === 'archive' && { color: Colors.primary }]}>
            Архив
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'action' && { borderBottomColor: Colors.primary }]}
          onPress={() => setActiveTab('action')}
        >
          <Text style={[styles.tabText, { color: Colors.textSecondary }, activeTab === 'action' && { color: Colors.primary }]}>
            Требуют действий
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={64} color={Colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: Colors.text }]}>Нет грузов</Text>
            <Text style={[styles.emptySubtext, { color: Colors.textSecondary }]}>
              {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Здесь будут отображаться ваши грузы'}
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const status = statusConfig[order.status];
            return (
              <TouchableOpacity
                key={order.id}
                style={[styles.orderCard, { backgroundColor: Colors.surface1 }]}
                onPress={() => router.push(`/order/${order.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.orderHeader}>
                  <View style={styles.orderIdContainer}>
                    <Text style={[styles.orderId, { color: Colors.text }]}>{order.id}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
                      <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                      <Text style={[styles.statusText, { color: status.color }]}>
                        {status.label}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.orderActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: Colors.surface2 }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push({
                          pathname: '/order/new',
                          params: {
                            duplicate: 'true',
                            orderId: order.id,
                          },
                        });
                      }}
                    >
                      <Copy size={18} color={Colors.primary} />
                    </TouchableOpacity>
                    <ChevronRight size={20} color={Colors.textSecondary} />
                  </View>
                </View>

                <View style={styles.routeContainer}>
                  <View style={styles.routePoint}>
                    <View style={[styles.routeDotFrom, { backgroundColor: Colors.primary }]} />
                    <View>
                      <Text style={[styles.routeLabel, { color: Colors.textSecondary }]}>Откуда</Text>
                      <Text style={[styles.routeCity, { color: Colors.text }]}>{order.route.from.city}</Text>
                    </View>
                  </View>

                  <View style={[styles.routeLine, { backgroundColor: Colors.surface2 }]} />

                  <View style={styles.routePoint}>
                    <View style={[styles.routeDotTo, { backgroundColor: Colors.success }]} />
                    <View>
                      <Text style={[styles.routeLabel, { color: Colors.textSecondary }]}>Куда</Text>
                      <Text style={[styles.routeCity, { color: Colors.text }]}>{order.route.to.city}</Text>
                    </View>
                  </View>
                </View>

                {(order.plannedDeliveryDate || order.arrivalDate) && (
                  <View style={[styles.etaContainer, { borderTopColor: Colors.surface2 }]}>
                    <Clock size={16} color={Colors.textSecondary} />
                    <View style={{ gap: 4 }}>
                      {order.plannedDeliveryDate && (
                        <Text style={[styles.etaText, { color: Colors.textSecondary }]}>Плановая доставка: {formatETA(order.plannedDeliveryDate)}</Text>
                      )}
                      {order.arrivalDate && (
                        <Text style={[styles.etaText, { color: Colors.textSecondary }]}>Дата прибытия: {formatETA(order.arrivalDate)}</Text>
                      )}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={showCompanySelector}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompanySelector(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowCompanySelector(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: Colors.surface1 }]}>
            <Text style={[styles.modalTitle, { color: Colors.text }]}>Выберите компанию</Text>
            <View style={styles.companiesList}>
              {companies.map((company) => (
                <TouchableOpacity
                  key={company.id}
                  style={[
                    styles.companyOption,
                    { borderBottomColor: Colors.surface2 },
                    selectedCompanyId === company.id && { backgroundColor: `${Colors.primary}15` },
                  ]}
                  onPress={() => {
                    selectCompany(company.id);
                    setShowCompanySelector(false);
                  }}
                >
                  <View style={[styles.companyIconSmall, { backgroundColor: Colors.surface2 }]}>
                    <Building2 size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.companyOptionInfo}>
                    <Text style={[styles.companyOptionName, { color: Colors.text }]}>{company.name}</Text>
                    <Text style={[styles.companyOptionInn, { color: Colors.textSecondary }]}>ИНН: {company.inn}</Text>
                  </View>
                  {selectedCompanyId === company.id && (
                    <Check size={20} color={Colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={customDateVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCustomDateVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCustomDateVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: Colors.surface1 }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalTitle, { color: Colors.text }]}>Произвольная дата</Text>
            <View style={{ gap: 8, marginBottom: 16 }}>
              <Text style={{ color: Colors.textSecondary }}>Введите дату или период</Text>
              <View style={[styles.searchField, { backgroundColor: Colors.surface2 }]}> 
                <TextInput
                  value={customDateInput}
                  onChangeText={setCustomDateInput}
                  placeholder="Например: 01.10.2025 или 01.10.2025–10.10.2025"
                  placeholderTextColor={Colors.textSecondary}
                  style={[styles.searchInput, { color: Colors.text }]}
                />
              </View>
            </View>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: Colors.primary, marginBottom: 8 }]}
              onPress={() => {
                setDateFilter('custom');
                setCustomDateVisible(false);
              }}
            >
              <Text style={[styles.cancelButtonText, { color: Colors.white }]}>Применить</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cancelButton, { backgroundColor: Colors.surface2 }]} onPress={() => setCustomDateVisible(false)}>
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 8,
    marginBottom: 12,
  },
  companyBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    maxWidth: '75%',
  },
  companyBadgeText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 15,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 12,
  },
  tabs: {
    flexDirection: 'row' as const,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: 1,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 20,
    textAlign: 'center' as const,
  },
  companiesList: {
    gap: 0,
  },
  companyOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  companyIconSmall: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  companyOptionInfo: {
    flex: 1,
  },
  companyOptionName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  companyOptionInn: {
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 15,
    textAlign: 'center' as const,
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  orderCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 16,
  },
  orderIdContainer: {
    flex: 1,
    gap: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  statusBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  routeContainer: {
    marginBottom: 12,
  },
  routePoint: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
  },
  routeDotFrom: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  routeDotTo: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginTop: 4,
  },
  routeLine: {
    width: 2,
    height: 16,
    marginLeft: 4,
    marginVertical: 4,
  },
  routeLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  routeCity: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  etaContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  etaText: {
    fontSize: 13,
  },
  filtersRow: {
    gap: 16,
    marginTop: 12,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    paddingHorizontal: 4,
  },
  filterChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  filterChipsScroll: {
    gap: 8,
    paddingRight: 16,
  },
  filterDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 4,
  },
  primaryAction: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  primaryActionText: {
    fontSize: 17,
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
  orderActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});
