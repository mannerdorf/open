import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput, Share, Modal, Pressable, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileText, CheckCircle, Clock, AlertCircle, Search, Building2, Share2, CreditCard, ChevronDown, ChevronUp, Download, Check } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useThemeColors } from '@/constants/colors';
import { useCompanies } from '@/contexts/CompanyContext';
import { useMemo, useState, useEffect } from 'react';

export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const Colors = useThemeColors();
  const router = useRouter();
  const { documents, selectedCompanyId, companies, orders, addReconciliationAct, selectCompany } = useCompanies();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [showCompanySelector, setShowCompanySelector] = useState(false);

  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customDateVisible, setCustomDateVisible] = useState(false);
  const [customDateInput, setCustomDateInput] = useState('');
  const [docSection, setDocSection] = useState<'contracts' | 'invoices' | 'recon' | 'poa'>('invoices');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');
  const params = useLocalSearchParams();

  useEffect(() => {
    const filterParam = params?.filter;
    const filterValue = Array.isArray(filterParam) ? filterParam[0] : filterParam;
    if (filterValue === 'unpaid' || filterValue === 'paid' || filterValue === 'overdue') {
      setStatusFilter(filterValue);
      setDocSection('invoices');
    }
    
    const edoFilterParam = params?.edoFilter;
    const edoFilterValue = Array.isArray(edoFilterParam) ? edoFilterParam[0] : edoFilterParam;
    if (edoFilterValue === 'pending' || edoFilterValue === 'signed' || edoFilterValue === 'voided' || edoFilterValue === 'rejected') {
      setEdoFilter(edoFilterValue as EdoSignStatus);
    }
  }, [params]);

  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null);
  const [reconOrderNotice, setReconOrderNotice] = useState<string>('');

  const syntheticContracts = useMemo(() => {
    const base: typeof documents[number][] = [
      {
        id: 'contract-mock-1',
        companyId: selectedCompanyId ?? undefined,
        type: 'contract',
        title: 'Договор №C-TEST/01 от 01.10.2025',
        date: '2025-10-01T09:00:00Z',
        url: 'https://images.unsplash.com/photo-1529078155058-5d716f45d604?w=1200',
        size: 150000,
        documentType: 'incoming',
      } as any,
      {
        id: 'contract-mock-2',
        companyId: selectedCompanyId ?? undefined,
        type: 'contract',
        title: 'Договор №C-TEST/02 от 03.10.2025',
        date: '2025-10-03T10:00:00Z',
        url: 'https://images.unsplash.com/photo-1554224155-1696413565d3?w=1200',
        size: 210000,
        documentType: 'incoming',
      } as any,
    ];
    return base;
  }, [selectedCompanyId, documents.length]);

  const syntheticRecon = useMemo(() => {
    const base: typeof documents[number][] = [
      {
        id: 'recon-mock-1',
        companyId: selectedCompanyId ?? undefined,
        type: 'act',
        title: 'Акт сверки №AS-TEST/09 от 30.09.2025',
        date: '2025-09-30T12:00:00Z',
        url: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200',
        size: 130000,
        documentType: 'incoming',
      } as any,
    ];
    return base;
  }, [selectedCompanyId, documents.length]);

  const syntheticPoa = useMemo(() => {
    const base: typeof documents[number][] = [
      {
        id: 'poa-mock-1',
        companyId: selectedCompanyId ?? undefined,
        type: 'poa',
        title: 'Доверенность №D-001 от 02.10.2025',
        date: '2025-10-02T10:00:00Z',
        url: 'https://images.unsplash.com/photo-1516382799247-87df95d790b2?w=1200',
        size: 90000,
        documentType: 'incoming',
      } as any,
    ];
    return base;
  }, [selectedCompanyId, documents.length]);


  useEffect(() => {
    const raw = params?.search;
    const initial = Array.isArray(raw) ? raw[0] : raw;
    if (typeof initial === 'string') {
      setSearch(initial);
    }
  }, []);

  type EdoType = 'ER' | 'UPD' | 'APP' | 'RECON';
  type EdoSignStatus = 'signed' | 'pending' | 'voided' | 'rejected';
  const [edoFilter, setEdoFilter] = useState<'all' | EdoSignStatus>('all');

  const hashString = (s: string): number => {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h << 5) - h + s.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  };

  const getEdoType = (doc: typeof documents[number]): EdoType => {
    if ((doc as any).recon === true || /акт\s+сверки/i.test(doc.title)) return 'RECON';
    if (doc.type === 'invoice') return 'UPD';
    if (doc.type === 'act') return 'APP';
    if ((doc as any).type === 'reconciliation') return 'RECON';
    return 'ER';
  };

  const getEdoStatus = (doc: typeof documents[number]): EdoSignStatus => {
    const h = hashString(doc.id);
    if (doc.type === 'invoice') {
      return doc.status === 'paid' ? 'signed' : (h % 2 === 0 ? 'pending' : 'rejected');
    }
    const mod = h % 4;
    if (mod === 0) return 'signed';
    if (mod === 1) return 'pending';
    if (mod === 2) return 'voided';
    return 'rejected';
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      if (selectedCompanyId && doc.companyId !== selectedCompanyId) {
        return false;
      }
      if (search && !doc.title.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (statusFilter !== 'all' && doc.status !== statusFilter) {
        return false;
      }
      if (edoFilter !== 'all') {
        const es = getEdoStatus(doc);
        if (es !== edoFilter) return false;
      }
      if (dateFilter !== 'all') {
        const docDate = new Date(doc.date);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (dateFilter === 'today') {
          const docDay = new Date(docDate.getFullYear(), docDate.getMonth(), docDate.getDate());
          if (docDay.getTime() !== today.getTime()) return false;
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          if (docDate < weekAgo) return false;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          if (docDate < monthAgo) return false;
        }
      }
      if (docSection === 'contracts') {
        return doc.type === 'contract';
      }
      if (docSection === 'invoices') {
        return doc.type === 'invoice';
      }
      if (docSection === 'recon') {
        return getEdoType(doc) === 'RECON';
      }
      if (docSection === 'poa') {
        return (doc as any).type === 'poa' || /доверенн/i.test(doc.title);
      }
      return true;
    });
  }, [documents, selectedCompanyId, search, statusFilter, edoFilter, dateFilter, docSection]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const [orderReconVisible, setOrderReconVisible] = useState<boolean>(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('За месяц');
  const [customPeriod, setCustomPeriod] = useState<string>('');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatAmount = (amount?: number, currency?: string) => {
    if (!amount) return '';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency || 'RUB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusIcon = (status?: 'paid' | 'unpaid' | 'overdue') => {
    switch (status) {
      case 'paid':
        return <CheckCircle size={20} color={Colors.success} />;
      case 'overdue':
        return <AlertCircle size={20} color={Colors.error} />;
      case 'unpaid':
      default:
        return <Clock size={20} color={Colors.warning} />;
    }
  };

  const getStatusText = (status?: 'paid' | 'unpaid' | 'overdue') => {
    switch (status) {
      case 'paid':
        return 'Оплачен';
      case 'overdue':
        return 'Просрочен';
      case 'unpaid':
      default:
        return 'Не оплачен';
    }
  };

  const getStatusColor = (status?: 'paid' | 'unpaid' | 'overdue') => {
    switch (status) {
      case 'paid':
        return Colors.success;
      case 'overdue':
        return Colors.error;
      case 'unpaid':
      default:
        return Colors.warning;
    }
  };

  const handleShare = async (doc: typeof documents[0], e: any) => {
    e.stopPropagation();
    try {
      await Share.share({
        message: `${doc.title}\nДата: ${formatDate(doc.date)}${doc.amount ? `\nСумма: ${formatAmount(doc.amount, doc.currency)}` : ''}`,
        title: doc.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handlePay = (docId: string, e: any) => {
    e.stopPropagation();
    setSelectedInvoiceId(docId);
    setShowPaymentModal(true);
  };

  const toggleExpand = (docId: string, e: any) => {
    e.stopPropagation();
    setExpandedDocs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20, backgroundColor: Colors.surface1 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            testID="documents-company-badge"
            onLongPress={() => setShowCompanySelector(true)}
            activeOpacity={0.8}
            style={[styles.companyBadge, { backgroundColor: Colors.surface2 }]}
          >
            <Building2 size={18} color={Colors.primary} />
            <Text 
              style={[
                styles.companyBadgeText, 
                { color: Colors.text },
                { fontSize: (companies.find(c => c.id === selectedCompanyId)?.name?.length ?? 0) > 20 ? 12 : 14 }
              ]} 
              numberOfLines={1}
            >
              {companies.find(c => c.id === selectedCompanyId)?.name ?? 'Выберите компанию'}
            </Text>
          </TouchableOpacity>

          {searchExpanded ? (
            <View style={[styles.searchField, { backgroundColor: Colors.surface2, flex: 1 }]}>
              <Search size={18} color={Colors.textSecondary} />
              <TextInput
                testID="documents-search"
                style={[styles.searchInput, { color: Colors.text }]}
                value={search}
                onChangeText={(text) => {
                  setSearch(text);
                  const q = text.trim().toLowerCase();
                  if (!q) return;
                  const docsMatch = documents.some(d => d.title.toLowerCase().includes(q));
                  const ordersMatch = orders.some(o => {
                    const from = o.route?.from?.city?.toLowerCase() ?? '';
                    const to = o.route?.to?.city?.toLowerCase() ?? '';
                    return o.id.toLowerCase().includes(q) || from.includes(q) || to.includes(q);
                  });
                  if (!docsMatch && ordersMatch) {
                    router.push({ pathname: '/(tabs)/orders', params: { search: text } });
                  }
                }}
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
              testID="documents-search-button"
              accessibilityLabel="Поиск"
              onPress={() => setSearchExpanded(true)}
              style={styles.headerIconButton}
            >
              <Search size={22} color={Colors.text} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filtersRow}>
          <View style={styles.sectionGroup}>
            <Text style={[styles.sectionLabel, { color: Colors.textSecondary }]}>Разделы</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionChipsScroll}>
              {([
                { key: 'contracts', label: 'Договоры' },
                { key: 'invoices', label: 'Счета' },
                { key: 'recon', label: 'Акты сверок' },
                { key: 'poa', label: 'Доверенности' },
              ] as { key: 'contracts' | 'invoices' | 'recon' | 'poa'; label: string }[]).map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.sectionChip, { backgroundColor: docSection === tab.key ? Colors.primary : Colors.surface2, borderColor: docSection === tab.key ? Colors.primary : Colors.border }]}
                  onPress={() => setDocSection(tab.key)}
                >
                  <Text style={[styles.sectionChipText, { color: docSection === tab.key ? Colors.white : Colors.text }]}>{tab.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
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
                style={[styles.filterChip, { backgroundColor: statusFilter === 'all' ? Colors.primary : Colors.surface2, borderColor: Colors.border }]}
                onPress={() => setStatusFilter('all')}
              >
                <Text style={[styles.filterChipText, { color: statusFilter === 'all' ? Colors.white : Colors.text }]}>Все</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: statusFilter === 'paid' ? Colors.primary : Colors.surface2, borderColor: Colors.border }]}
                onPress={() => setStatusFilter('paid')}
              >
                <Text style={[styles.filterChipText, { color: statusFilter === 'paid' ? Colors.white : Colors.text }]}>Оплачен</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: statusFilter === 'unpaid' ? Colors.primary : Colors.surface2, borderColor: Colors.border }]}
                onPress={() => setStatusFilter('unpaid')}
              >
                <Text style={[styles.filterChipText, { color: statusFilter === 'unpaid' ? Colors.white : Colors.text }]}>Не оплачен</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: statusFilter === 'overdue' ? Colors.primary : Colors.surface2, borderColor: Colors.border }]}
                onPress={() => setStatusFilter('overdue')}
              >
                <Text style={[styles.filterChipText, { color: statusFilter === 'overdue' ? Colors.white : Colors.text }]}>Просрочен</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <View style={styles.filterGroup}>
            <Text style={[styles.filterLabel, { color: Colors.textSecondary }]}>ЭДО</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsScroll}>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: edoFilter === 'all' ? Colors.primary : Colors.surface2, borderColor: Colors.border }]}
                onPress={() => setEdoFilter('all')}
              >
                <Text style={[styles.filterChipText, { color: edoFilter === 'all' ? Colors.white : Colors.text }]}>Все</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: edoFilter === 'signed' ? Colors.primary : Colors.surface2, borderColor: Colors.border }]}
                onPress={() => setEdoFilter('signed')}
              >
                <Text style={[styles.filterChipText, { color: edoFilter === 'signed' ? Colors.white : Colors.text }]}>Подписан</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: edoFilter === 'pending' ? Colors.primary : Colors.surface2, borderColor: Colors.border }]}
                onPress={() => setEdoFilter('pending')}
              >
                <Text style={[styles.filterChipText, { color: edoFilter === 'pending' ? Colors.white : Colors.text }]}>Ожидает подписи</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: edoFilter === 'voided' ? Colors.primary : Colors.surface2, borderColor: Colors.border }]}
                onPress={() => setEdoFilter('voided')}
              >
                <Text style={[styles.filterChipText, { color: edoFilter === 'voided' ? Colors.white : Colors.text }]}>Аннулирован</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: edoFilter === 'rejected' ? Colors.primary : Colors.surface2, borderColor: Colors.border }]}
                onPress={() => setEdoFilter('rejected')}
              >
                <Text style={[styles.filterChipText, { color: edoFilter === 'rejected' ? Colors.white : Colors.text }]}>Отказано в подписи</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {docSection === 'recon' && (
          <View style={{ marginBottom: 12 }}>
            <TouchableOpacity
              testID="order-recon-button"
              style={[styles.orderReconButton, { backgroundColor: Colors.primary }]}
              onPress={() => setOrderReconVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.orderReconButtonText, { color: Colors.white }]}>Заказать акт сверки</Text>
            </TouchableOpacity>
          </View>
        )}
        {reconOrderNotice ? (
          <View style={[styles.noticeBar, { backgroundColor: Colors.surface2, borderColor: Colors.border }]}>
            <Text style={{ color: Colors.text }}>{reconOrderNotice}</Text>
          </View>
        ) : null}
        <Text style={[styles.filterLabel, { color: Colors.textSecondary, marginBottom: 8 }]}>Список: {docSection === 'contracts' ? 'Договоры' : docSection === 'invoices' ? 'Счета' : docSection === 'recon' ? 'Акты сверок' : 'Доверенности'}</Text>
        {(filteredDocuments.length === 0 && (docSection === 'contracts' || docSection === 'recon' || docSection === 'poa')) ? (
          <View style={styles.emptyState}>
            <FileText size={64} color={Colors.textSecondary} />
            <Text style={[styles.emptyText, { color: Colors.text }]}>Нет документов</Text>
            <Text style={[styles.emptySubtext, { color: Colors.textSecondary }]}>Здесь будут отображаться все ваши документы
            </Text>
            {docSection === 'contracts' && (
              (syntheticContracts).map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  style={[styles.documentCard, { backgroundColor: Colors.surface1, marginTop: 12 }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (doc.url) {
                      setPreviewDoc({ title: doc.title, url: doc.url });
                      setPreviewVisible(true);
                    }
                  }}
                >
                  <View style={styles.documentHeader}>
                    <View style={[styles.documentIcon, { backgroundColor: Colors.surface2 }]}>
                      <FileText size={24} color={Colors.primary} />
                    </View>
                    <View style={styles.documentInfo}>
                      <Text style={[styles.documentTitle, { color: Colors.text }]}>{doc.title}</Text>
                      <Text style={[styles.documentDate, { color: Colors.textSecondary }]}>
                        {formatDate(doc.date)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.documentFooter}>
                    <View style={styles.statusContainer}>
                      {(() => {
                        const s = getEdoStatus(doc);
                        if (s === 'signed') return <CheckCircle size={20} color={Colors.success} />;
                        if (s === 'pending') return <Clock size={20} color={Colors.warning} />;
                        return <AlertCircle size={20} color={Colors.error} />;
                      })()}
                      <Text style={[styles.statusText, { color: (() => {
                        const s = getEdoStatus(doc);
                        if (s === 'signed') return Colors.success;
                        if (s === 'pending') return Colors.warning;
                        return Colors.error;
                      })() }]}>ЭДО: {(() => {
                        const s = getEdoStatus(doc);
                        if (s === 'signed') return 'Подписан';
                        if (s === 'pending') return 'Ожидает подписи';
                        if (s === 'voided') return 'Аннулирован';
                        return 'Отказано в подписи';
                      })()}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
            {docSection === 'recon' && (
              (syntheticRecon).map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  style={[styles.documentCard, { backgroundColor: Colors.surface1, marginTop: 12 }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (doc.url) {
                      setPreviewDoc({ title: doc.title, url: doc.url });
                      setPreviewVisible(true);
                    }
                  }}
                >
                  <View style={styles.documentHeader}>
                    <View style={[styles.documentIcon, { backgroundColor: Colors.surface2 }]}>
                      <FileText size={24} color={Colors.primary} />
                    </View>
                    <View style={styles.documentInfo}>
                      <Text style={[styles.documentTitle, { color: Colors.text }]}>{doc.title}</Text>
                      <Text style={[styles.documentDate, { color: Colors.textSecondary }]}>{formatDate(doc.date)}</Text>
                    </View>
                  </View>
                  <View style={styles.documentFooter}>
                    <View style={styles.statusContainer}>
                      {(() => {
                        const s = getEdoStatus(doc);
                        if (s === 'signed') return <CheckCircle size={20} color={Colors.success} />;
                        if (s === 'pending') return <Clock size={20} color={Colors.warning} />;
                        return <AlertCircle size={20} color={Colors.error} />;
                      })()}
                      <Text style={[styles.statusText, { color: (() => {
                        const s = getEdoStatus(doc);
                        if (s === 'signed') return Colors.success;
                        if (s === 'pending') return Colors.warning;
                        return Colors.error;
                      })() }]}>ЭДО: {(() => {
                        const s = getEdoStatus(doc);
                        if (s === 'signed') return 'Подписан';
                        if (s === 'pending') return 'Ожидает подписи';
                        if (s === 'voided') return 'Аннулирован';
                        return 'Отказано в подписи';
                      })()}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
            {docSection === 'poa' && (
              (syntheticPoa).map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  style={[styles.documentCard, { backgroundColor: Colors.surface1, marginTop: 12 }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (doc.url) {
                      setPreviewDoc({ title: doc.title, url: doc.url });
                      setPreviewVisible(true);
                    }
                  }}
                >
                  <View style={styles.documentHeader}>
                    <View style={[styles.documentIcon, { backgroundColor: Colors.surface2 }]}>
                      <FileText size={24} color={Colors.primary} />
                    </View>
                    <View style={styles.documentInfo}>
                      <Text style={[styles.documentTitle, { color: Colors.text }]}>{doc.title}</Text>
                      <Text style={[styles.documentDate, { color: Colors.textSecondary }]}>{formatDate(doc.date)}</Text>
                    </View>
                  </View>
                  <View style={styles.documentFooter}>
                    <View style={styles.statusContainer}>
                      {(() => {
                        const s = getEdoStatus(doc);
                        if (s === 'signed') return <CheckCircle size={20} color={Colors.success} />;
                        if (s === 'pending') return <Clock size={20} color={Colors.warning} />;
                        return <AlertCircle size={20} color={Colors.error} />;
                      })()}
                      <Text style={[styles.statusText, { color: (() => {
                        const s = getEdoStatus(doc);
                        if (s === 'signed') return Colors.success;
                        if (s === 'pending') return Colors.warning;
                        return Colors.error;
                      })() }]}>ЭДО: {(() => {
                        const s = getEdoStatus(doc);
                        if (s === 'signed') return 'Подписан';
                        if (s === 'pending') return 'Ожидает подписи';
                        if (s === 'voided') return 'Аннулирован';
                        return 'Отказано в подписи';
                      })()}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : (
          filteredDocuments.map((doc) => {
            const isInvoice = doc.type === 'invoice';
            const isExpanded = expandedDocs.has(doc.id);
            return (
              <TouchableOpacity
                key={doc.id}
                style={[styles.documentCard, { backgroundColor: Colors.surface1 }]}
                activeOpacity={0.7}
                onPress={() => {
                  if (isInvoice) {
                    router.push(`/document/invoice/${doc.orderId || doc.id}`);
                  } else {
                    if (doc.url) {
                      setPreviewDoc({ title: doc.title, url: doc.url });
                      setPreviewVisible(true);
                    }
                  }
                }}
              >
                <View style={styles.documentHeader}>
                  <View style={[styles.documentIcon, { backgroundColor: Colors.surface2 }]}>
                    <FileText size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.documentInfo}>
                    <Text style={[styles.documentTitle, { color: Colors.text }]}>{doc.title}</Text>
                    <Text style={[styles.documentDate, { color: Colors.textSecondary }]}>{formatDate(doc.date)}
                    </Text>
                  </View>
                  {isInvoice && (
                    <TouchableOpacity
                      onPress={(e) => handleShare(doc, e)}
                      style={styles.iconButton}
                    >
                      <Share2 size={20} color={Colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>

                {doc.amount && (
                  <TouchableOpacity
                    style={styles.documentAmount}
                    onPress={(e) => isInvoice ? toggleExpand(doc.id, e) : undefined}
                    disabled={!isInvoice}
                  >
                    <View style={styles.amountRow}>
                      <Text style={[styles.amountLabel, { color: Colors.textSecondary }]}>Сумма:</Text>
                      <Text style={[styles.amountValue, { color: Colors.text }]}>{formatAmount(doc.amount, doc.currency)}
                      </Text>
                    </View>
                    {isInvoice && (
                      isExpanded ? <ChevronUp size={20} color={Colors.textSecondary} /> : <ChevronDown size={20} color={Colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                )}

                {isInvoice && doc.plannedPaymentDate && (
                  <View style={styles.documentAmount}>
                    <View style={styles.amountRow}>
                      <Text style={[styles.amountLabel, { color: Colors.textSecondary }]}>Плановая дата оплаты:</Text>
                      <Text style={[styles.amountValue, { color: Colors.text, fontSize: 14 }]}>{formatDate(doc.plannedPaymentDate)}
                      </Text>
                    </View>
                  </View>
                )}

                {isInvoice && isExpanded && (
                  <View style={[styles.invoiceDetails, { backgroundColor: Colors.surface2 }]}>
                    <Text style={[styles.detailsTitle, { color: Colors.text }]}>Номенклатура</Text>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: Colors.textSecondary }]}>Транспортные услуги</Text>
                      <Text style={[styles.detailValue, { color: Colors.text }]}>50 000 ₽</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: Colors.textSecondary }]}>Погрузочные работы</Text>
                      <Text style={[styles.detailValue, { color: Colors.text }]}>5 000 ₽</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: Colors.textSecondary }]}>НДС (20%)</Text>
                      <Text style={[styles.detailValue, { color: Colors.text }]}>11 600 ₽</Text>
                    </View>
                  </View>
                )}

                <View style={styles.documentFooter}>
                  {docSection === 'recon' || docSection === 'contracts' ? (
                    <View style={styles.statusContainer}>
                      {(() => {
                        const s = getEdoStatus(doc);
                        if (s === 'signed') return <CheckCircle size={20} color={Colors.success} />;
                        if (s === 'pending') return <Clock size={20} color={Colors.warning} />;
                        return <AlertCircle size={20} color={Colors.error} />;
                      })()}
                      <Text style={[styles.statusText, { color: (() => {
                        const s = getEdoStatus(doc);
                        if (s === 'signed') return Colors.success;
                        if (s === 'pending') return Colors.warning;
                        return Colors.error;
                      })() }]}>ЭДО: {(() => {
                        const s = getEdoStatus(doc);
                        if (s === 'signed') return 'Подписан';
                        if (s === 'pending') return 'Ожидает подписи';
                        if (s === 'voided') return 'Аннулирован';
                        return 'Отказано в подписи';
                      })()}</Text>
                    </View>
                  ) : (
                    <View style={styles.statusContainer}>
                      {getStatusIcon(doc.status)}
                      <Text style={[styles.statusText, { color: getStatusColor(doc.status) }]}>{getStatusText(doc.status)}
                      </Text>
                    </View>
                  )}
                  {isInvoice && doc.status !== 'paid' && (
                    <TouchableOpacity
                      style={[styles.payButton, { backgroundColor: Colors.primary }]}
                      onPress={(e) => handlePay(doc.id, e)}
                    >
                      <CreditCard size={16} color={Colors.white} />
                      <Text style={[styles.payText, { color: Colors.white }]}>Оплатить</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
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
            <Text style={[styles.modalSubtitle, { color: Colors.textSecondary }]}>Счет №{selectedInvoiceId}
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

      <Modal
        visible={orderReconVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOrderReconVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setOrderReconVisible(false)}>
          <View style={[styles.edoListModal, { backgroundColor: Colors.surface1 }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalTitle, { color: Colors.text }]}>Выбор периода</Text>
            <View style={{ gap: 8, marginBottom: 8 }}>
              <Text style={{ color: Colors.textSecondary }}>Свободный ввод периода</Text>
              <View style={[styles.searchField, { backgroundColor: Colors.surface2 }]}> 
                <TextInput
                  value={customPeriod}
                  onChangeText={setCustomPeriod}
                  placeholder="Например: 01.09.2025–30.09.2025"
                  placeholderTextColor={Colors.textSecondary}
                  style={[styles.searchInput, { color: Colors.text }]}
                />
              </View>
            </View>
            {(['За неделю','За месяц','За квартал','За год','Прошлый месяц'] as string[]).map((p) => (
              <TouchableOpacity
                key={p}
                testID={`period-${p}`}
                style={[styles.periodItem, { backgroundColor: selectedPeriod === p ? Colors.primary : Colors.surface2 }]}
                onPress={() => setSelectedPeriod(p)}
              >
                <Text style={[styles.periodItemText, { color: selectedPeriod === p ? Colors.white : Colors.text }]}>{p}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              testID="confirm-recon-period"
              style={[styles.cancelButton, { backgroundColor: Colors.primary }]}
              onPress={async () => {
                const label = (customPeriod && customPeriod.trim().length > 0) ? customPeriod.trim() : selectedPeriod;
                try {
                  await addReconciliationAct({ label });
                  setReconOrderNotice('Акт сверки заказан и будет выгружен в ближайшее время');
                  setTimeout(() => setReconOrderNotice(''), 4000);
                } catch (e) {
                  console.log('order recon error', e);
                }
                setOrderReconVisible(false);
                setCustomPeriod('');
              }}
            >
              <Text style={[styles.cancelButtonText, { color: Colors.white }]}>Заказать</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cancelButton, { backgroundColor: Colors.surface2 }]} onPress={() => setOrderReconVisible(false)}>
              <Text style={[styles.cancelButtonText, { color: Colors.text }]}>Отмена</Text>
            </TouchableOpacity>
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
          <View style={[styles.edoListModal, { backgroundColor: Colors.surface1 }]}
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

      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={styles.imageModalOverlay}>
          <View style={[styles.imageModalContent, { backgroundColor: Colors.background }]}>
            <View style={styles.imageHeader}>
              <Text style={[styles.imageTitle, { color: Colors.text }]}>{previewDoc?.title ?? 'Документ'}</Text>
              <TouchableOpacity onPress={() => setPreviewVisible(false)}>
                <Text style={[styles.closeButton, { color: Colors.primary }]}>Закрыть</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.imageScroll} contentContainerStyle={styles.imageScrollContent}>
              {previewDoc?.url ? (
                <Image source={{ uri: previewDoc.url }} style={styles.invoiceImage} resizeMode="contain" />
              ) : null}
            </ScrollView>
            <View style={[styles.imageActions, { backgroundColor: Colors.surface1, borderTopColor: Colors.border }]}>
              <TouchableOpacity
                style={[styles.imageActionButton, { backgroundColor: Colors.surface2 }]}
                onPress={async () => {
                  try {
                    await Share.share({
                      message: previewDoc?.title ?? 'Документ',
                      url: previewDoc?.url,
                      title: previewDoc?.title ?? 'Документ',
                    } as any);
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
                  try {
                    if (Platform.OS === 'web') {
                      const a = document.createElement('a');
                      a.href = previewDoc?.url ?? '#';
                      a.download = '';
                      a.target = '_blank';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    } else {
                      Share.share({ url: previewDoc?.url, message: previewDoc?.title ?? 'Документ' } as any);
                    }
                  } catch (e) {
                    console.log('Download error', e);
                  }
                }}
              >
                <Download size={20} color={Colors.primary} />
                <Text style={[styles.imageActionText, { color: Colors.text }]}>Скачать</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCompanySelector}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompanySelector(false)}
      >
        <Pressable 
          style={styles.companySelectorOverlay}
          onPress={() => setShowCompanySelector(false)}
        >
          <View style={[styles.companySelectorContent, { backgroundColor: Colors.surface1 }]}>
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
  },
  companyBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    maxWidth: '60%',
  },
  companyBadgeText: {
    fontWeight: '600' as const,
  },
  searchField: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  headerIconButton: {
    padding: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 15,
  },
  chipsRow: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  filtersRow: {
    gap: 16,
    marginTop: 12,
  },
  sectionGroup: {
    gap: 10,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700' as const,
    paddingHorizontal: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  sectionChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  sectionChipText: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  sectionChipsScroll: {
    gap: 10,
    paddingRight: 16,
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 60,
    gap: 12,
  },
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
  documentAmount: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    paddingVertical: 8,
  },
  amountRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  amountLabel: {
    fontSize: 14,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  documentFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  statusContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  payButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  payText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  iconButton: {
    padding: 8,
  },
  invoiceDetails: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500' as const,
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
  edoListModal: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 20,
    padding: 16,
    margin: 20,
  },
  emptyText: {
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
  edoCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  edoHeaderRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  edoTitleWrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  edoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  edoLegend: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  edoSummaryRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
  },
  edoSummaryItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  edoSummaryLabel: {
    fontSize: 12,
  },
  edoSummaryValue: {
    fontSize: 20,
    fontWeight: '800' as const,
  },
  edoGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  edoTile: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  tileHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8,
  },
  tileIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  tileTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  tileRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 4,
  },
  tileLabel: {
    fontSize: 12,
  },
  tileValue: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  noticeBar: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  orderReconButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  orderReconButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  periodItem: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  periodItemText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)'
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
  companySelectorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  companySelectorContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    maxHeight: '80%',
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
});
