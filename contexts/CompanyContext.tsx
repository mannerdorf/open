import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Company, Order, Document, Claim, ApiPerevozka, CompanyCredentials } from '@/types';
import { createTestOrders, createTestDocuments } from '@/mocks/test-orders';
import { trpcClient } from '@/lib/trpc';

const COMPANIES_KEY = '@haulz_companies';
const SELECTED_COMPANY_KEY = '@haulz_selected_company';
const ORDERS_KEY = '@haulz_orders';
const DOCUMENTS_KEY = '@haulz_documents';

const DADATA_API_KEY = 'f74dbf67683c409cba0123fb354be553228ee89a';

export const [CompanyProvider, useCompanies] = createContextHook(() => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    loadCompanies();
    loadOrders();
    loadDocuments();
  }, []);

  useEffect(() => {
    const backfill = async () => {
      try {
        if (companies.length === 0) return;
        const needsSeed: { companyId: string; inn: string }[] = [];
        companies.forEach((c) => {
          const innClean = c.inn.replace(/\D/g, '');
          const hasAnyForCompany = orders.some((o) => o.companyId === c.id);
          const eligible = innClean === '245724573302' || innClean === '7707083893' || innClean === '390946577201' || innClean === '7736207543';
          if (!hasAnyForCompany && eligible) {
            needsSeed.push({ companyId: c.id, inn: innClean });
          }
        });
        if (needsSeed.length === 0) return;
        let updatedOrders = [...orders];
        let updatedDocs = [...documents];
        for (const item of needsSeed) {
          const genOrders = createTestOrders(item.companyId, item.inn);
          const genDocs = createTestDocuments(item.companyId, item.inn);
          if (genOrders.length > 0) {
            updatedOrders = [...updatedOrders, ...genOrders];
          }
          if (genDocs.length > 0) {
            updatedDocs = [...updatedDocs, ...genDocs];
          }
        }
        if (updatedOrders.length !== orders.length) {
          await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
          setOrders(updatedOrders);
        }
        if (updatedDocs.length !== documents.length) {
          await AsyncStorage.setItem(DOCUMENTS_KEY, JSON.stringify(updatedDocs));
          setDocuments(updatedDocs);
        }
      } catch (e) {
        console.error('Backfill seed error', e);
      }
    };
    backfill();
  }, [companies, orders, documents]);

  const loadCompanies = async () => {
    try {
      const [storedCompanies, storedSelectedId] = await Promise.all([
        AsyncStorage.getItem(COMPANIES_KEY),
        AsyncStorage.getItem(SELECTED_COMPANY_KEY),
      ]);

      if (storedCompanies && storedCompanies !== 'null' && storedCompanies !== 'undefined') {
        try {
          const parsed = JSON.parse(storedCompanies);
          if (Array.isArray(parsed)) {
            setCompanies(parsed);
          }
        } catch (parseError) {
          console.error('Failed to parse companies:', parseError);
          await AsyncStorage.removeItem(COMPANIES_KEY);
        }
      }

      if (storedSelectedId && storedSelectedId !== 'null' && storedSelectedId !== 'undefined') {
        setSelectedCompanyId(storedSelectedId);
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const storedOrders = await AsyncStorage.getItem(ORDERS_KEY);
      if (storedOrders && storedOrders !== 'null' && storedOrders !== 'undefined') {
        try {
          const parsed = JSON.parse(storedOrders);
          if (Array.isArray(parsed)) {
            setOrders(parsed);
          }
        } catch (parseError) {
          console.error('Failed to parse orders:', parseError);
          await AsyncStorage.removeItem(ORDERS_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      const storedDocuments = await AsyncStorage.getItem(DOCUMENTS_KEY);
      if (storedDocuments && storedDocuments !== 'null' && storedDocuments !== 'undefined') {
        try {
          const parsed = JSON.parse(storedDocuments);
          if (Array.isArray(parsed)) {
            setDocuments(parsed);
          }
        } catch (parseError) {
          console.error('Failed to parse documents:', parseError);
          await AsyncStorage.removeItem(DOCUMENTS_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };



  const validateINN = useCallback((inn: string): { valid: boolean; error?: string } => {
    const cleanInn = inn.replace(/\D/g, '');

    if (cleanInn.length !== 10 && cleanInn.length !== 12) {
      return { valid: false, error: 'ИНН должен содержать 10 или 12 цифр' };
    }

    const checkDigit = (inn: string, coefficients: number[]) => {
      let sum = 0;
      for (let i = 0; i < coefficients.length; i++) {
        sum += parseInt(inn[i]) * coefficients[i];
      }
      return (sum % 11) % 10;
    };

    if (cleanInn.length === 10) {
      const n10 = checkDigit(cleanInn, [2, 4, 10, 3, 5, 9, 4, 6, 8]);
      if (n10 !== parseInt(cleanInn[9])) {
        return { valid: false, error: 'Неверная контрольная сумма ИНН' };
      }
    } else if (cleanInn.length === 12) {
      const n11 = checkDigit(cleanInn, [7, 2, 4, 10, 3, 5, 9, 4, 6, 8]);
      const n12 = checkDigit(cleanInn, [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]);
      if (n11 !== parseInt(cleanInn[10]) || n12 !== parseInt(cleanInn[11])) {
        return { valid: false, error: 'Неверная контрольная сумма ИНН' };
      }
    }

    return { valid: true };
  }, []);

  const fetchCompanyByINN = useCallback(async (inn: string): Promise<{ success: boolean; name?: string; error?: string }> => {
    try {
      const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${DADATA_API_KEY}`,
        },
        body: JSON.stringify({ query: inn }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при запросе к DaData API');
      }

      const data = await response.json();

      if (data.suggestions && data.suggestions.length > 0) {
        const companyData = data.suggestions[0];
        const name = companyData.value || companyData.data?.name?.short_with_opf || companyData.data?.name?.short || 'Неизвестная компания';
        return { success: true, name };
      }

      return { success: false, error: 'Компания не найдена' };
    } catch (error) {
      console.error('DaData API error:', error);
      return { success: false, error: 'Ошибка при получении данных компании' };
    }
  }, []);

  const selectCompany = useCallback(async (companyId: string | null) => {
    console.log('Selecting company:', companyId);
    await AsyncStorage.setItem(SELECTED_COMPANY_KEY, companyId || '');
    setSelectedCompanyId(companyId);
  }, []);

  const convertApiPerevozkaToOrder = useCallback((apiData: ApiPerevozka, companyId: string): Order => {
    const parseDate = (dateStr: string): string => {
      if (!dateStr || dateStr === '*') return new Date().toISOString();
      try {
        return new Date(dateStr).toISOString();
      } catch {
        return new Date().toISOString();
      }
    };

    const mapStatus = (state: string): Order['status'] => {
      const stateLower = state.toLowerCase();
      if (stateLower.includes('доставлен')) return 'delivered';
      if (stateLower.includes('в пути') || stateLower.includes('транзит')) return 'in_transit';
      if (stateLower.includes('готов')) return 'ready_for_pickup';
      if (stateLower.includes('принят')) return 'accepted';
      return 'created';
    };

    return {
      id: `order-${apiData.Number}-${Date.now()}`,
      companyId,
      customer: {
        name: apiData.Sender || '*',
        inn: '*',
        phone: '*',
        address: '*',
      },
      sender: {
        name: apiData.Sender || '*',
        inn: '*',
        phone: '*',
        address: '*',
      },
      receiver: {
        name: '*',
        inn: '*',
        phone: '*',
        address: '*',
      },
      route: {
        from: {
          address: '*',
          city: '*',
        },
        to: {
          address: '*',
          city: '*',
        },
      },
      cargo: {
        type: 'box',
        qty: parseInt(apiData.Mest || '0') || 0,
        weightKg: parseFloat(apiData.W || '0') || 0,
        chargeableWeight: apiData.PW && apiData.PW !== '*' ? parseFloat(apiData.PW) : undefined,
        volumeM3: parseFloat(apiData.Value || '0') || 0,
        declaredValue: parseFloat(apiData.Sum || '0') || 0,
      },
      services: {
        pickup: false,
        doorDelivery: false,
        insurance: false,
        express: false,
      },
      price: {
        amount: parseFloat(apiData.Sum || '0') || 0,
        currency: 'RUB',
        breakdown: [
          {
            title: 'Стоимость перевозки',
            amount: parseFloat(apiData.Sum || '0') || 0,
          },
        ],
      },
      status: mapStatus(apiData.State || 'created'),
      eta: apiData.DateVr && apiData.DateVr !== '*' ? parseDate(apiData.DateVr) : undefined,
      plannedDeliveryDate: apiData.DateVr && apiData.DateVr !== '*' ? parseDate(apiData.DateVr) : undefined,
      createdAt: parseDate(apiData.DatePrih),
      barcode: apiData.Number || '*',
      qr: apiData.Number || '*',
      plannedLoadingDate: apiData.DatePrih && apiData.DatePrih !== '*' ? parseDate(apiData.DatePrih) : undefined,
    };
  }, []);

  const addCompanyByCredentials = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string; company?: Company; orders?: Order[] }> => {
    console.log('=== addCompanyByCredentials called ===');
    console.log('Email:', email);

    try {
      const apiUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'https://open-production.up.railway.app';
      console.log('Calling API:', `${apiUrl}/api/add-company`);
      
      const response = await fetch(`${apiUrl}/api/add-company`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      console.log('Response status:', response.status);
      
      const result = await response.json();
      console.log('API result:', result);

      if (!result.success || !result.data) {
        console.log('API request failed:', result.error);
        return { success: false, error: result.error || 'Неверный логин или пароль' };
      }

      const data: ApiPerevozka[] = result.data;
      console.log('API Response:', data);

      const newCompany: Company = {
        id: Date.now().toString(),
        inn: email,
        name: email.split('@')[0] || 'Компания',
        verified: true,
        addedAt: new Date().toISOString(),
        credentials: {
          email,
          password,
        },
      };

      console.log('New company created:', newCompany);

      const updatedCompanies = [...companies, newCompany];
      await AsyncStorage.setItem(COMPANIES_KEY, JSON.stringify(updatedCompanies));
      setCompanies(updatedCompanies);
      console.log('Companies updated');

      const newOrders = data.map(apiPerevozka => convertApiPerevozkaToOrder(apiPerevozka, newCompany.id));
      console.log('Orders created from API:', newOrders.length, 'orders');

      if (newOrders.length > 0) {
        const currentOrders = await AsyncStorage.getItem(ORDERS_KEY);
        let existingOrders: Order[] = [];
        if (currentOrders && currentOrders !== 'null' && currentOrders !== 'undefined') {
          try {
            const parsed = JSON.parse(currentOrders);
            if (Array.isArray(parsed)) {
              existingOrders = parsed;
            }
          } catch (e) {
            console.error('Failed to parse existing orders:', e);
          }
        }
        const updatedOrders = [...existingOrders, ...newOrders];
        console.log('Saving orders to AsyncStorage:', updatedOrders.length, 'total orders');
        await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
        setOrders(updatedOrders);
        console.log('Orders state updated with', updatedOrders.length, 'orders');
      }

      if (companies.length === 0) {
        console.log('First company, selecting it');
        await selectCompany(newCompany.id);
      }

      console.log('=== addCompanyByCredentials completed successfully ===');
      return { success: true, company: newCompany, orders: newOrders };
    } catch (error) {
      console.error('API Error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      return { success: false, error: 'Ошибка подключения к серверу. Проверьте, что backend запущен.' };
    }
  }, [companies, selectCompany, convertApiPerevozkaToOrder]);

  const addCompany = useCallback(async (inn: string, verificationCode: string): Promise<{ success: boolean; error?: string; company?: Company }> => {
    console.log('=== addCompany called ===');
    console.log('INN (raw):', inn);
    console.log('Verification code:', verificationCode);

    const innClean = inn.replace(/\D/g, '');
    console.log('INN (normalized):', innClean);
    
    const validation = validateINN(innClean);
    if (!validation.valid) {
      console.log('INN validation failed:', validation.error);
      return { success: false, error: validation.error };
    }

    if (verificationCode !== '111111') {
      console.log('Verification code is incorrect');
      return { success: false, error: 'Неверный код верификации' };
    }

    const existingCompany = companies.find(c => c.inn.replace(/\D/g, '') === innClean);
    if (existingCompany) {
      console.log('Company already exists');
      return { success: false, error: 'Компания уже добавлена' };
    }

    const companyData = await fetchCompanyByINN(innClean);
    if (!companyData.success) {
      console.log('Failed to fetch company data:', companyData.error);
      return { success: false, error: companyData.error };
    }

    const newCompany: Company = {
      id: Date.now().toString(),
      inn: innClean,
      name: companyData.name!,
      verified: true,
      addedAt: new Date().toISOString(),
    };

    console.log('New company created:', newCompany);

    const updatedCompanies = [...companies, newCompany];
    await AsyncStorage.setItem(COMPANIES_KEY, JSON.stringify(updatedCompanies));
    setCompanies(updatedCompanies);
    console.log('Companies updated');

    const testOrders = createTestOrders(newCompany.id, innClean);
    console.log('Test orders created:', testOrders.length, 'orders');
    console.log('Test orders:', testOrders);
    
    if (testOrders.length > 0) {
      const currentOrders = await AsyncStorage.getItem(ORDERS_KEY);
      let existingOrders: Order[] = [];
      if (currentOrders && currentOrders !== 'null' && currentOrders !== 'undefined') {
        try {
          const parsed = JSON.parse(currentOrders);
          if (Array.isArray(parsed)) {
            existingOrders = parsed;
          }
        } catch (e) {
          console.error('Failed to parse existing orders:', e);
        }
      }
      const updatedOrders = [...existingOrders, ...testOrders];
      console.log('Saving orders to AsyncStorage:', updatedOrders.length, 'total orders');
      await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
      setOrders(updatedOrders);
      console.log('Orders state updated with', updatedOrders.length, 'orders');
    }

    const testDocuments = createTestDocuments(newCompany.id, innClean);
    console.log('Test documents created:', testDocuments.length, 'documents');
    
    if (testDocuments.length > 0) {
      const currentDocuments = await AsyncStorage.getItem(DOCUMENTS_KEY);
      let existingDocuments: Document[] = [];
      if (currentDocuments && currentDocuments !== 'null' && currentDocuments !== 'undefined') {
        try {
          const parsed = JSON.parse(currentDocuments);
          if (Array.isArray(parsed)) {
            existingDocuments = parsed;
          }
        } catch (e) {
          console.error('Failed to parse existing documents:', e);
        }
      }
      const updatedDocuments = [...existingDocuments, ...testDocuments];
      console.log('Saving documents to AsyncStorage:', updatedDocuments.length, 'total documents');
      await AsyncStorage.setItem(DOCUMENTS_KEY, JSON.stringify(updatedDocuments));
      setDocuments(updatedDocuments);
      console.log('Documents state updated with', updatedDocuments.length, 'documents');
    }

    if (companies.length === 0) {
      console.log('First company, selecting it');
      await selectCompany(newCompany.id);
    }

    console.log('=== addCompany completed successfully ===');
    return { success: true, company: newCompany };
  }, [companies, validateINN, fetchCompanyByINN, selectCompany]);

  const removeCompany = useCallback(async (companyId: string) => {
    const updatedCompanies = companies.filter(c => c.id !== companyId);
    await AsyncStorage.setItem(COMPANIES_KEY, JSON.stringify(updatedCompanies));
    setCompanies(updatedCompanies);

    const updatedOrders = orders.filter(o => o.companyId !== companyId);
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
    setOrders(updatedOrders);

    const updatedDocuments = documents.filter(d => d.companyId !== companyId);
    await AsyncStorage.setItem(DOCUMENTS_KEY, JSON.stringify(updatedDocuments));
    setDocuments(updatedDocuments);

    if (selectedCompanyId === companyId) {
      const newSelectedId = updatedCompanies.length > 0 ? updatedCompanies[0].id : null;
      await selectCompany(newSelectedId);
    }

    return true;
  }, [companies, orders, documents, selectedCompanyId, selectCompany]);

  const markOrderWithClaim = useCallback(async (orderId: string, claim: Claim) => {
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, hasClaim: true, claim } : order
    );
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
    setOrders(updatedOrders);
  }, [orders]);

  const updateClaimStatus = useCallback(async (orderId: string, status: Claim['status'], response?: string) => {
    const updatedOrders = orders.map(order => {
      if (order.id === orderId && order.claim) {
        return {
          ...order,
          claim: {
            ...order.claim,
            status,
            response,
            updatedAt: new Date().toISOString(),
          },
        };
      }
      return order;
    });
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
    setOrders(updatedOrders);
  }, [orders]);

  const archiveOrder = useCallback(async (orderId: string) => {
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, status: 'delivered' as const, hasClaim: false } : order
    );
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
    setOrders(updatedOrders);
  }, [orders]);

  const createOrder = useCallback(async (order: Order): Promise<{ success: boolean; error?: string; order?: Order }> => {
    try {
      const updatedOrders = [...orders, order];
      await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
      setOrders(updatedOrders);
      console.log('Order created successfully:', order.id);
      return { success: true, order };
    } catch (error) {
      console.error('Failed to create order:', error);
      return { success: false, error: 'Не удалось создать перевозку' };
    }
  }, [orders]);

  const selectedCompany = useMemo(() => {
    return companies.find(c => c.id === selectedCompanyId) || null;
  }, [companies, selectedCompanyId]);

  const addReconciliationAct = useCallback(async (params: { label: string; from?: string; to?: string }) => {
    try {
      const companyId = selectedCompanyId ?? undefined;
      const id = `recon-${Date.now()}`;
      const nowIso = new Date().toISOString();
      const doc: any = {
        id,
        companyId,
        type: 'act',
        recon: true,
        title: `Акт сверки ${params.label}`,
        date: nowIso,
        url: '#',
        size: 0,
        documentType: 'incoming',
      };
      const updated = [...documents, doc as unknown as Document];
      await AsyncStorage.setItem(DOCUMENTS_KEY, JSON.stringify(updated));
      setDocuments(updated);
      return { success: true, id };
    } catch (e) {
      console.error('addReconciliationAct error', e);
      return { success: false, error: 'Не удалось заказать акт сверки' };
    }
  }, [documents, selectedCompanyId]);

  return useMemo(() => ({
    companies,
    selectedCompany,
    selectedCompanyId,
    isLoading,
    orders,
    documents,
    validateINN,
    fetchCompanyByINN,
    addCompany,
    addCompanyByCredentials,
    removeCompany,
    selectCompany,
    markOrderWithClaim,
    updateClaimStatus,
    archiveOrder,
    createOrder,
    addReconciliationAct,
  }), [
    companies,
    selectedCompany,
    selectedCompanyId,
    isLoading,
    orders,
    documents,
    validateINN,
    fetchCompanyByINN,
    addCompany,
    addCompanyByCredentials,
    removeCompany,
    selectCompany,
    markOrderWithClaim,
    updateClaimStatus,
    archiveOrder,
    createOrder,
    addReconciliationAct,
  ]);
});
