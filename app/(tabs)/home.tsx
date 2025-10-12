import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Pressable, TextInput, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  Building2,
  Check,
  Share2,
  MessageCircle,
  ArrowRight,
  Package,
  TrendingUp,
  TrendingDown,
  Weight,
  Boxes,
  FileText,
  Bell,
  MapPin,
  Calendar,
  Truck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  LineChart,
} from 'lucide-react-native';

import { useCompanies } from '@/contexts/CompanyContext';
import { useAchievements } from '@/contexts/AchievementsContext';
import { useThemeColors } from '@/constants/colors';
import { useDashboardSettings } from '@/contexts/DashboardSettingsContext';


type FilterStatus = 'all' | 'accepted' | 'in_transit' | 'ready_for_pickup' | 'out_for_delivery' | 'delivered';

type CashflowItem = { day: string; date: string; income: number; expense: number };

type CostFilterType = 'transport' | 'nomenclature' | 'sender' | 'receiver';

type FilterOption = { label: string; value: string };

const filterOptions: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'accepted', label: 'Принят' },
  { value: 'in_transit', label: 'В пути' },
  { value: 'ready_for_pickup', label: 'Готов к выдаче' },
  { value: 'out_for_delivery', label: 'На доставке' },
  { value: 'delivered', label: 'Выдан' },
];

export default function DashboardScreen() {
  const router = useRouter();

  const { companies, selectedCompanyId, selectCompany, orders, documents } = useCompanies();
  const { completedCount, totalCount, progress } = useAchievements();
  const insets = useSafeAreaInsets();
  const Colors = useThemeColors();
  const { enabled: dashboardEnabled, isHydrated } = useDashboardSettings();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);

  const [showCompanySelector, setShowCompanySelector] = useState<boolean>(false);
  const [showPeriodSelector, setShowPeriodSelector] = useState<boolean>(false);
  const [showCostBreakdown, setShowCostBreakdown] = useState<boolean>(false);
  const [costFilterType, setCostFilterType] = useState<CostFilterType>('transport');
  const [costFilterValue, setCostFilterValue] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [endDate, setEndDate] = useState<Date>(() => new Date());
  const [tempStartDate, setTempStartDate] = useState<Date>(() => startDate);
  const [tempEndDate, setTempEndDate] = useState<Date>(() => endDate);
  const [showCustomPeriod, setShowCustomPeriod] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [activeMetric, setActiveMetric] = useState<'shipments' | 'weight' | 'volume' | 'invoices' | null>(null);
  const [damageView, setDamageView] = useState<'main' | 'count-detail' | 'amount-detail'>('main');
  const [showDamageDetails, setShowDamageDetails] = useState<boolean>(false);
  const [damageFilter, setDamageFilter] = useState<'active' | 'approved' | 'rejected' | 'all'>('active');
  const [cashflowWeekOffset, setCashflowWeekOffset] = useState<number>(0);
  const [deliveryWeekOffset, setDeliveryWeekOffset] = useState<number>(0);
  const [edoListVisible, setEdoListVisible] = useState<boolean>(false);
  const [selectedEdoType, setSelectedEdoType] = useState<'ER' | 'UPD' | 'APP' | 'RECON' | null>(null);

  const statusConfig = {
    accepted: { label: 'Принят', color: Colors.statusCreated },
    in_transit: { label: 'В пути', color: Colors.statusInTransit },
    ready_for_pickup: { label: 'Готов к выдаче', color: Colors.statusAtWarehouse },
    out_for_delivery: { label: 'На доставке', color: Colors.statusOutForDelivery },
    delivered: { label: 'Выдан', color: Colors.statusDelivered },
  } as const;

  const onRefresh = () => {
    console.log('[Home] onRefresh');
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) {
      return { orders: [], documents: [], upd: [] };
    }

    const q = searchQuery.toLowerCase();
    const matchedOrders = orders.filter((order) => {
      if (selectedCompanyId && order.companyId !== selectedCompanyId) return false;
      const orderId = order.id.toLowerCase();
      const cargoDesc = order.cargo?.description?.toLowerCase() ?? '';
      return orderId.includes(q) || cargoDesc.includes(q);
    });

    const matchedDocuments = documents.filter((doc) => {
      if (selectedCompanyId && doc.companyId !== selectedCompanyId) return false;
      const docTitle = doc.title.toLowerCase();
      const docId = doc.id.toLowerCase();
      return (docTitle.includes(q) || docId.includes(q)) && doc.type === 'invoice';
    });

    const matchedUpd = documents.filter((doc) => {
      if (selectedCompanyId && doc.companyId !== selectedCompanyId) return false;
      const docTitle = doc.title.toLowerCase();
      const docId = doc.id.toLowerCase();
      return (docTitle.includes(q) || docId.includes(q)) && (doc.type === 'act' || doc.type === 'waybill');
    });

    return { orders: matchedOrders, documents: matchedDocuments, upd: matchedUpd };
  }, [searchQuery, orders, documents, selectedCompanyId]);

  const filteredOrders = useMemo(() => {
    console.log('=== Filtering orders ===');
    console.log('Total orders:', orders.length);
    console.log('Selected company ID:', selectedCompanyId);
    console.log('Selected filter:', selectedFilter);
    console.log('Search:', searchQuery);

    const filtered = orders.filter((order) => {
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
      if (selectedFilter === 'all') return true;
      return order.status === selectedFilter;
    });

    console.log('Filtered orders:', filtered.length);
    return filtered;
  }, [orders, selectedCompanyId, selectedFilter, searchQuery]);

  const selectedCompany = useMemo(() => {
    return companies.find((c) => c.id === selectedCompanyId);
  }, [companies, selectedCompanyId]);

  // Apply date range
  const filteredByDate = useMemo(() => {
    return filteredOrders.filter((o) => {
      const created = new Date(o.createdAt);
      return created >= startDate && created <= endDate;
    });
  }, [filteredOrders, startDate, endDate]);

  const totalOrders = filteredByDate.length;
  const totalWeightKg = filteredByDate.reduce((sum, o) => sum + (o.cargo?.weightKg ?? 0), 0);
  const totalVolumeM3 = filteredByDate.reduce((sum, o) => sum + (o.cargo?.volumeM3 ?? 0), 0);

  const weightStats = useMemo(() => {
    const weights = filteredByDate.map(o => o.cargo?.weightKg ?? 0).filter(w => w > 0);
    const chargeableWeights = filteredByDate.map(o => o.cargo?.chargeableWeight ?? o.cargo?.weightKg ?? 0).filter(w => w > 0);
    if (weights.length === 0) return { min: 0, max: 0, avg: 0, avgChargeable: 0 };
    const totalWeight = weights.reduce((s, w) => s + w, 0);
    const totalChargeable = chargeableWeights.reduce((s, w) => s + w, 0);
    return {
      min: Math.min(...weights),
      max: Math.max(...weights),
      avg: totalWeight / weights.length,
      avgChargeable: totalChargeable / chargeableWeights.length,
    };
  }, [filteredByDate]);

  const volumeStats = useMemo(() => {
    const volumes = filteredByDate.map(o => o.cargo?.volumeM3 ?? 0).filter(v => v > 0);
    if (volumes.length === 0) return { min: 0, max: 0, avg: 0, density: 0 };
    const totalW = filteredByDate.filter(o => (o.cargo?.volumeM3 ?? 0) > 0).reduce((s, o) => s + (o.cargo?.weightKg ?? 0), 0);
    const totalV = volumes.reduce((s, v) => s + v, 0);
    return {
      min: Math.min(...volumes),
      max: Math.max(...volumes),
      avg: totalV / volumes.length,
      density: totalV > 0 ? totalW / totalV : 0,
    };
  }, [filteredByDate]);

  const totalAmount = useMemo(() => {
    return filteredByDate.reduce((sum, o) => sum + (o.price?.amount ?? 0), 0);
  }, [filteredByDate]);

  type CostItem = { category: string; amount: number; color: string };

  const costValueOptions: FilterOption[] = useMemo(() => {
    const opts: FilterOption[] = [{ label: 'Все', value: 'all' }];
    const set = new Set<string>();
    filteredByDate.forEach((o) => {
      if (costFilterType === 'transport') {
        const t = o.customer.transportationType ?? o.sender.transportationType ?? o.receiver.transportationType;
        const key = t ?? '';
        if (key) set.add(key);
      } else if (costFilterType === 'nomenclature') {
        const key = o.cargo?.type ?? 'other';
        if (key) set.add(key);
      } else if (costFilterType === 'sender') {
        const key = o.sender?.name ?? '';
        if (key) set.add(key);
      } else if (costFilterType === 'receiver') {
        const key = o.receiver?.name ?? '';
        if (key) set.add(key);
      }
    });
    Array.from(set.values()).forEach((value) => {
      if (costFilterType === 'transport') {
        const label = value === 'ferry' ? 'Паром' : 'Авто';
        opts.push({ label, value });
      } else if (costFilterType === 'nomenclature') {
        const map: Record<string, string> = {
          pallet: 'Паллеты',
          box: 'Коробки',
          envelope: 'Конверты',
          other: 'Другое',
        };
        const label = map[value] ?? value;
        opts.push({ label, value });
      } else {
        opts.push({ label: value, value });
      }
    });
    return opts;
  }, [filteredByDate, costFilterType]);

  const filteredForCosts = useMemo(() => {
    if (costFilterValue === 'all') return filteredByDate;
    return filteredByDate.filter((o) => {
      if (costFilterType === 'transport') {
        const t = o.customer.transportationType ?? o.sender.transportationType ?? o.receiver.transportationType;
        return t === costFilterValue;
      }
      if (costFilterType === 'nomenclature') {
        return (o.cargo?.type ?? 'other') === costFilterValue;
      }
      if (costFilterType === 'sender') {
        return o.sender?.name === costFilterValue;
      }
      if (costFilterType === 'receiver') {
        return o.receiver?.name === costFilterValue;
      }
      return true;
    });
  }, [filteredByDate, costFilterType, costFilterValue]);

  const costBreakdown: CostItem[] = useMemo(() => {
    const map = new Map<string, number>();
    
    if (costFilterType === 'transport') {
      filteredForCosts.forEach((o) => {
        const t = o.customer.transportationType ?? o.sender.transportationType ?? o.receiver.transportationType;
        const key = t === 'ferry' ? 'Паром' : 'Авто';
        const amount = o.price?.amount ?? 0;
        map.set(key, (map.get(key) ?? 0) + amount);
      });
    } else if (costFilterType === 'sender') {
      filteredForCosts.forEach((o) => {
        const key = o.sender?.name ?? 'Неизвестно';
        const amount = o.price?.amount ?? 0;
        map.set(key, (map.get(key) ?? 0) + amount);
      });
    } else if (costFilterType === 'receiver') {
      filteredForCosts.forEach((o) => {
        const key = o.receiver?.name ?? 'Неизвестно';
        const amount = o.price?.amount ?? 0;
        map.set(key, (map.get(key) ?? 0) + amount);
      });
    }
    
    const palette = ['#00D4FF', '#FFD700', '#A78BFA', '#FF6B9D', '#00E5A0', '#4DD4AC'];
    let i = 0;
    const out: CostItem[] = Array.from(map.entries()).map(([category, amount]) => ({ category, amount, color: palette[i++ % palette.length] }));
    return out.sort((a, b) => b.amount - a.amount);
  }, [filteredForCosts, costFilterType]);

  const filteredDocuments = useMemo(() => {
    return documents.filter(d => {
      if (selectedCompanyId && d.companyId !== selectedCompanyId) return false;
      return true;
    });
  }, [documents, selectedCompanyId]);

  type EdoType = 'ER' | 'UPD' | 'APP' | 'RECON';

  const hashString = (s: string): number => {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h << 5) - h + s.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  };

  const getEdoType = (doc: typeof documents[number]): EdoType => {
    if (doc.type === 'invoice') return 'UPD';
    if (doc.type === 'act') return 'APP';
    if ((doc as any).type === 'reconciliation') return 'RECON';
    return 'ER';
  };

  const isEdoSigned = (doc: typeof documents[number]): boolean => {
    if (doc.type === 'invoice') {
      return doc.status === 'paid';
    }
    return hashString(doc.id) % 3 !== 0;
  };

  const edoStats = useMemo(() => {
    const base = {
      ER: { total: 0, signed: 0, unsigned: 0 },
      UPD: { total: 0, signed: 0, unsigned: 0 },
      APP: { total: 0, signed: 0, unsigned: 0 },
      RECON: { total: 0, signed: 0, unsigned: 0 },
    } as Record<EdoType, { total: number; signed: number; unsigned: number }>;

    filteredDocuments.forEach((doc) => {
      const t = getEdoType(doc);
      base[t].total += 1;
      if (isEdoSigned(doc)) base[t].signed += 1; else base[t].unsigned += 1;
    });

    const totals = Object.values(base).reduce(
      (acc, v) => {
        acc.total += v.total;
        acc.signed += v.signed;
        acc.unsigned += v.unsigned;
        return acc;
      },
      { total: 0, signed: 0, unsigned: 0 },
    );

    return { byType: base, totals };
  }, [filteredDocuments]);

  const invoiceStats = useMemo(() => {
    const invoices = filteredDocuments.filter(d => d.type === 'invoice' && d.amount);
    if (invoices.length === 0) return { total: 0, avgAmount: 0, paid: 0, unpaid: 0, overdue: 0 };
    const totalAmount = invoices.reduce((s, inv) => s + (inv.amount ?? 0), 0);
    return {
      total: invoices.length,
      avgAmount: totalAmount / invoices.length,
      paid: invoices.filter(inv => inv.status === 'paid').length,
      unpaid: invoices.filter(inv => inv.status === 'unpaid').length,
      overdue: invoices.filter(inv => inv.status === 'overdue').length,
    };
  }, [filteredDocuments]);

  const smartNotifications = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const daysUntilFriday = currentDay <= 5 ? 5 - currentDay : 7 - currentDay + 5;
    const endOfFriday = new Date(now);
    endOfFriday.setDate(now.getDate() + daysUntilFriday);
    endOfFriday.setHours(23, 59, 59, 999);

    const invoicesDueByFriday = filteredDocuments.filter(d => {
      if (d.type !== 'invoice' || d.status === 'paid') return false;
      if (!d.plannedPaymentDate) return false;
      const dueDate = new Date(d.plannedPaymentDate);
      return dueDate <= endOfFriday;
    });

    const delayedOrders = filteredByDate.filter(o => {
      if (o.status === 'delivered') return false;
      if (!o.plannedDeliveryDate) return false;
      const plannedDate = new Date(o.plannedDeliveryDate);
      const hoursSincePlanned = (now.getTime() - plannedDate.getTime()) / (1000 * 60 * 60);
      return hoursSincePlanned > 24;
    });

    const edoUnsigned = filteredDocuments.filter(d => !isEdoSigned(d)).length;

    return {
      invoicesDueByFriday: invoicesDueByFriday.length,
      delayedOrders: delayedOrders.length,
      edoUnsigned,
    };
  }, [filteredDocuments, filteredByDate]);

  const slaData = useMemo(() => {
    const routes = new Map<string, { min: number; max: number; count: number; onTime: number }>();
    const routesPrevWeek = new Map<string, { min: number; max: number; count: number; onTime: number }>();
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    filteredByDate.forEach(order => {
      const direction = order.route.to.city;
      if (!direction) return;
      
      if (order.status === 'ready_for_pickup' || order.status === 'delivered') {
        const created = new Date(order.timeline?.created || order.createdAt);
        const readyOrDelivered = new Date(order.timeline?.ready_for_pickup || order.timeline?.delivered || order.createdAt);
        const hoursToReady = (readyOrDelivered.getTime() - created.getTime()) / (1000 * 60 * 60);
        
        const isLastWeek = readyOrDelivered < weekAgo;
        const targetMap = isLastWeek ? routesPrevWeek : routes;
        
        if (!targetMap.has(direction)) {
          targetMap.set(direction, { min: hoursToReady, max: hoursToReady, count: 0, onTime: 0 });
        }
        
        const data = targetMap.get(direction)!;
        data.min = Math.min(data.min, hoursToReady);
        data.max = Math.max(data.max, hoursToReady);
        data.count++;
        
        if (order.plannedDeliveryDate) {
          const planned = new Date(order.plannedDeliveryDate);
          if (readyOrDelivered <= planned) {
            data.onTime++;
          }
        }
      }
    });
    
    return Array.from(routes.entries()).map(([city, data]) => {
      const prevData = routesPrevWeek.get(city);
      const currentPercent = data.count > 0 ? Math.round((data.onTime / data.count) * 100) : 0;
      const prevPercent = prevData && prevData.count > 0 ? Math.round((prevData.onTime / prevData.count) * 100) : 0;
      const change = prevPercent > 0 ? currentPercent - prevPercent : 0;
      
      return {
        city,
        minHours: Math.round(data.min),
        maxHours: Math.round(data.max),
        onTimePercent: currentPercent,
        weeklyChange: change,
      };
    });
  }, [filteredByDate]);

  const cashflowWithTrend = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset + (cashflowWeekOffset * 7));
    monday.setHours(0, 0, 0, 0);

    const weekDays: CashflowItem[] = [];
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];

    for (let i = 0; i < 5; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      let income = 0;
      let expense = 0;

      filteredDocuments.forEach(doc => {
        if (doc.type === 'invoice' && doc.plannedPaymentDate) {
          const paymentDate = new Date(doc.plannedPaymentDate);
          if (paymentDate >= day && paymentDate <= dayEnd) {
            const amount = doc.amount || 0;
            if (doc.documentType === 'incoming') {
              income += amount;
            } else if (doc.documentType === 'outgoing') {
              expense += amount;
            }
          }
        }
      });

      weekDays.push({
        day: dayNames[i],
        date: day.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        income,
        expense,
      });
    }

    const prevWeekMonday = new Date(monday);
    prevWeekMonday.setDate(monday.getDate() - 7);
    
    let prevWeekExpense = 0;
    for (let i = 0; i < 5; i++) {
      const day = new Date(prevWeekMonday);
      day.setDate(prevWeekMonday.getDate() + i);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      
      filteredDocuments.forEach(doc => {
        if (doc.type === 'invoice' && doc.plannedPaymentDate) {
          const paymentDate = new Date(doc.plannedPaymentDate);
          if (paymentDate >= day && paymentDate <= dayEnd) {
            const amount = doc.amount || 0;
            if (doc.documentType === 'outgoing') {
              prevWeekExpense += amount;
            }
          }
        }
      });
    }
    
    const currentWeekExpense = weekDays.reduce((s, i) => s + i.expense, 0);
    const expenseChange = prevWeekExpense > 0 ? Math.round(((currentWeekExpense - prevWeekExpense) / prevWeekExpense) * 100) : 0;
    
    return { weekDays, expenseChange };
  }, [filteredDocuments, cashflowWeekOffset]);
  
  const cashflow = cashflowWithTrend.weekDays;

  const damageStatsWithTrend = useMemo(() => {
    const ordersWithClaims = filteredByDate.filter(o => o.hasClaim && o.claim);
    const activeCases = ordersWithClaims.filter(o => o.claim?.status === 'pending' || o.claim?.status === 'approved').length;
    const totalAmount = ordersWithClaims.reduce((sum, o) => sum + (o.claim?.amount ?? 0), 0);
    const approvedCount = ordersWithClaims.filter(o => o.claim?.status === 'approved').length;
    const rejectedCount = ordersWithClaims.filter(o => o.claim?.status === 'rejected').length;
    const approvedAmount = ordersWithClaims.filter(o => o.claim?.status === 'approved').reduce((sum, o) => sum + (o.claim?.amount ?? 0), 0);
    const rejectedAmount = ordersWithClaims.filter(o => o.claim?.status === 'rejected').reduce((sum, o) => sum + (o.claim?.amount ?? 0), 0);
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const prevWeekOrders = filteredByDate.filter(o => {
      const created = new Date(o.createdAt);
      return created >= twoWeeksAgo && created < weekAgo;
    });
    
    const prevWeekOrdersWithClaims = prevWeekOrders.filter(o => o.hasClaim && o.claim);
    const prevActiveCases = prevWeekOrdersWithClaims.filter(o => o.claim?.status === 'pending' || o.claim?.status === 'approved').length;
    const prevTotalAmount = prevWeekOrdersWithClaims.reduce((sum, o) => sum + (o.claim?.amount ?? 0), 0);
    
    const casesChange = prevActiveCases > 0 ? Math.round(((activeCases - prevActiveCases) / prevActiveCases) * 100) : 0;
    const amountChange = prevTotalAmount > 0 ? Math.round(((totalAmount - prevTotalAmount) / prevTotalAmount) * 100) : 0;
    
    return {
      activeCases,
      totalAmount,
      approvedCount,
      rejectedCount,
      approvedAmount,
      rejectedAmount,
      casesChange,
      amountChange,
    };
  }, [filteredByDate]);
  
  const damageStats = damageStatsWithTrend;

  const deliveryForecastWithTrend = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset + (deliveryWeekOffset * 7));
    monday.setHours(0, 0, 0, 0);

    const weekDays: { day: string; date: string; dayNum: number; month: string; auto: number; ferry: number }[] = [];
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      let autoCount = 0;
      let ferryCount = 0;

      filteredByDate.forEach(order => {
        if (order.plannedDeliveryDate) {
          const plannedDate = new Date(order.plannedDeliveryDate);
          if (plannedDate >= day && plannedDate <= dayEnd) {
            const transportType = order.customer.transportationType ?? order.sender.transportationType ?? order.receiver.transportationType;
            if (transportType === 'ferry') {
              ferryCount++;
            } else {
              autoCount++;
            }
          }
        }
      });

      weekDays.push({
        day: dayNames[i],
        date: day.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        dayNum: day.getDate(),
        month: day.toLocaleDateString('ru-RU', { month: 'short' }).toUpperCase(),
        auto: autoCount,
        ferry: ferryCount,
      });
    }

    const totalAuto = weekDays.reduce((s, d) => s + d.auto, 0);
    const totalFerry = weekDays.reduce((s, d) => s + d.ferry, 0);
    
    const prevWeekMonday = new Date(monday);
    prevWeekMonday.setDate(monday.getDate() - 7);
    
    let prevTotalAuto = 0;
    let prevTotalFerry = 0;
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(prevWeekMonday);
      day.setDate(prevWeekMonday.getDate() + i);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      
      filteredByDate.forEach(order => {
        if (order.plannedDeliveryDate) {
          const plannedDate = new Date(order.plannedDeliveryDate);
          if (plannedDate >= day && plannedDate <= dayEnd) {
            const transportType = order.customer.transportationType ?? order.sender.transportationType ?? order.receiver.transportationType;
            if (transportType === 'ferry') {
              prevTotalFerry++;
            } else {
              prevTotalAuto++;
            }
          }
        }
      });
    }
    
    const totalDeliveries = totalAuto + totalFerry;
    const prevTotalDeliveries = prevTotalAuto + prevTotalFerry;
    const deliveryChange = prevTotalDeliveries > 0 ? Math.round(((totalDeliveries - prevTotalDeliveries) / prevTotalDeliveries) * 100) : 0;

    return { weekDays, totalAuto, totalFerry, deliveryChange };
  }, [filteredByDate, deliveryWeekOffset]);
  
  const deliveryForecast = { weekDays: deliveryForecastWithTrend.weekDays, totalAuto: deliveryForecastWithTrend.totalAuto, totalFerry: deliveryForecastWithTrend.totalFerry };



  const tilesTrends = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfCurrentWeek = new Date(startOfToday);
    startOfCurrentWeek.setDate(startOfToday.getDate() - 6);
    const startOfPrevWeek = new Date(startOfCurrentWeek);
    startOfPrevWeek.setDate(startOfCurrentWeek.getDate() - 7);
    const endOfPrevWeek = new Date(startOfCurrentWeek);
    endOfPrevWeek.setMilliseconds(-1);

    const inRange = (d: Date, start: Date, end: Date) => d >= start && d <= end;

    const ordersForCompany = orders.filter(o => !selectedCompanyId || o.companyId === selectedCompanyId);

    const ordersCurrent = ordersForCompany.filter(o => inRange(new Date(o.createdAt), startOfCurrentWeek, now));
    const ordersPrev = ordersForCompany.filter(o => inRange(new Date(o.createdAt), startOfPrevWeek, endOfPrevWeek));

    const shipmentsCurrent = ordersCurrent.length;
    const shipmentsPrev = ordersPrev.length;
    const shipmentsChange = shipmentsPrev > 0 ? Math.round(((shipmentsCurrent - shipmentsPrev) / shipmentsPrev) * 100) : 0;

    const weightCurrent = ordersCurrent.reduce((s, o) => s + (o.cargo?.weightKg ?? 0), 0);
    const weightPrev = ordersPrev.reduce((s, o) => s + (o.cargo?.weightKg ?? 0), 0);
    const weightChange = weightPrev > 0 ? Math.round(((weightCurrent - weightPrev) / weightPrev) * 100) : 0;

    const volumeCurrent = ordersCurrent.reduce((s, o) => s + (o.cargo?.volumeM3 ?? 0), 0);
    const volumePrev = ordersPrev.reduce((s, o) => s + (o.cargo?.volumeM3 ?? 0), 0);
    const volumeChange = volumePrev > 0 ? Math.round(((volumeCurrent - volumePrev) / volumePrev) * 100) : 0;

    const docsForCompany = documents.filter(d => !selectedCompanyId || d.companyId === selectedCompanyId);
    const getDocDate = (d: any) => new Date(d?.createdAt ?? d?.plannedPaymentDate ?? d?.date ?? new Date(0));
    const invoicesCurrent = docsForCompany.filter(d => d.type === 'invoice' && inRange(getDocDate(d), startOfCurrentWeek, now));
    const invoicesPrev = docsForCompany.filter(d => d.type === 'invoice' && inRange(getDocDate(d), startOfPrevWeek, endOfPrevWeek));
    const invoicesCurrentCount = invoicesCurrent.length;
    const invoicesPrevCount = invoicesPrev.length;
    const invoicesChange = invoicesPrevCount > 0 ? Math.round(((invoicesCurrentCount - invoicesPrevCount) / invoicesPrevCount) * 100) : 0;

    return { shipmentsChange, invoicesChange, weightChange, volumeChange };
  }, [orders, documents, selectedCompanyId]);

  const formatMonth = (d: Date) => d.toLocaleDateString('ru-RU', { month: 'long' });
  const formatPeriod = () => {
    const now = new Date();
    const isCurrentMonth = startDate.getFullYear() === now.getFullYear() && startDate.getMonth() === now.getMonth() && startDate.getDate() === 1;
    if (isCurrentMonth) return formatMonth(now);
    const s = startDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    const e = endDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    return `${s} - ${e}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: Colors.surface1 }]}>
        <TouchableOpacity
          testID="home-company-selector"
          onPress={() => setShowCompanySelector(true)}
          activeOpacity={0.8}
          style={[styles.companySelector, { backgroundColor: Colors.surface2 }]}
        >
          <Building2 size={18} color={Colors.primary} />
          <Text style={[styles.companySelectorText, { color: Colors.text }]} numberOfLines={1}>
            {selectedCompany?.name ?? 'Выберите компанию'}
          </Text>
          <ChevronDown size={18} color={Colors.textSecondary} />
        </TouchableOpacity>

        <View style={{ position: 'relative' as const, zIndex: 10 }}>
          <View style={[styles.searchField, { backgroundColor: Colors.surface2 }]}>
            <Search size={18} color={Colors.textSecondary} />
            <TextInput
              testID="home-search"
              style={[styles.searchInput, { color: Colors.text }]}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setShowSearchResults(text.length >= 2);
              }}
              onFocus={() => {
                if (searchQuery.length >= 2) setShowSearchResults(true);
              }}
              placeholder="Поиск по номерам и номенклатуре"
              placeholderTextColor={Colors.textSecondary}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          {showSearchResults && (searchResults.orders.length > 0 || searchResults.documents.length > 0 || searchResults.upd.length > 0) && (
            <View style={[styles.searchResultsDropdown, { backgroundColor: Colors.surface1 }]}>
              <ScrollView style={styles.searchResultsScroll} nestedScrollEnabled>
                {searchResults.orders.length > 0 && (
                  <View style={styles.searchResultsSection}>
                    <Text style={[styles.searchResultsSectionTitle, { color: Colors.textSecondary }]}>Перевозки</Text>
                    {searchResults.orders.map((order) => (
                      <TouchableOpacity
                        key={order.id}
                        style={[styles.searchResultItem, { borderBottomColor: Colors.surface2 }]}
                        onPress={() => {
                          setShowSearchResults(false);
                          setSearchQuery('');
                          router.push(`/order/${order.id}`);
                        }}
                      >
                        <View style={styles.searchResultItemContent}>
                          <Text style={[styles.searchResultItemTitle, { color: Colors.text }]}>{order.id}</Text>
                          <Text style={[styles.searchResultItemSubtitle, { color: Colors.textSecondary }]} numberOfLines={1}>
                            {order.cargo?.description ?? 'Без описания'}
                          </Text>
                        </View>
                        <ArrowRight size={18} color={Colors.textSecondary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {searchResults.documents.length > 0 && (
                  <View style={styles.searchResultsSection}>
                    <Text style={[styles.searchResultsSectionTitle, { color: Colors.textSecondary }]}>Счета</Text>
                    {searchResults.documents.map((doc) => (
                      <TouchableOpacity
                        key={doc.id}
                        style={[styles.searchResultItem, { borderBottomColor: Colors.surface2 }]}
                        onPress={() => {
                          setShowSearchResults(false);
                          setSearchQuery('');
                          if (doc.orderId) {
                            router.push(`/order/${doc.orderId}`);
                          }
                        }}
                      >
                        <View style={styles.searchResultItemContent}>
                          <Text style={[styles.searchResultItemTitle, { color: Colors.text }]}>{doc.title}</Text>
                          {doc.amount && (
                            <Text style={[styles.searchResultItemSubtitle, { color: Colors.textSecondary }]}>
                              {doc.amount.toLocaleString('ru-RU')} {doc.currency ?? 'RUB'}
                            </Text>
                          )}
                        </View>
                        <ArrowRight size={18} color={Colors.textSecondary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {searchResults.upd.length > 0 && (
                  <View style={styles.searchResultsSection}>
                    <Text style={[styles.searchResultsSectionTitle, { color: Colors.textSecondary }]}>УПД</Text>
                    {searchResults.upd.map((doc) => (
                      <TouchableOpacity
                        key={doc.id}
                        style={[styles.searchResultItem, { borderBottomColor: Colors.surface2 }]}
                        onPress={() => {
                          setShowSearchResults(false);
                          setSearchQuery('');
                          if (doc.orderId) {
                            router.push(`/order/${doc.orderId}`);
                          }
                        }}
                      >
                        <View style={styles.searchResultItemContent}>
                          <Text style={[styles.searchResultItemTitle, { color: Colors.text }]}>{doc.title}</Text>
                          {doc.amount && (
                            <Text style={[styles.searchResultItemSubtitle, { color: Colors.textSecondary }]}>
                              {doc.amount.toLocaleString('ru-RU')} {doc.currency ?? 'RUB'}
                            </Text>
                          )}
                        </View>
                        <ArrowRight size={18} color={Colors.textSecondary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.achievementsDashboard, { backgroundColor: Colors.surface2 }]}
          onPress={() => router.push('/achievements' as any)}
          activeOpacity={0.8}
        >
          <View style={styles.achievementsHeader}>
            <Text style={[styles.achievementsTitle, { color: Colors.text }]}>Мои достижения</Text>
            <Text style={[styles.achievementsCount, { color: Colors.primary }]}>{completedCount}/{totalCount}</Text>
          </View>
          <View style={[styles.achievementsProgressBar, { backgroundColor: Colors.surface1 }]}>
            <View 
              style={[
                styles.achievementsProgressFill, 
                { backgroundColor: Colors.primary, width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }
              ]} 
            />
          </View>
        </TouchableOpacity>

        <View style={styles.periodRow}>
          <TouchableOpacity style={styles.periodButton} onPress={() => { setTempStartDate(startDate); setTempEndDate(endDate); setShowPeriodSelector(true); }}>
            <Text style={[styles.periodValue, { color: Colors.primary }]}>{formatPeriod()}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.amountButton} onPress={() => setShowCostBreakdown(!showCostBreakdown)}>
            <Text style={[styles.amountValue, { color: Colors.text }]}>{totalAmount.toLocaleString('ru-RU')} ₽</Text>
            <View style={{ transform: [{ rotate: showCostBreakdown ? '180deg' : '0deg' }] }}>
              <ChevronDown size={18} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {showCostBreakdown && (
          <View style={[styles.breakdownCard, { backgroundColor: Colors.surface1 }]} testID="home-cost-breakdown">
            <View style={styles.filterRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {([
                  { key: 'transport', label: 'Тип транспорта' },
                  { key: 'sender', label: 'Отправитель' },
                  { key: 'receiver', label: 'Получатель' },
                ] as { key: CostFilterType; label: string }[]).map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => { setCostFilterType(f.key); setCostFilterValue('all'); }}
                    style={[styles.filterChip, { backgroundColor: costFilterType === f.key ? Colors.primary : Colors.surface2 }]}
                    activeOpacity={0.8}
                    testID={`cost-filter-type-${f.key}`}
                  >
                    <Text style={[styles.filterChipText, { color: costFilterType === f.key ? '#FFFFFF' : Colors.text }]}>{f.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>



            {costBreakdown.length > 0 ? (
              <>
                <View style={styles.chartContainer}>
                  {costBreakdown.map((item) => {
                    const total = costBreakdown.reduce((s, x) => s + x.amount, 0) || 1;
                    const percentage = Math.round((item.amount / total) * 100);
                    return (
                      <View key={item.category} style={styles.chartBarContainer}>
                        <View style={styles.chartBarHeader}>
                          <View style={styles.chartBarLabelRow}>
                            <View style={[styles.chartBarDot, { backgroundColor: item.color }]} />
                            <Text style={[styles.chartBarLabel, { color: Colors.text }]}>{item.category}</Text>
                          </View>
                          <Text style={[styles.chartBarPercent, { color: Colors.text }]}>{percentage}%</Text>
                        </View>
                        <View style={[styles.chartBarTrack, { backgroundColor: Colors.surface2 }]}>
                          <View 
                            style={[
                              styles.chartBarFill, 
                              { backgroundColor: item.color, width: `${percentage}%` }
                            ]} 
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            ) : (
              <Text style={{ textAlign: 'center', color: Colors.textSecondary }}>Нет данных для выбранного фильтра</Text>
            )}
          </View>
        )}
        {/* Analytics modules ABOVE shipments */}
        {isHydrated && dashboardEnabled && dashboardEnabled.main_tiles && (
        <View style={[styles.metricsCard, { backgroundColor: Colors.surface1 }]}
          testID="home-metrics">
          <View style={styles.metricsGrid}>
            {activeMetric === 'shipments' ? (
              <>
                <TouchableOpacity
                  style={[styles.metricTile, { backgroundColor: Colors.surface2 }]}
                  onPress={() => setActiveMetric(null)}
                  activeOpacity={0.7}
                >
                  <View style={styles.metricIcon}>
                    <Package size={18} color={Colors.statusCreated} />
                  </View>
                  <Text style={[styles.metricValue, { color: Colors.text }]}>{filteredByDate.filter(o => o.status === 'accepted').length}</Text>
                  <View style={styles.metricFooter}>
                    <Text style={[styles.metricLabel, { color: Colors.textSecondary }]}>Принято</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.metricTile, { backgroundColor: Colors.surface2 }]}
                  onPress={() => setActiveMetric(null)}
                  activeOpacity={0.7}
                >
                  <View style={styles.metricIcon}>
                    <Package size={18} color={Colors.statusInTransit} />
                  </View>
                  <Text style={[styles.metricValue, { color: Colors.text }]}>{filteredByDate.filter(o => o.status === 'in_transit').length}</Text>
                  <View style={styles.metricFooter}>
                    <Text style={[styles.metricLabel, { color: Colors.textSecondary }]}>В пути</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.metricTile, { backgroundColor: Colors.surface2 }]}
                  onPress={() => setActiveMetric(null)}
                  activeOpacity={0.7}
                >
                  <View style={styles.metricIcon}>
                    <Package size={18} color={Colors.statusAtWarehouse} />
                  </View>
                  <Text style={[styles.metricValue, { color: Colors.text }]}>{filteredByDate.filter(o => o.status === 'ready_for_pickup').length}</Text>
                  <View style={styles.metricFooter}>
                    <Text style={[styles.metricLabel, { color: Colors.textSecondary }]}>Готов к выдаче</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.metricTile, { backgroundColor: Colors.surface2 }]}
                  onPress={() => setActiveMetric(null)}
                  activeOpacity={0.7}
                >
                  <View style={styles.metricIcon}>
                    <Package size={18} color={Colors.statusDelivered} />
                  </View>
                  <Text style={[styles.metricValue, { color: Colors.text }]}>{filteredByDate.filter(o => o.status === 'delivered').length}</Text>
                  <View style={styles.metricFooter}>
                    <Text style={[styles.metricLabel, { color: Colors.textSecondary }]}>Доставлено</Text>
                  </View>
                </TouchableOpacity>
              </>
            ) : activeMetric === 'weight' ? (
              <>
                <TouchableOpacity
                  style={[styles.metricTile, { backgroundColor: Colors.surface2 }]}
                  onPress={() => setActiveMetric(null)}
                  activeOpacity={0.7}
                >
                  <View style={styles.metricIcon}>
                    <Weight size={18} color={Colors.statusAtWarehouse} />
                  </View>
                  <Text style={[styles.metricValue, { color: Colors.text }]}>{(weightStats.min / 1000).toFixed(2)}</Text>
                  <View style={styles.metricFooter}>
                    <Text style={[styles.metricLabel, { color: Colors.textSecondary }]}>Мин вес, т</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.metricTile, { backgroundColor: Colors.surface2 }]}
                  onPress={() => setActiveMetric(null)}
                  activeOpacity={0.7}
                >
                  <View style={styles.metricIcon}>
                    <Weight size={18} color={Colors.statusAtWarehouse} />
                  </View>
                  <Text style={[styles.metricValue, { color: Colors.text }]}>{(weightStats.max / 1000).toFixed(2)}</Text>
                  <View style={styles.metricFooter}>
                    <Text style={[styles.metricLabel, { color: Colors.textSecondary }]}>Макс вес, т</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.metricTile, { backgroundColor: Colors.surface2 }]}
                  onPress={() => setActiveMetric(null)}
                  activeOpacity={0.7}
                >
                  <View style={styles.metricIcon}>
                    <Weight size={18} color={Colors.statusAtWarehouse} />
                  </View>
                  <Text style={[styles.metricValue, { color: Colors.text }]}>{(weightStats.avg / 1000).toFixed(2)}</Text>
                  <View style={styles.metricFooter}>
                    <Text style={[styles.metricLabel, { color: Colors.textSecondary }]}>Средний вес, т</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.metricTile, { backgroundColor: Colors.surface2 }]}
                  onPress={() => setActiveMetric(null)}
                  activeOpacity={0.7}
                >
                  <View style={styles.metricIcon}>
                    <Weight size={18} color={Colors.statusAtWarehouse} />
                  </View>
                  <Text style={[styles.metricValue, { color: Colors.text }]}>{(weightStats.avgChargeable / 1000).toFixed(2)}</Text>
                  <View style={styles.metricFooter}>
                    <Text style={[styles.metricLabel, { color: Colors.textSecondary }]}>Ср платный вес, т</Text>
                  </View>
                </TouchableOpacity>
              </>
            ) : activeMetric === 'volume' ? (
              <>
                <TouchableOpacity
                  style={[styles.metricTile, { backgroundColor: Colors.surface2 }]}
                  onPress={() => setActiveMetric(null)}
                  activeOpacity={0.7}
                >
                  <View style={styles.metricIcon}>
                    <Boxes size={18} color={Colors.statusInTransit} />
                  </View>
                  <Text style={[styles.metricValue, { color: Colors.text }]}>{volumeStats.min.toFixed(2)}</Text>
                  <View style={styles.metricFooter}>
                    <Text style={[styles.metricLabel, { color: Colors.textSecondary }]}>Мин V, м³</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.metricTile, { backgroundColor: Colors.surface2 }]}
                  onPress={() => setActiveMetric(null)}
                  activeOpacity={0.7}
                >
                  <View style={styles.metricIcon}>
                    <Boxes size={18} color={Colors.statusInTransit} />
                  </View>
                  <Text style={[styles.metricValue, { color: Colors.text }]}>{volumeStats.max.toFixed(2)}</Text>
                  <View style={styles.metricFooter}>
                    <Text style={[styles.metricLabel, { color: Colors.textSecondary }]}>Макс V, м³</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.metricTile, { backgroundColor: Colors.surface2 }]}
                  onPress={() => setActiveMetric(null)}
                  activeOpacity={0.7}
                >
                  <View style={styles.metricIcon}>
                    <Boxes size={18} color={Colors.statusInTransit} />
                  </View>
                  <Text style={[styles.metricValue, { color: Colors.text }]}>{volumeStats.avg.toFixed(2)}</Text>
                  <View style={styles.metricFooter}>
                    <Text style={[styles.metricLabel, { color: Colors.textSecondary }]}>Средний V, м³</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.metricTile, { backgroundColor: Colors.surface2 }]}
                  onPress={() => setActiveMetric(null)}
                  activeOpacity={0.7}
                >
                  <View style={styles.metricIcon}>
                    <Boxes size={18} color={Colors.statusInTransit} />
                  </View>
                  <Text style={[styles.metricValue, { color: Colors.text }]}>{volumeStats.density.toFixed(0)}</Text>
                  <View style={styles.metricFooter}>
                    <Text style={[styles.metricLabel, { color: Colors.textSecondary }]}>Ср плотность, кг/м³</Text>
                  </View>
                </TouchableOpacity>
              </>
            ) : activeMetric === 'invoices' ? (
              <>
                <TouchableOpacity
                  style={[styles.metricTile, { backgroundColor: Colors.surface2 }]}
                  onPress={() => setActiveMetric(null)}
                  activeOpacity={0.7}
                >
                  <View style={styles.metricIcon}>
                    <FileText size={18} color={Colors.success} />
                  </View>
                  <Text style={[styles.metricValue, { color: Colors.text }]}>{Math.round(invoiceStats.avgAmount).toLocaleString('ru-RU')}</Text>
                  <View style={styles.metricFooter}>
                    <Text style={[styles.metricLabel, { color: Colors.textSecondary }]}>Ср сумма счета, ₽</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.metricTile, { backgroundColor: Colors.surface2 }]}
                  onPress={() => setActiveMetric(null)}
                  activeOpacity={0.7}
                >
                  <View style={styles.metricIcon}>
                    <FileText size={18} color={Colors.success} />
                  </View>
                  <Text style={[styles.metricValue, { color: Colors.text }]}>{invoiceStats.paid}</Text>
                  <View style={styles.metricFooter}>
                    <Text style={[styles.metricLabel, { color: Colors.textSecondary }]}>Оплачено</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.metricTile, { backgroundColor: Colors.surface2 }]}
                  onPress={() => setActiveMetric(null)}
                  activeOpacity={0.7}
                >
                  <View style={styles.metricIcon}>
                    <FileText size={18} color={Colors.warning} />
                  </View>
                  <Text style={[styles.metricValue, { color: Colors.text }]}>{invoiceStats.unpaid}</Text>
                  <View style={styles.metricFooter}>
                    <Text style={[styles.metricLabel, { color: Colors.textSecondary }]}>Ожидает оплаты</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.metricTile, { backgroundColor: Colors.surface2 }]}
                  onPress={() => setActiveMetric(null)}
                  activeOpacity={0.7}
                >
                  <View style={styles.metricIcon}>
                    <FileText size={18} color={Colors.error} />
                  </View>
                  <Text style={[styles.metricValue, { color: Colors.text }]}>{invoiceStats.overdue}</Text>
                  <View style={styles.metricFooter}>
                    <Text style={[styles.metricLabel, { color: Colors.textSecondary }]}>Просрочено</Text>
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.metricTile, { backgroundColor: Colors.surface2 }]}
                  onPress={() => setActiveMetric('shipments')}
                  activeOpacity={0.7}
                >
                  <View style={styles.metricIcon}>
                    <Package size={18} color={Colors.primary} />
                  </View>
                  <Text style={[styles.metricValue, { color: Colors.text }]}>{totalOrders}</Text>
                  <View style={styles.metricFooter}>
                    <Text style={[styles.metricLabel, { color: Colors.textSecondary }]}>Всего перевозок</Text>
                    {tilesTrends.shipmentsChange !== 0 && (
                      <View style={styles.metricTrend}>
                        {tilesTrends.shipmentsChange > 0 ? (
                          <TrendingUp size={12} color={Colors.success} />
                        ) : (
                          <TrendingDown size={12} color={Colors.error} />
                        )}
                        <Text style={[styles.metricTrendText, { color: tilesTrends.shipmentsChange > 0 ? Colors.success : Colors.error }]}>
                          {tilesTrends.shipmentsChange > 0 ? '+' : ''}{tilesTrends.shipmentsChange}%
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.metricTile, { backgroundColor: Colors.surface2 }]}
                  onPress={() => setActiveMetric('invoices')}
                  activeOpacity={0.7}
                >
                  <View style={styles.metricIcon}>
                    <FileText size={18} color={Colors.primary} />
                  </View>
                  <Text style={[styles.metricValue, { color: Colors.text }]}>{invoiceStats.total}</Text>
                  <View style={styles.metricFooter}>
                    <Text style={[styles.metricLabel, { color: Colors.textSecondary }]}>Счета</Text>
                    {tilesTrends.invoicesChange !== 0 && (
                      <View style={styles.metricTrend}>
                        {tilesTrends.invoicesChange > 0 ? (
                          <TrendingUp size={12} color={Colors.success} />
                        ) : (
                          <TrendingDown size={12} color={Colors.error} />
                        )}
                        <Text style={[styles.metricTrendText, { color: tilesTrends.invoicesChange > 0 ? Colors.success : Colors.error }]}>
                          {tilesTrends.invoicesChange > 0 ? '+' : ''}{tilesTrends.invoicesChange}%
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.metricTile, { backgroundColor: Colors.surface2 }]}
                  onPress={() => setActiveMetric('weight')}
                  activeOpacity={0.7}
                >
                  <View style={styles.metricIcon}>
                    <Weight size={18} color={Colors.primary} />
                  </View>
                  <Text style={[styles.metricValue, { color: Colors.text }]}>{(totalWeightKg / 1000).toFixed(1)}т</Text>
                  <View style={styles.metricFooter}>
                    <Text style={[styles.metricLabel, { color: Colors.textSecondary }]}>Вес</Text>
                    {tilesTrends.weightChange !== 0 && (
                      <View style={styles.metricTrend}>
                        {tilesTrends.weightChange > 0 ? (
                          <TrendingUp size={12} color={Colors.success} />
                        ) : (
                          <TrendingDown size={12} color={Colors.error} />
                        )}
                        <Text style={[styles.metricTrendText, { color: tilesTrends.weightChange > 0 ? Colors.success : Colors.error }]}>
                          {tilesTrends.weightChange > 0 ? '+' : ''}{tilesTrends.weightChange}%
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.metricTile, { backgroundColor: Colors.surface2 }]}
                  onPress={() => setActiveMetric('volume')}
                  activeOpacity={0.7}
                >
                  <View style={styles.metricIcon}>
                    <Boxes size={18} color={Colors.primary} />
                  </View>
                  <Text style={[styles.metricValue, { color: Colors.text }]}>{totalVolumeM3.toFixed(1)}м³</Text>
                  <View style={styles.metricFooter}>
                    <Text style={[styles.metricLabel, { color: Colors.textSecondary }]}>Объем</Text>
                    {tilesTrends.volumeChange !== 0 && (
                      <View style={styles.metricTrend}>
                        {tilesTrends.volumeChange > 0 ? (
                          <TrendingUp size={12} color={Colors.success} />
                        ) : (
                          <TrendingDown size={12} color={Colors.error} />
                        )}
                        <Text style={[styles.metricTrendText, { color: tilesTrends.volumeChange > 0 ? Colors.success : Colors.error }]}>
                          {tilesTrends.volumeChange > 0 ? '+' : ''}{tilesTrends.volumeChange}%
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        )}



        <View style={[styles.notificationsCard, { backgroundColor: Colors.surface1 }]} testID="home-notifications">
          <View style={styles.notificationHeader}>
            <Bell size={20} color={Colors.primary} />
            <Text style={[styles.notificationTitle, { color: Colors.text }]}>Умные нотификации</Text>
          </View>

            {smartNotifications.invoicesDueByFriday > 0 && (
              <View style={[styles.notificationItem, { borderColor: Colors.warning }]}>
                <View style={styles.notificationContent}>
                  <Text style={[styles.notificationText, { color: Colors.text }]}>
                    {smartNotifications.invoicesDueByFriday} {smartNotifications.invoicesDueByFriday === 1 ? 'счет' : smartNotifications.invoicesDueByFriday < 5 ? 'счета' : 'счетов'} к оплате до Пт
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.notificationButton, { backgroundColor: Colors.warning }]}
                  onPress={() => router.push({ pathname: '/(tabs)/documents', params: { filter: 'unpaid' } })}
                >
                  <Text style={[styles.notificationButtonText, { color: '#FFFFFF' }]}>Оплатить</Text>
                </TouchableOpacity>
              </View>
            )}

            {smartNotifications.delayedOrders > 0 && (() => {
              const now = new Date();
              const delayedOrdersList = filteredByDate.filter(o => {
                if (o.status === 'delivered') return false;
                if (!o.plannedDeliveryDate) return false;
                const plannedDate = new Date(o.plannedDeliveryDate);
                const hoursSincePlanned = (now.getTime() - plannedDate.getTime()) / (1000 * 60 * 60);
                return hoursSincePlanned > 24;
              });
              const orderNumbers = delayedOrdersList.map(o => o.id).join(', ');
              const prefilledMessage = `Добрый день, подскажите статус ${orderNumbers}`;
              
              return (
                <View style={[styles.notificationItem, { borderColor: Colors.error }]}>
                  <View style={styles.notificationContent}>
                    <Text style={[styles.notificationText, { color: Colors.text }]}>
                      {smartNotifications.delayedOrders} {smartNotifications.delayedOrders === 1 ? 'груз опаздывает' : smartNotifications.delayedOrders < 5 ? 'груза опаздывают' : 'грузов опаздывают'} &gt; 1 дня
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.notificationButton, { backgroundColor: Colors.error }]}
                    onPress={() => router.push({ pathname: '/support/chat', params: { prefilledMessage } })}
                  >
                    <Text style={[styles.notificationButtonText, { color: '#FFFFFF' }]}>Связаться</Text>
                  </TouchableOpacity>
                </View>
              );
            })()}

          {smartNotifications.edoUnsigned > 0 && (
            <View style={[styles.notificationItem, { borderColor: Colors.warning }]}>
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationText, { color: Colors.text }]}>
                  {smartNotifications.edoUnsigned} документов ЭДО без подписи
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.notificationButton, { backgroundColor: Colors.warning }]}
                onPress={() => router.push({ pathname: '/(tabs)/documents', params: { edoFilter: 'pending' } })}
              >
                <Text style={[styles.notificationButtonText, { color: '#FFFFFF' }]}>Открыть</Text>
              </TouchableOpacity>
            </View>
          )}

          {smartNotifications.invoicesDueByFriday === 0 && smartNotifications.delayedOrders === 0 && smartNotifications.edoUnsigned === 0 && (
            <View style={styles.notificationEmpty}>
              <Text style={[styles.notificationEmptyText, { color: Colors.textSecondary }]}>Все в порядке! Нет срочных уведомлений</Text>
            </View>
          )}
        </View>

        {isHydrated && dashboardEnabled && dashboardEnabled.sla && (
        <View style={[styles.slaCard, { backgroundColor: Colors.surface1 }]} testID="home-sla">
          <View style={styles.slaHeader}>
            <MapPin size={20} color={Colors.primary} />
            <Text style={[styles.slaTitle, { color: Colors.text }]}>SLA монитор</Text>
          </View>

          {slaData.length === 0 ? (
            <View style={styles.notificationEmpty}>
              <Text style={[styles.notificationEmptyText, { color: Colors.textSecondary }]}>Нет данных для отображения SLA</Text>
            </View>
          ) : (
            slaData.map((route, index) => (
              <View key={index} style={[styles.slaRoute, { backgroundColor: Colors.surface2 }]}>
                <View style={styles.slaRouteHeader}>
                  <View style={styles.slaRouteInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={[styles.slaRouteCity, { color: Colors.text }]}>{route.city}</Text>
                      {route.weeklyChange !== 0 && (
                        <View style={styles.slaTrendBadge}>
                          {route.weeklyChange > 0 ? (
                            <TrendingUp size={12} color={Colors.success} />
                          ) : (
                            <TrendingDown size={12} color={Colors.error} />
                          )}
                          <Text style={[styles.slaTrendText, { color: route.weeklyChange > 0 ? Colors.success : Colors.error }]}>
                            {route.weeklyChange > 0 ? '+' : ''}{route.weeklyChange}%
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.slaRouteDetails}>
                      <Text style={[styles.slaRouteTime, { color: Colors.textSecondary }]}>{route.minHours}-{route.maxHours} ч</Text>
                    </View>
                  </View>
                  <View style={[styles.slaStatusBadge]}>
                    <Text style={[styles.slaStatusText, { color: route.onTimePercent >= 90 ? Colors.success : route.onTimePercent >= 75 ? Colors.warning : Colors.error }]}>
                      {route.onTimePercent >= 90 ? 'В норме' : route.onTimePercent >= 75 ? 'Внимание' : 'Критично'}
                    </Text>
                  </View>
                </View>
                <View style={styles.slaProgressContainer}>
                  <View style={[styles.slaProgressBar, { backgroundColor: Colors.surface1 }]}>
                    <View style={[styles.slaProgressFill, { 
                      backgroundColor: route.onTimePercent >= 90 ? Colors.success : route.onTimePercent >= 75 ? Colors.warning : Colors.error, 
                      width: `${route.onTimePercent}%` 
                    }]} />
                  </View>
                  <Text style={[styles.slaProgressText, { color: Colors.textSecondary }]}>{route.onTimePercent}% в срок</Text>
                </View>
              </View>
            ))
          )}
        </View>
        )}

        {isHydrated && dashboardEnabled && dashboardEnabled.edo_monitor && (
        <View style={[styles.edoCard, { backgroundColor: Colors.surface1 }]} testID="home-edo">
          <View style={styles.edoHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <LineChart size={18} color={Colors.primary} />
              <Text style={[styles.edoTitle, { color: Colors.text }]}>ЭДО монитор</Text>
            </View>
            <View style={styles.edoLegend}>
              <View style={[styles.edoLegendDot, { backgroundColor: Colors.success }]} />
              <Text style={[styles.edoLegendText, { color: Colors.textSecondary }]}>Подписано</Text>
              <View style={[styles.edoLegendDot, { backgroundColor: Colors.warning }]} />
              <Text style={[styles.edoLegendText, { color: Colors.textSecondary }]}>Не подписано</Text>
            </View>
          </View>
          <View style={styles.edoSummaryRow}>
            <View style={styles.edoSummaryItem}>
              <Text style={[styles.edoSummaryLabel, { color: Colors.textSecondary }]}>Всего</Text>
              <Text style={[styles.edoSummaryValue, { color: Colors.text }]}>{edoStats.totals.total}</Text>
            </View>
            <View style={styles.edoSummaryItem}>
              <Text style={[styles.edoSummaryLabel, { color: Colors.textSecondary }]}>Подписано</Text>
              <Text style={[styles.edoSummaryValue, { color: Colors.success }]}>{edoStats.totals.signed}</Text>
            </View>
            <View style={styles.edoSummaryItem}>
              <Text style={[styles.edoSummaryLabel, { color: Colors.textSecondary }]}>Не подписано</Text>
              <Text style={[styles.edoSummaryValue, { color: Colors.warning }]}>{edoStats.totals.unsigned}</Text>
            </View>
          </View>
          <View style={styles.edoGrid}>
            {(['ER','UPD','APP','RECON'] as EdoType[]).map((t) => {
              const s = edoStats.byType[t];
              const labelMap: Record<EdoType, string> = { ER: 'ЭР', UPD: 'УПД', APP: 'АПП', RECON: 'Акты сверки' };
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.edoTile, { backgroundColor: Colors.surface2 }]}
                  activeOpacity={0.8}
                  onPress={() => { setSelectedEdoType(t); setEdoListVisible(true); }}
                >
                  <View style={styles.edoTileHeader}>
                    <View style={[styles.edoTileIcon, { backgroundColor: Colors.surface1 }]}>
                      <FileText size={18} color={Colors.primary} />
                    </View>
                    <Text style={[styles.edoTileTitle, { color: Colors.text }]}>{labelMap[t]}</Text>
                  </View>
                  <View style={styles.edoTileRow}><Text style={[styles.edoTileLabel, { color: Colors.textSecondary }]}>Всего</Text><Text style={[styles.edoTileValue, { color: Colors.text }]}>{s.total}</Text></View>
                  <View style={styles.edoTileRow}><Text style={[styles.edoTileLabel, { color: Colors.textSecondary }]}>Подписано</Text><Text style={[styles.edoTileValue, { color: Colors.success }]}>{s.signed}</Text></View>
                  <View style={styles.edoTileRow}><Text style={[styles.edoTileLabel, { color: Colors.textSecondary }]}>Не подписано</Text><Text style={[styles.edoTileValue, { color: Colors.warning }]}>{s.unsigned}</Text></View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        )}

        {isHydrated && dashboardEnabled && dashboardEnabled.cashflow && (
        <View style={[styles.cashflowCard, { backgroundColor: Colors.surface1 }]} testID="home-cashflow">
          <View style={styles.cashflowHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={[styles.cashflowRubleIcon, { color: Colors.primary }]}>₽</Text>
              <Text style={[styles.cashflowTitle, { color: Colors.text }]}>Кэшфлоу на неделю</Text>
              {cashflowWithTrend.expenseChange !== 0 && (
                <View style={styles.cashflowTrendBadge}>
                  {cashflowWithTrend.expenseChange > 0 ? (
                    <TrendingUp size={14} color={Colors.error} />
                  ) : (
                    <TrendingDown size={14} color={Colors.success} />
                  )}
                  <Text style={[styles.cashflowTrendText, { color: cashflowWithTrend.expenseChange > 0 ? Colors.error : Colors.success }]}>
                    {cashflowWithTrend.expenseChange > 0 ? '+' : ''}{cashflowWithTrend.expenseChange}%
                  </Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity 
                onPress={() => setCashflowWeekOffset(prev => prev - 1)}
                style={[styles.weekArrowButton, { backgroundColor: Colors.surface2 }]}
              >
                <ChevronLeft size={20} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setCashflowWeekOffset(prev => prev + 1)}
                style={[styles.weekArrowButton, { backgroundColor: Colors.surface2 }]}
              >
                <ChevronRight size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.cashflowDays}>
            {cashflow.map((item, index) => (
              <View key={index} style={[styles.cashflowDay, { backgroundColor: Colors.surface2 }]}>
                <Text style={[styles.cashflowDayName, { color: Colors.text }]}>{item.day}</Text>
                <Text style={[styles.cashflowDate, { color: Colors.textSecondary }]}>{item.date}</Text>
                {item.income > 0 && (
                  <View style={[styles.cashflowAmountContainer, { backgroundColor: Colors.surface1 }]}>
                    <Text style={[styles.cashflowAmount, { color: Colors.success }]}>+{(item.income / 1000).toFixed(0)}к</Text>
                  </View>
                )}
                {item.expense > 0 && (
                  <View style={[styles.cashflowAmountContainer, { backgroundColor: Colors.surface1 }]}>
                    <Text style={[styles.cashflowAmount, { color: Colors.error }]}>−{(item.expense / 1000).toFixed(0)}к</Text>
                  </View>
                )}
                {item.income === 0 && item.expense === 0 && (
                  <View style={[styles.cashflowAmountContainer, { backgroundColor: Colors.surface1 }]}>
                    <Text style={[styles.cashflowAmountEmpty, { color: Colors.textSecondary }]}>—</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          <View style={[styles.cashflowTotal, { backgroundColor: Colors.surface2 }]}>
            <Text style={[styles.cashflowTotalLabel, { color: Colors.textSecondary }]}>Ожидается за неделю</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {cashflow.reduce((s, i) => s + i.income, 0) > 0 && (
                <Text style={[styles.cashflowTotalAmount, { color: Colors.success }]}>+{(cashflow.reduce((s, i) => s + i.income, 0)).toLocaleString('ru-RU')} ₽</Text>
              )}
              {cashflow.reduce((s, i) => s + i.expense, 0) > 0 && (
                <Text style={[styles.cashflowTotalAmount, { color: Colors.error }]}>−{(cashflow.reduce((s, i) => s + i.expense, 0)).toLocaleString('ru-RU')} ₽</Text>
              )}
            </View>
          </View>
        </View>
        )}

        {isHydrated && dashboardEnabled && dashboardEnabled.damage_monitor && (
        <TouchableOpacity 
          style={[styles.damageCard, { backgroundColor: Colors.surface1 }]} 
          testID="home-damage"
          onPress={() => { setDamageFilter('active'); setShowDamageDetails(true); }}
          activeOpacity={0.8}
        >
          <View style={styles.damageHeader}>
            <ShieldAlert size={20} color={Colors.primary} />
            <Text style={[styles.damageTitle, { color: Colors.text }]}>Монитор ущерба</Text>
            {damageStats.casesChange !== 0 && damageView === 'main' && (
              <View style={styles.damageTrendBadge}>
                {damageStats.casesChange > 0 ? (
                  <TrendingUp size={14} color={Colors.error} />
                ) : (
                  <TrendingDown size={14} color={Colors.success} />
                )}
                <Text style={[styles.damageTrendText, { color: damageStats.casesChange > 0 ? Colors.error : Colors.success }]}>
                  {damageStats.casesChange > 0 ? '+' : ''}{damageStats.casesChange}%
                </Text>
              </View>
            )}
          </View>

          {damageView === 'main' && (
            <View style={styles.damageGrid}>
              <TouchableOpacity 
                style={[styles.damageTile, { backgroundColor: Colors.surface2 }]}
                onPress={() => setDamageView('count-detail')}
                activeOpacity={0.7}
              >
                <View style={[styles.damageIcon, { backgroundColor: Colors.warning + '20' }]}>
                  <ShieldAlert size={24} color={Colors.warning} />
                </View>
                <Text style={[styles.damageValue, { color: Colors.text }]}>{damageStats.activeCases}</Text>
                <Text style={[styles.damageLabel, { color: Colors.textSecondary }]}>Кол-во претензий</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.damageTile, { backgroundColor: Colors.surface2 }]}
                onPress={() => setDamageView('amount-detail')}
                activeOpacity={0.7}
              >
                <View style={[styles.damageIcon, { backgroundColor: Colors.error + '20' }]}>
                  <Text style={[styles.damageRubleIcon, { color: Colors.error }]}>₽</Text>
                </View>
                <Text style={[styles.damageValue, { color: Colors.text }]}>{(damageStats.totalAmount / 1000).toFixed(0)}к</Text>
                <Text style={[styles.damageLabel, { color: Colors.textSecondary }]}>Сумма претензий</Text>
              </TouchableOpacity>
            </View>
          )}

          {damageView === 'count-detail' && (
            <View style={styles.damageGrid}>
              <TouchableOpacity 
                style={[styles.damageTile, { backgroundColor: Colors.surface2 }]}
                onPress={() => setDamageView('main')}
                activeOpacity={0.7}
              >
                <View style={[styles.damageIcon, { backgroundColor: Colors.success + '20' }]}>
                  <ShieldAlert size={24} color={Colors.success} />
                </View>
                <Text style={[styles.damageValue, { color: Colors.text }]}>{damageStats.approvedCount}</Text>
                <Text style={[styles.damageLabel, { color: Colors.textSecondary }]}>Удовлетворено</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.damageTile, { backgroundColor: Colors.surface2 }]}
                onPress={() => setDamageView('main')}
                activeOpacity={0.7}
              >
                <View style={[styles.damageIcon, { backgroundColor: Colors.error + '20' }]}>
                  <ShieldAlert size={24} color={Colors.error} />
                </View>
                <Text style={[styles.damageValue, { color: Colors.text }]}>{damageStats.rejectedCount}</Text>
                <Text style={[styles.damageLabel, { color: Colors.textSecondary }]}>Отказано</Text>
              </TouchableOpacity>
            </View>
          )}

          {damageView === 'amount-detail' && (
            <View style={styles.damageGrid}>
              <TouchableOpacity 
                style={[styles.damageTile, { backgroundColor: Colors.surface2 }]}
                onPress={() => setDamageView('main')}
                activeOpacity={0.7}
              >
                <View style={[styles.damageIcon, { backgroundColor: Colors.success + '20' }]}>
                  <Text style={[styles.damageRubleIcon, { color: Colors.success }]}>₽</Text>
                </View>
                <Text style={[styles.damageValue, { color: Colors.text }]}>{(damageStats.approvedAmount / 1000).toFixed(0)}к</Text>
                <Text style={[styles.damageLabel, { color: Colors.textSecondary }]}>Сумма удовлетворено</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.damageTile, { backgroundColor: Colors.surface2 }]}
                onPress={() => setDamageView('main')}
                activeOpacity={0.7}
              >
                <View style={[styles.damageIcon, { backgroundColor: Colors.error + '20' }]}>
                  <Text style={[styles.damageRubleIcon, { color: Colors.error }]}>₽</Text>
                </View>
                <Text style={[styles.damageValue, { color: Colors.text }]}>{(damageStats.rejectedAmount / 1000).toFixed(0)}к</Text>
                <Text style={[styles.damageLabel, { color: Colors.textSecondary }]}>Сумма отказано</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
        )}

        {isHydrated && dashboardEnabled && dashboardEnabled.delivery_forecast && (
        <View style={[styles.deliveryForecastCard, { backgroundColor: Colors.surface1 }]} testID="home-delivery-forecast">
          <View style={styles.deliveryForecastHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Truck size={20} color={Colors.primary} />
              <Text style={[styles.deliveryForecastTitle, { color: Colors.text }]}>Прогноз доставки</Text>
              {deliveryForecastWithTrend.deliveryChange !== 0 && (
                <View style={styles.deliveryTrendBadge}>
                  {deliveryForecastWithTrend.deliveryChange > 0 ? (
                    <TrendingUp size={14} color={Colors.success} />
                  ) : (
                    <TrendingDown size={14} color={Colors.error} />
                  )}
                  <Text style={[styles.deliveryTrendText, { color: deliveryForecastWithTrend.deliveryChange > 0 ? Colors.success : Colors.error }]}>
                    {deliveryForecastWithTrend.deliveryChange > 0 ? '+' : ''}{deliveryForecastWithTrend.deliveryChange}%
                  </Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity 
                onPress={() => setDeliveryWeekOffset(prev => prev - 1)}
                style={[styles.weekArrowButton, { backgroundColor: Colors.surface2 }]}
              >
                <ChevronLeft size={20} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setDeliveryWeekOffset(prev => prev + 1)}
                style={[styles.weekArrowButton, { backgroundColor: Colors.surface2 }]}
              >
                <ChevronRight size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.deliveryForecastDays}>
            {deliveryForecast.weekDays.map((item, index) => (
              <View key={index} style={[styles.deliveryForecastDay, { backgroundColor: Colors.surface2 }]}>
                <Text style={[styles.deliveryForecastDayName, { color: Colors.text }]}>{item.day}</Text>
                <Text style={[styles.deliveryForecastDayNum, { color: Colors.text }]}>{item.dayNum}</Text>
                <Text style={[styles.deliveryForecastMonth, { color: Colors.textSecondary }]}>{item.month}</Text>
                <View style={styles.deliveryForecastCounts}>
                  {item.auto > 0 && (
                    <View style={[styles.deliveryForecastCountBadge, { backgroundColor: '#00D4FF' }]}>
                      <Text style={[styles.deliveryForecastCountText, { color: '#FFFFFF' }]}>{item.auto}</Text>
                    </View>
                  )}
                  {item.ferry > 0 && (
                    <View style={[styles.deliveryForecastCountBadge, { backgroundColor: '#A78BFA' }]}>
                      <Text style={[styles.deliveryForecastCountText, { color: '#FFFFFF' }]}>{item.ferry}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.deliveryForecastTotal, { backgroundColor: Colors.surface2 }]}>
            <View style={styles.deliveryForecastTotalItem}>
              <View style={[styles.deliveryForecastLegendDot, { backgroundColor: '#00D4FF' }]} />
              <Text style={[styles.deliveryForecastTotalLabel, { color: Colors.textSecondary }]}>Авто</Text>
              <Text style={[styles.deliveryForecastTotalValue, { color: Colors.text }]}>{deliveryForecast.totalAuto}</Text>
            </View>
            <View style={styles.deliveryForecastTotalItem}>
              <View style={[styles.deliveryForecastLegendDot, { backgroundColor: '#A78BFA' }]} />
              <Text style={[styles.deliveryForecastTotalLabel, { color: Colors.textSecondary }]}>Паром</Text>
              <Text style={[styles.deliveryForecastTotalValue, { color: Colors.text }]}>{deliveryForecast.totalFerry}</Text>
            </View>
          </View>
        </View>
        )}

        {/* Shipments section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: Colors.text }]}>Перевозки</Text>
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: Colors.surface1 }]}
                onPress={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                <Text style={[styles.filterButtonText, { color: Colors.primary }]}>
                  {filterOptions.find((f) => f.value === selectedFilter)?.label}
                </Text>
                <ChevronDown size={16} color={Colors.primary} />
              </TouchableOpacity>
              {showFilterDropdown && (
                <View style={[styles.filterDropdown, { backgroundColor: Colors.surface1 }]}>
                  {filterOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterOption,
                        { borderBottomColor: Colors.surface2 },
                        selectedFilter === option.value && { backgroundColor: Colors.surface2 },
                      ]}
                      onPress={() => {
                        setSelectedFilter(option.value);
                        setShowFilterDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          { color: Colors.text },
                          selectedFilter === option.value && styles.filterOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {companies.length === 0 ? (
            <View style={styles.emptyState}>
              <Building2 size={64} color={Colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: Colors.text }]}>Нет компаний</Text>
              <Text style={[styles.emptyDescription, { color: Colors.textSecondary }]}>Добавьте компанию в профиле, чтобы увидеть перевозки</Text>
            </View>
          ) : filteredByDate.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: Colors.text }]}>Нет перевозок</Text>
              <Text style={[styles.emptyDescription, { color: Colors.textSecondary }]}>Перевозки с выбранным статусом не найдены</Text>
            </View>
          ) : (
            filteredByDate.map((order) => {
              const status = statusConfig[order.status as keyof typeof statusConfig];
              if (!status) return null;
              const isExpanded = expandedOrderId === order.id;
              return (
                <TouchableOpacity
                  key={order.id}
                  style={[styles.orderCard, { backgroundColor: Colors.surface1 }]}
                  onPress={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.orderHeader}>
                    <Text style={[styles.orderId, { color: Colors.text }]}>{order.id}</Text>
                    <View style={styles.orderActions}>
                      <TouchableOpacity style={styles.orderActionButton} onPress={(e) => { e.stopPropagation?.(); Share.share({ message: `Перевозка ${order.id}` }); }}>
                        <Share2 size={20} color={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.orderActionButton} onPress={(e) => { e.stopPropagation?.(); router.push({ pathname: '/support/chat', params: { prefilledMessage: `Добрый день, вопрос по перевозке ${order.id}` } }); }}>
                        <MessageCircle size={20} color={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.orderActionButton} onPress={(e) => { e.stopPropagation?.(); router.push(`/order/${order.id}`); }}>
                        <ArrowRight size={20} color={Colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { borderColor: status.color }]}> 
                    <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <View style={styles.routeInfo}>
                        <Text style={[styles.routeLabel, { color: Colors.textSecondary }]}>Откуда:</Text>
                        <Text style={[styles.routeValue, { color: Colors.text }]}>{order.route.from.city}</Text>
                      </View>
                      <View style={styles.routeInfo}>
                        <Text style={[styles.routeLabel, { color: Colors.textSecondary }]}>Куда:</Text>
                        <Text style={[styles.routeValue, { color: Colors.text }]}>{order.route.to.city}</Text>
                      </View>
                      {order.eta ? (
                        <View style={styles.routeInfo}>
                          <Text style={[styles.routeLabel, { color: Colors.textSecondary }]}>{order.status === 'delivered' ? 'Дата доставки:' : 'Плановая дата доставки:'}</Text>
                          <Text style={[styles.routeValue, { color: Colors.text }]}>{new Date(order.eta).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}</Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

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
                    selectedCompanyId === company.id && { backgroundColor: Colors.surface2 },
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
        visible={showPeriodSelector}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPeriodSelector(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPeriodSelector(false)}>
          <View style={[styles.modalContent, { backgroundColor: Colors.surface1 }]}
          >
            <Text style={[styles.modalTitle, { color: Colors.text }]}>Выбор периода</Text>
            <View style={styles.periodOptions}>
              <TouchableOpacity
                testID="period-current-month"
                style={[styles.periodOption, { backgroundColor: Colors.surface2 }]}
                onPress={() => {
                  const now = new Date();
                  const start = new Date(now.getFullYear(), now.getMonth(), 1);
                  setStartDate(start);
                  setEndDate(now);
                  setShowPeriodSelector(false);
                }}
              >
                <Calendar size={20} color={Colors.primary} />
                <Text style={[styles.periodOptionText, { color: Colors.text }]}>Текущий месяц</Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="period-last-month"
                style={[styles.periodOption, { backgroundColor: Colors.surface2 }]}
                onPress={() => {
                  const now = new Date();
                  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                  const end = new Date(now.getFullYear(), now.getMonth(), 0);
                  setStartDate(start);
                  setEndDate(end);
                  setShowPeriodSelector(false);
                }}
              >
                <Calendar size={20} color={Colors.primary} />
                <Text style={[styles.periodOptionText, { color: Colors.text }]}>Прошлый месяц</Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="period-current-year"
                style={[styles.periodOption, { backgroundColor: Colors.surface2 }]}
                onPress={() => {
                  const now = new Date();
                  const start = new Date(now.getFullYear(), 0, 1);
                  setStartDate(start);
                  setEndDate(now);
                  setShowPeriodSelector(false);
                }}
              >
                <Calendar size={20} color={Colors.primary} />
                <Text style={[styles.periodOptionText, { color: Colors.text }]}>Текущий год</Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="period-custom"
                style={[styles.periodOption, { backgroundColor: Colors.surface2 }]}
                onPress={() => {
                  setTempStartDate(startDate);
                  setTempEndDate(endDate);
                  setShowPeriodSelector(false);
                  setShowCustomPeriod(true);
                }}
              >
                <Calendar size={20} color={Colors.primary} />
                <Text style={[styles.periodOptionText, { color: Colors.text }]}>Произвольный период</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showCustomPeriod}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomPeriod(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowCustomPeriod(false)}>
          <View style={[styles.modalContent, { backgroundColor: Colors.surface1 }]}>
            <Text style={[styles.modalTitle, { color: Colors.text }]}>Произвольный период</Text>
            <View style={styles.customPeriodContainer}>
              <View style={styles.dateInputContainer}>
                <Text style={[styles.dateLabel, { color: Colors.textSecondary }]}>Дата начала</Text>
                <TouchableOpacity
                  style={[styles.dateInput, { backgroundColor: Colors.surface2 }]}
                  onPress={() => setTempStartDate(new Date(tempStartDate.getFullYear(), tempStartDate.getMonth(), tempStartDate.getDate() - 1))}
                >
                  <Text style={[styles.dateInputText, { color: Colors.text }]}>
                    {tempStartDate.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateInputContainer}>
                <Text style={[styles.dateLabel, { color: Colors.textSecondary }]}>Дата окончания</Text>
                <TouchableOpacity
                  style={[styles.dateInput, { backgroundColor: Colors.surface2 }]}
                  onPress={() => setTempEndDate(new Date(tempEndDate.getFullYear(), tempEndDate.getMonth(), tempEndDate.getDate() + 1))}
                >
                  <Text style={[styles.dateInputText, { color: Colors.text }]}>
                    {tempEndDate.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.customPeriodActions}>
              <TouchableOpacity style={[styles.customPeriodButton, { backgroundColor: Colors.surface2 }]} onPress={() => setShowCustomPeriod(false)}>
                <Text style={[styles.customPeriodButtonText, { color: Colors.text }]}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.customPeriodButton, { backgroundColor: Colors.primary }]}
                onPress={() => {
                  setStartDate(tempStartDate);
                  setEndDate(tempEndDate);
                  setShowCustomPeriod(false);
                }}
              >
                <Text style={[styles.customPeriodButtonText, { color: '#FFFFFF' }]}>Применить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showDamageDetails}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDamageDetails(false)}
      >
        <View style={[styles.damageDetailsContainer, { backgroundColor: Colors.background }]}>
          <View style={[styles.damageDetailsHeader, { paddingTop: insets.top + 16, backgroundColor: Colors.surface1 }]}>
            <TouchableOpacity onPress={() => setShowDamageDetails(false)} style={styles.damageDetailsBackButton}>
              <ChevronLeft size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.damageDetailsTitle, { color: Colors.text }]}>
              {damageFilter === 'active' ? 'Активные претензии' : damageFilter === 'approved' ? 'Удовлетворенные претензии' : damageFilter === 'rejected' ? 'Отклоненные претензии' : 'Все претензии'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={[styles.damageDetailsSummary, { backgroundColor: Colors.surface1 }]}>
            <View style={styles.damageDetailsSummaryItem}>
              <View style={[styles.damageDetailsSummaryIcon, { backgroundColor: Colors.warning + '20' }]}>
                <ShieldAlert size={20} color={Colors.warning} />
              </View>
              <View>
                <Text style={[styles.damageDetailsSummaryValue, { color: Colors.text }]}>{damageStats.activeCases}</Text>
                <Text style={[styles.damageDetailsSummaryLabel, { color: Colors.textSecondary }]}>Активные случаи</Text>
              </View>
            </View>
            <View style={styles.damageDetailsSummaryItem}>
              <View style={[styles.damageDetailsSummaryIcon, { backgroundColor: Colors.error + '20' }]}>
                <Text style={[styles.damageRubleIcon, { color: Colors.error, fontSize: 20 }]}>₽</Text>
              </View>
              <View>
                <Text style={[styles.damageDetailsSummaryValue, { color: Colors.text }]}>{(damageStats.totalAmount / 1000).toFixed(0)}к</Text>
                <Text style={[styles.damageDetailsSummaryLabel, { color: Colors.textSecondary }]}>Сумма претензий</Text>
              </View>
            </View>
          </View>

          <ScrollView style={styles.damageDetailsList} contentContainerStyle={styles.damageDetailsListContent}>
            {filteredByDate.filter(o => {
              if (!o.hasClaim || !o.claim) return false;
              if (damageFilter === 'active') return o.claim.status === 'pending' || o.claim.status === 'approved';
              if (damageFilter === 'approved') return o.claim.status === 'approved';
              if (damageFilter === 'rejected') return o.claim.status === 'rejected';
              return true;
            }).map((order) => {
              const claimStatusLabel = order.claim?.status === 'pending' ? 'Рассмотрение' : order.claim?.status === 'approved' ? 'Одобрено' : 'Отклонено';
              const claimStatusColor = order.claim?.status === 'pending' ? Colors.warning : order.claim?.status === 'approved' ? Colors.success : Colors.error;
              const claimTypeLabel = order.claim?.type === 'damage' ? 'Повреждение' : order.claim?.type === 'delay' ? 'Задержка' : order.claim?.type === 'shortage' ? 'Недостача' : 'Другое';
              
              return (
                <TouchableOpacity
                  key={order.id}
                  style={[styles.damageDetailsCard, { backgroundColor: Colors.surface1 }]}
                  onPress={() => {
                    setShowDamageDetails(false);
                    router.push(`/order/${order.id}`);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.damageDetailsCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.damageDetailsCardId, { color: Colors.text }]}>Груз #{order.id}</Text>
                      <Text style={[styles.damageDetailsCardDate, { color: Colors.textSecondary }]}>
                        {new Date(order.claim?.createdAt || order.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <View style={[styles.damageDetailsCardStatusBadge, { backgroundColor: claimStatusColor + '20', borderColor: claimStatusColor }]}>
                      <Text style={[styles.damageDetailsCardStatusText, { color: claimStatusColor }]}>{claimStatusLabel}</Text>
                    </View>
                  </View>

                  <Text style={[styles.damageDetailsCardDescription, { color: Colors.text }]} numberOfLines={2}>
                    {order.claim?.description || 'Нет описания'}
                  </Text>

                  <View style={styles.damageDetailsCardFooter}>
                    <View style={styles.damageDetailsCardType}>
                      <Text style={[styles.damageDetailsCardTypeLabel, { color: Colors.textSecondary }]}>Тип:</Text>
                      <Text style={[styles.damageDetailsCardTypeValue, { color: Colors.text }]}>{claimTypeLabel}</Text>
                    </View>
                    <View style={styles.damageDetailsCardAmount}>
                      <Text style={[styles.damageDetailsCardAmountValue, { color: Colors.error }]}>₽{(order.claim?.amount || 0).toLocaleString('ru-RU')}</Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={[styles.damageDetailsCardButton, { backgroundColor: Colors.primary }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      setShowDamageDetails(false);
                      router.push(`/order/${order.id}`);
                    }}
                  >
                    <Text style={[styles.damageDetailsCardButtonText, { color: '#FFFFFF' }]}>Подробнее</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}

            {filteredByDate.filter(o => {
              if (!o.hasClaim || !o.claim) return false;
              if (damageFilter === 'active') return o.claim.status === 'pending' || o.claim.status === 'approved';
              if (damageFilter === 'approved') return o.claim.status === 'approved';
              if (damageFilter === 'rejected') return o.claim.status === 'rejected';
              return true;
            }).length === 0 && (
              <View style={styles.damageDetailsEmpty}>
                <ShieldAlert size={64} color={Colors.textSecondary} />
                <Text style={[styles.damageDetailsEmptyTitle, { color: Colors.text }]}>
                  {damageFilter === 'active' ? 'Нет активных претензий' : damageFilter === 'approved' ? 'Нет удовлетворенных претензий' : damageFilter === 'rejected' ? 'Нет отклоненных претензий' : 'Нет претензий'}
                </Text>
                <Text style={[styles.damageDetailsEmptyDescription, { color: Colors.textSecondary }]}>Все претензии обработаны</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={edoListVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEdoListVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setEdoListVisible(false)}>
          <View style={[styles.edoListModal, { backgroundColor: Colors.surface1 }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.modalTitle, { color: Colors.text }]}>Документы: {selectedEdoType === 'ER' ? 'ЭР' : selectedEdoType === 'UPD' ? 'УПД' : selectedEdoType === 'APP' ? 'АПП' : 'Акты сверки'}</Text>
            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ paddingVertical: 8 }}>
              {filteredDocuments.filter(d => selectedEdoType ? getEdoType(d) === selectedEdoType : false).map((doc) => (
                <TouchableOpacity key={doc.id} style={[styles.documentCard, { backgroundColor: Colors.surface1 }]}
                  onPress={() => {
                    setEdoListVisible(false);
                    if (doc.type === 'invoice') {
                      router.push(`/document/invoice/${doc.orderId || doc.id}`);
                    }
                  }}
                >
                  <View style={styles.documentHeader}>
                    <View style={[styles.documentIcon, { backgroundColor: Colors.surface2 }]}>
                      <FileText size={24} color={Colors.primary} />
                    </View>
                    <View style={styles.documentInfo}>
                      <Text style={[styles.documentTitle, { color: Colors.text }]}>{doc.title}</Text>
                      <Text style={[styles.documentDate, { color: Colors.textSecondary }]}>{new Date(doc.date).toLocaleDateString('ru-RU')}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              {filteredDocuments.filter(d => selectedEdoType ? getEdoType(d) === selectedEdoType : false).length === 0 && (
                <View style={styles.emptyState}>
                  <FileText size={48} color={Colors.textSecondary} />
                  <Text style={[styles.emptyTitle, { color: Colors.text }]}>Нет документов</Text>
                </View>
              )}
            </ScrollView>
            <TouchableOpacity style={[styles.customPeriodButton, { backgroundColor: Colors.surface2 }]} onPress={() => setEdoListVisible(false)}>
              <Text style={[styles.customPeriodButtonText, { color: Colors.text }]}>Закрыть</Text>
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
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 8,
    marginBottom: 12,
  },
  companySelector: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  companySelectorText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  searchField: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 15,
  },
  searchResultsDropdown: {
    position: 'absolute' as const,
    top: 54,
    left: 0,
    right: 0,
    borderRadius: 12,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden' as const,
  },
  searchResultsScroll: {
    maxHeight: 400,
  },
  searchResultsSection: {
    paddingVertical: 8,
  },
  searchResultsSectionTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchResultItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchResultItemContent: {
    flex: 1,
    gap: 4,
  },
  searchResultItemTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  searchResultItemSubtitle: {
    fontSize: 13,
  },
  periodRow: {
    marginTop: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  periodButton: { flexDirection: 'row' as const, alignItems: 'center' as const },
  periodValue: { fontSize: 16, fontWeight: '700' as const },
  amountButton: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
  amountValue: { fontSize: 18, fontWeight: '800' as const },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  /* Cost breakdown */
  breakdownCard: { borderRadius: 16, padding: 16, marginBottom: 16, gap: 12 },
  filterRow: { marginBottom: 4 },
  filterScroll: { gap: 8, paddingHorizontal: 2 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  filterChipText: { fontSize: 14, fontWeight: '600' as const },
  filterValueChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
  filterValueChipText: { fontSize: 13, fontWeight: '500' as const },
  chartContainer: { gap: 12, marginBottom: 8 },
  chartBarContainer: { gap: 6 },
  chartBarHeader: { 
    flexDirection: 'row' as const, 
    justifyContent: 'space-between' as const, 
    alignItems: 'center' as const 
  },
  chartBarLabelRow: { 
    flexDirection: 'row' as const, 
    alignItems: 'center' as const, 
    gap: 8 
  },
  chartBarDot: { width: 12, height: 12, borderRadius: 6 },
  chartBarLabel: { fontSize: 15, fontWeight: '600' as const },
  chartBarPercent: { fontSize: 15, fontWeight: '700' as const },
  chartBarTrack: { 
    height: 8, 
    borderRadius: 4, 
    overflow: 'hidden' as const 
  },
  chartBarFill: { 
    height: 8, 
    borderRadius: 4 
  },
  breakdownList: { gap: 12 },
  breakdownItem: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
  breakdownLeft: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, flex: 1 },
  breakdownDot: { width: 10, height: 10, borderRadius: 5 },
  breakdownCategory: { fontSize: 15, fontWeight: '600' as const },
  breakdownAmount: { fontSize: 15, fontWeight: '700' as const },

  /* Metrics */
  metricsCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  metricsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  metricTile: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  metricFooter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  metricLabel: {
    fontSize: 13,
  },
  metricTrend: {
    flexDirection: 'row' as const,
    gap: 4,
    alignItems: 'center' as const,
  },
  metricTrendText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },

  /* Details */
  detailsCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  detailsHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  detailsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  detailTile: {
    width: '48%',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  detailValue: {
    fontSize: 20,
    fontWeight: '700' as const,
  },

  /* Notifications */
  notificationsCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  notificationHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 12,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  notificationItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  notificationContent: {
    flex: 1,
    paddingRight: 10,
  },
  notificationText: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  notificationButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  notificationButtonText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  notificationEmpty: {
    paddingVertical: 12,
    alignItems: 'center' as const,
  },
  notificationEmptyText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },

  /* SLA */
  slaCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  slaHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 12,
  },
  slaTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  slaRoute: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  slaRouteHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  slaRouteInfo: {
    gap: 2,
  },
  slaRouteCity: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  slaRouteDetails: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  slaRouteTime: { fontSize: 13 },
  slaRouteDistance: { fontSize: 13 },
  slaDot: { width: 4, height: 4, borderRadius: 2 },
  slaStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  slaStatusText: { fontSize: 13, fontWeight: '700' as const },
  slaProgressContainer: { gap: 8 },
  slaProgressBar: { height: 8, borderRadius: 6, overflow: 'hidden' as const },
  slaProgressFill: { height: 8, borderRadius: 6 },
  slaProgressText: { fontSize: 12 },
  slaTrendBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  slaTrendText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },

  /* EDO Monitor */
  edoCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  edoHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
  },
  edoTitle: { fontSize: 18, fontWeight: '700' as const },
  edoLegend: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  edoLegendDot: { width: 8, height: 8, borderRadius: 4 },
  edoLegendText: { fontSize: 12, fontWeight: '600' as const },
  edoSummaryRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, marginBottom: 12 },
  edoSummaryItem: { flex: 1, alignItems: 'center' as const },
  edoSummaryLabel: { fontSize: 12 },
  edoSummaryValue: { fontSize: 18, fontWeight: '800' as const },
  edoGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 10 },
  edoTile: { width: '48%', borderRadius: 12, padding: 12 },
  edoTileHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginBottom: 8 },
  edoTileIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center' as const, justifyContent: 'center' as const },
  edoTileTitle: { fontSize: 14, fontWeight: '700' as const },
  edoTileRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, marginTop: 4 },
  edoTileLabel: { fontSize: 12 },
  edoTileValue: { fontSize: 14, fontWeight: '700' as const },

  /* Cashflow */
  cashflowCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  cashflowHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
  },
  cashflowTitle: { fontSize: 18, fontWeight: '700' as const },
  cashflowRubleIcon: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  weekArrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  cashflowDays: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 12,
  },
  cashflowDay: { flex: 1, borderRadius: 12, padding: 12, gap: 6 },
  cashflowDayName: { fontSize: 14, fontWeight: '700' as const },
  cashflowDate: { fontSize: 12 },
  cashflowAmountContainer: { borderRadius: 8, paddingVertical: 8, alignItems: 'center' as const },
  cashflowAmount: { fontSize: 14, fontWeight: '700' as const },
  cashflowAmountEmpty: { fontSize: 16 },
  cashflowTotal: { borderRadius: 14, padding: 12, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
  cashflowTotalLabel: { fontSize: 13 },
  cashflowTotalAmount: { fontSize: 18, fontWeight: '800' as const },
  cashflowTrendBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  cashflowTrendText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },

  /* Delivery Forecast */
  deliveryForecastCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  deliveryForecastHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
  },
  deliveryForecastTitle: { fontSize: 18, fontWeight: '700' as const },
  deliveryForecastDays: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 12,
  },
  deliveryForecastDay: { flex: 1, borderRadius: 12, padding: 10, gap: 4, alignItems: 'center' as const },
  deliveryForecastDayName: { fontSize: 12, fontWeight: '700' as const },
  deliveryForecastDayNum: { fontSize: 20, fontWeight: '800' as const },
  deliveryForecastMonth: { fontSize: 10, textTransform: 'uppercase' as const },
  deliveryForecastCounts: { flexDirection: 'row' as const, gap: 4, marginTop: 6 },
  deliveryForecastCountBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  deliveryForecastCountText: { fontSize: 14, fontWeight: '700' as const },
  deliveryForecastTotal: { borderRadius: 14, padding: 12, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-around' as const },
  deliveryForecastTotalItem: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
  deliveryForecastLegendDot: { width: 12, height: 12, borderRadius: 6 },
  deliveryForecastTotalLabel: { fontSize: 13 },
  deliveryForecastTotalValue: { fontSize: 16, fontWeight: '700' as const },
  deliveryTrendBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  deliveryTrendText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },

  /* Damage Monitor */
  damageCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  damageHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 16,
  },
  damageTitle: { fontSize: 18, fontWeight: '700' as const },
  damageGrid: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  damageTile: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    gap: 8,
    alignItems: 'center' as const,
  },
  damageIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  damageRubleIcon: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  damageValue: {
    fontSize: 24,
    fontWeight: '800' as const,
  },
  damageLabel: {
    fontSize: 13,
    textAlign: 'center' as const,
  },
  damageTrendBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginLeft: 'auto' as const,
  },
  damageTrendText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },

  /* Shipments */
  section: {
    marginBottom: 32,
    zIndex: 1,
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
  emptyDescription: {
    fontSize: 15,
    textAlign: 'center' as const,
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
    zIndex: 2,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  filterContainer: {
    position: 'relative' as const,
    zIndex: 3,
  },
  filterButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  filterDropdown: {
    position: 'absolute' as const,
    top: 44,
    right: 0,
    borderRadius: 12,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 9999,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filterOptionText: {
    fontSize: 15,
  },
  filterOptionTextActive: {
    fontWeight: '700' as const,
  },
  orderCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    zIndex: 0,
    gap: 10,
  },
  orderHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  orderId: {
    fontSize: 17,
    fontWeight: '700' as const,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  orderActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  orderActionButton: {
    padding: 8,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    gap: 8,
  },
  routeInfo: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  routeLabel: {
    fontSize: 14,
  },
  routeValue: {
    fontSize: 14,
    fontWeight: '600' as const,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  customPeriodContainer: { gap: 12 },
  dateInputContainer: { gap: 6 },
  dateLabel: { fontSize: 12 },
  dateInput: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
  dateInputText: { fontSize: 15, fontWeight: '600' as const },
  customPeriodActions: { flexDirection: 'row' as const, gap: 10, marginTop: 16 },
  customPeriodButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' as const },
  customPeriodButtonText: { fontSize: 15, fontWeight: '700' as const },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  edoListModal: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    padding: 20,
  },
  periodOptions: { gap: 12 },
  periodOption: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14 },
  periodOptionText: { fontSize: 16, fontWeight: '700' as const },
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

  /* Achievements Dashboard */
  achievementsDashboard: {
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    gap: 12,
  },
  achievementsHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  achievementsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  achievementsCount: {
    fontSize: 16,
    fontWeight: '800' as const,
  },
  achievementsProgressBar: {
    height: 8,
    borderRadius: 6,
    overflow: 'hidden' as const,
  },
  achievementsProgressFill: {
    height: 8,
    borderRadius: 6,
  },
  achievementsStats: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    gap: 12,
  },
  achievementsStat: {
    flex: 1,
    alignItems: 'center' as const,
    gap: 4,
  },
  achievementsStatValue: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  achievementsStatLabel: {
    fontSize: 11,
    textAlign: 'center' as const,
  },

  /* Damage Details Modal */
  damageDetailsContainer: {
    flex: 1,
  },
  damageDetailsHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  damageDetailsBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  damageDetailsTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  damageDetailsSummary: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
  },
  damageDetailsSummaryItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  damageDetailsSummaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  damageDetailsSummaryValue: {
    fontSize: 20,
    fontWeight: '800' as const,
  },
  damageDetailsSummaryLabel: {
    fontSize: 12,
  },
  damageDetailsList: {
    flex: 1,
  },
  damageDetailsListContent: {
    padding: 20,
    paddingBottom: 40,
  },
  damageDetailsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  damageDetailsCardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
  },
  damageDetailsCardId: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  damageDetailsCardDate: {
    fontSize: 13,
    marginTop: 2,
  },
  damageDetailsCardStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  damageDetailsCardStatusText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  damageDetailsCardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  damageDetailsCardFooter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  damageDetailsCardType: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  damageDetailsCardTypeLabel: {
    fontSize: 13,
  },
  damageDetailsCardTypeValue: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  damageDetailsCardAmount: {},
  damageDetailsCardAmountValue: {
    fontSize: 18,
    fontWeight: '800' as const,
  },
  damageDetailsCardButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  damageDetailsCardButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  damageDetailsEmpty: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 80,
    gap: 12,
  },
  damageDetailsEmptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginTop: 16,
  },
  damageDetailsEmptyDescription: {
    fontSize: 15,
    textAlign: 'center' as const,
  },

  /* EDO list modal item styles */
  documentCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  documentHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    gap: 12,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 14,
  },
});
