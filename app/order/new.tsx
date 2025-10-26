import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Modal, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useCallback, useRef } from 'react';
import { MapPin, Package, Calendar as CalendarIcon, User, Building2, ChevronDown } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Colors from '@/constants/colors';
import { useCompanies } from '@/contexts/CompanyContext';
import type { Order } from '@/types';

interface AddressSuggestion {
  value: string;
  unrestricted_value: string;
  data: {
    city?: string;
    street?: string;
    house?: string;
    postal_code?: string;
    region?: string;
    area?: string;
    settlement?: string;
  };
}

interface AddressInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  onSelectAddress: (address: AddressSuggestion) => void;
}

function AddressInput({ value, onChangeText, placeholder, onSelectAddress }: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAddressSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Token f74dbf67683c409cba0123fb354be553228ee89a',
        },
        body: JSON.stringify({
          query,
          count: 10,
          from_bound: { value: 'city' },
          to_bound: { value: 'house' },
        }),
      });

      const data = await response.json();
      console.log('DaData address suggestions:', data);
      setSuggestions(data.suggestions || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTextChange = useCallback((text: string) => {
    onChangeText(text);
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchAddressSuggestions(text);
    }, 300);
  }, [onChangeText, fetchAddressSuggestions]);

  const handleSelectSuggestion = useCallback((suggestion: AddressSuggestion) => {
    onChangeText(suggestion.value);
    onSelectAddress(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  }, [onChangeText, onSelectAddress]);

  return (
    <View style={styles.addressInputContainer}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          value={value}
          onChangeText={handleTextChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {loading && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}
      </View>
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `${item.value}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelectSuggestion(item)}
              >
                <Text style={styles.suggestionText} numberOfLines={2}>
                  {item.value}
                </Text>
              </TouchableOpacity>
            )}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
}

const WORKING_HOURS_OPTIONS = [
  'Пн-Пт 9:00-18:00',
  'Пн-Пт 8:00-17:00',
  'Пн-Пт 10:00-19:00',
  'Пн-Сб 9:00-18:00',
  'Пн-Сб 8:00-20:00',
  'Пн-Вс 8:00-22:00',
  'Круглосуточно',
  '24/7',
];

export default function NewOrderScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { companies, selectedCompanyId, fetchCompanyByINN, createOrder } = useCompanies();
  const [step, setStep] = useState(1);
  
  const [selectedCompany, setSelectedCompany] = useState<string>(selectedCompanyId || '');
  const [customerName, setCustomerName] = useState('');
  const [customerInn, setCustomerInn] = useState('');
  const [customerPhone] = useState('');
  const [customerAddress] = useState('');
  const [transportationType, setTransportationType] = useState<'auto' | 'ferry'>('auto');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  
  const [senderInn, setSenderInn] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [senderWorkingHours, setSenderWorkingHours] = useState('');
  const [showSenderHoursDropdown, setShowSenderHoursDropdown] = useState(false);
  const [loadingSenderCompany, setLoadingSenderCompany] = useState(false);
  
  const [receiverInn, setReceiverInn] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [receiverWorkingHours, setReceiverWorkingHours] = useState('');
  const [showReceiverHoursDropdown, setShowReceiverHoursDropdown] = useState(false);

  const [loadingReceiverCompany, setLoadingReceiverCompany] = useState(false);
  
  const [fromCity, setFromCity] = useState('');
  const [fromAddressShort, setFromAddressShort] = useState('');
  const [toCity, setToCity] = useState('');
  const [toAddressShort, setToAddressShort] = useState('');
  
  const [cargoType, setCargoType] = useState<'pallet' | 'box' | 'envelope' | 'other'>('pallet');
  const [cargoQty, setCargoQty] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [cargoVolume, setCargoVolume] = useState('');
  const [cargoDeclaredValue, setCargoDeclaredValue] = useState('');
  const [cargoDescription, setCargoDescription] = useState('');
  const [cargoLength, setCargoLength] = useState('');
  const [cargoWidth, setCargoWidth] = useState('');
  const [cargoHeight, setCargoHeight] = useState('');
  
  const [servicePickup, setServicePickup] = useState(false);
  const [serviceDoorDelivery, setServiceDoorDelivery] = useState(false);
  
  const [plannedLoadingDate, setPlannedLoadingDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const handleCompanySelect = useCallback((companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setSelectedCompany(companyId);
      setCustomerName(company.name);
      setCustomerInn(company.inn);
    }
    setShowCompanyDropdown(false);
  }, [companies]);

  const handleSenderInnChange = useCallback(async (inn: string) => {
    setSenderInn(inn);
    const cleanInn = inn.replace(/\D/g, '');
    
    if (cleanInn.length === 10 || cleanInn.length === 12) {
      setLoadingSenderCompany(true);
      const result = await fetchCompanyByINN(cleanInn);
      setLoadingSenderCompany(false);
      
      if (result.success && result.name) {
        setSenderName(result.name);
      }
    }
  }, [fetchCompanyByINN]);

  const handleReceiverInnChange = useCallback(async (inn: string) => {
    setReceiverInn(inn);
    const cleanInn = inn.replace(/\D/g, '');
    
    if (cleanInn.length === 10 || cleanInn.length === 12) {
      setLoadingReceiverCompany(true);
      const result = await fetchCompanyByINN(cleanInn);
      setLoadingReceiverCompany(false);
      
      if (result.success && result.name) {
        setReceiverName(result.name);
      }
    }
  }, [fetchCompanyByINN]);

  const handleCreateOrder = useCallback(async () => {
    const dimensions = [cargoLength, cargoWidth, cargoHeight].filter(d => d).join('*');
    
    const newOrder: Order = {
      id: `HZ-2025-${String(Date.now()).slice(-6)}`,
      companyId: selectedCompany,
      customer: {
        name: customerName,
        inn: customerInn,
        phone: customerPhone,
        address: customerAddress,
        transportationType,
      },
      sender: {
        name: senderName,
        inn: senderInn,
        phone: senderPhone,
        address: senderAddress,
        workingHours: senderWorkingHours,
      },
      receiver: {
        name: receiverName,
        inn: receiverInn,
        phone: receiverPhone,
        address: receiverAddress,
        workingHours: receiverWorkingHours,
      },
      route: {
        from: { city: fromCity, address: fromAddressShort },
        to: { city: toCity, address: toAddressShort },
      },
      cargo: {
        type: cargoType,
        qty: parseInt(cargoQty) || 0,
        weightKg: parseFloat(cargoWeight) || 0,
        volumeM3: parseFloat(cargoVolume) || 0,
        declaredValue: parseFloat(cargoDeclaredValue) || 0,
        description: cargoDescription,
        dimensions,
      },
      services: {
        pickup: servicePickup,
        doorDelivery: serviceDoorDelivery,
        insurance: false,
        express: false,
      },
      price: {
        amount: 0,
        currency: 'RUB',
        breakdown: [],
      },
      status: 'created',
      createdAt: new Date().toISOString(),
      barcode: `HZ2025${String(Date.now()).slice(-6)}`,
      qr: `haulz://track/HZ-2025-${String(Date.now()).slice(-6)}`,
      plannedLoadingDate,
      tracking: {
        checkpoints: [
          {
            ts: new Date().toISOString(),
            status: 'created',
            title: 'Создана',
          },
        ],
      },
    };

    const result = await createOrder(newOrder);
    
    if (result.success) {
      Alert.alert('Успешно', `Перевозка ${newOrder.id} создана`, [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } else {
      Alert.alert('Ошибка', result.error || 'Не удалось создать перевозку');
    }
  }, [
    selectedCompany, customerName, customerInn, customerPhone, customerAddress, transportationType,
    senderName, senderInn, senderPhone, senderAddress, senderWorkingHours,
    receiverName, receiverInn, receiverPhone, receiverAddress, receiverWorkingHours,
    fromCity, fromAddressShort, toCity, toAddressShort,
    cargoType, cargoQty, cargoWeight, cargoVolume, cargoDeclaredValue, cargoDescription,
    cargoLength, cargoWidth, cargoHeight,
    servicePickup, serviceDoorDelivery,
    plannedLoadingDate,
    createOrder, router,
  ]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.progressBar}>
          <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]} />
          <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]} />
          <View style={[styles.progressStep, step >= 3 && styles.progressStepActive]} />
          <View style={[styles.progressStep, step >= 4 && styles.progressStepActive]} />
          <View style={[styles.progressStep, step >= 5 && styles.progressStepActive]} />
          <View style={[styles.progressStep, step >= 6 && styles.progressStepActive]} />
        </View>

        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Building2 size={24} color={Colors.primary} />
              <Text style={styles.stepTitle}>Заказчик</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Название организации</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowCompanyDropdown(true)}
              >
                <Text style={[styles.dropdownButtonText, !customerName && styles.dropdownPlaceholder]}>
                  {customerName || 'Выберите компанию'}
                </Text>
                <ChevronDown size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>



            <View style={styles.inputGroup}>
              <Text style={styles.label}>Тип транспортировки</Text>
              <View style={styles.cargoTypes}>
                <TouchableOpacity 
                  style={[styles.cargoType, transportationType === 'auto' && styles.cargoTypeActive]}
                  onPress={() => setTransportationType('auto')}
                >
                  <Text style={[styles.cargoTypeText, transportationType === 'auto' && styles.cargoTypeTextActive]}>Авто</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.cargoType, transportationType === 'ferry' && styles.cargoTypeActive]}
                  onPress={() => setTransportationType('ferry')}
                >
                  <Text style={[styles.cargoTypeText, transportationType === 'ferry' && styles.cargoTypeTextActive]}>Паром</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <User size={24} color={Colors.primary} />
              <Text style={styles.stepTitle}>Отправитель</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ИНН</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="1234567890"
                  placeholderTextColor={Colors.textTertiary}
                  value={senderInn}
                  onChangeText={handleSenderInnChange}
                  keyboardType="numeric"
                />
                {loadingSenderCompany && (
                  <View style={styles.loadingIndicator}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                  </View>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Название организации</Text>
              <TextInput
                style={styles.input}
                placeholder="ООО Отправитель"
                placeholderTextColor={Colors.textTertiary}
                value={senderName}
                onChangeText={setSenderName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Телефон</Text>
              <TextInput
                style={styles.input}
                placeholder="+7 900 123 45 67"
                placeholderTextColor={Colors.textTertiary}
                value={senderPhone}
                onChangeText={setSenderPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Адрес</Text>
              <AddressInput
                value={senderAddress}
                onChangeText={setSenderAddress}
                placeholder="г. Москва, ул. Примерная, д. 1"
                onSelectAddress={(addr) => setSenderAddress(addr.value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Часы работы (необязательно)</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowSenderHoursDropdown(true)}
              >
                <Text style={[styles.dropdownButtonText, !senderWorkingHours && styles.dropdownPlaceholder]}>
                  {senderWorkingHours || 'Выберите часы работы'}
                </Text>
                <ChevronDown size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <User size={24} color={Colors.primary} />
              <Text style={styles.stepTitle}>Получатель</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ИНН</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="1234567890"
                  placeholderTextColor={Colors.textTertiary}
                  value={receiverInn}
                  onChangeText={handleReceiverInnChange}
                  keyboardType="numeric"
                />
                {loadingReceiverCompany && (
                  <View style={styles.loadingIndicator}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                  </View>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Название организации</Text>
              <TextInput
                style={styles.input}
                placeholder="ООО Получатель"
                placeholderTextColor={Colors.textTertiary}
                value={receiverName}
                onChangeText={setReceiverName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Телефон</Text>
              <TextInput
                style={styles.input}
                placeholder="+7 900 123 45 67"
                placeholderTextColor={Colors.textTertiary}
                value={receiverPhone}
                onChangeText={setReceiverPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Адрес</Text>
              <AddressInput
                value={receiverAddress}
                onChangeText={setReceiverAddress}
                placeholder="г. Москва, ул. Примерная, д. 1"
                onSelectAddress={(addr) => setReceiverAddress(addr.value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Часы работы (необязательно)</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowReceiverHoursDropdown(true)}
              >
                <Text style={[styles.dropdownButtonText, !receiverWorkingHours && styles.dropdownPlaceholder]}>
                  {receiverWorkingHours || 'Выберите часы работы'}
                </Text>
                <ChevronDown size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <MapPin size={24} color={Colors.primary} />
              <Text style={styles.stepTitle}>Маршрут</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Город отправления</Text>
              <AddressInput
                value={fromCity}
                onChangeText={setFromCity}
                placeholder="Москва"
                onSelectAddress={(addr) => setFromCity(addr.data.city || addr.value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Адрес отправления</Text>
              <AddressInput
                value={fromAddressShort}
                onChangeText={setFromAddressShort}
                placeholder="Склад А"
                onSelectAddress={(addr) => setFromAddressShort(addr.value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Город назначения</Text>
              <AddressInput
                value={toCity}
                onChangeText={setToCity}
                placeholder="Калининград"
                onSelectAddress={(addr) => setToCity(addr.data.city || addr.value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Адрес назначения</Text>
              <AddressInput
                value={toAddressShort}
                onChangeText={setToAddressShort}
                placeholder="Склад Б"
                onSelectAddress={(addr) => setToAddressShort(addr.value)}
              />
            </View>
          </View>
        )}

        {step === 5 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Package size={24} color={Colors.primary} />
              <Text style={styles.stepTitle}>Параметры груза</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Тип груза</Text>
              <View style={styles.cargoTypesGrid}>
                <TouchableOpacity 
                  style={[styles.cargoType, cargoType === 'pallet' && styles.cargoTypeActive]}
                  onPress={() => setCargoType('pallet')}
                >
                  <Text style={[styles.cargoTypeText, cargoType === 'pallet' && styles.cargoTypeTextActive]}>Паллеты</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.cargoType, cargoType === 'box' && styles.cargoTypeActive]}
                  onPress={() => setCargoType('box')}
                >
                  <Text style={[styles.cargoTypeText, cargoType === 'box' && styles.cargoTypeTextActive]}>Коробки</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.cargoType, cargoType === 'envelope' && styles.cargoTypeActive]}
                  onPress={() => setCargoType('envelope')}
                >
                  <Text style={[styles.cargoTypeText, cargoType === 'envelope' && styles.cargoTypeTextActive]}>Конверты</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.cargoType, cargoType === 'other' && styles.cargoTypeActive]}
                  onPress={() => setCargoType('other')}
                >
                  <Text style={[styles.cargoTypeText, cargoType === 'other' && styles.cargoTypeTextActive]}>Другое</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Количество</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={Colors.textTertiary}
                value={cargoQty}
                onChangeText={setCargoQty}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Вес (кг)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textTertiary}
                  value={cargoWeight}
                  onChangeText={setCargoWeight}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Объем (м³)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textTertiary}
                  value={cargoVolume}
                  onChangeText={setCargoVolume}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Объявленная стоимость (₽)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={Colors.textTertiary}
                value={cargoDeclaredValue}
                onChangeText={setCargoDeclaredValue}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Описание груза (необязательно)</Text>
              <TextInput
                style={styles.input}
                placeholder="Этикетки, упаковка и т.д."
                placeholderTextColor={Colors.textTertiary}
                value={cargoDescription}
                onChangeText={setCargoDescription}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Габариты (необязательно)</Text>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.input}
                    placeholder="Д"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textTertiary}
                    value={cargoLength}
                    onChangeText={setCargoLength}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.input}
                    placeholder="Ш"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textTertiary}
                    value={cargoWidth}
                    onChangeText={setCargoWidth}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.input}
                    placeholder="В"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textTertiary}
                    value={cargoHeight}
                    onChangeText={setCargoHeight}
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {step === 6 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <CalendarIcon size={24} color={Colors.primary} />
              <Text style={styles.stepTitle}>Дополнительные услуги</Text>
            </View>

            <View style={styles.servicesRow}>
              <TouchableOpacity
                style={[styles.toggleCard, servicePickup && styles.toggleCardActive]}
                onPress={() => setServicePickup(!servicePickup)}
              >
                <View style={styles.toggleInfo}>
                  <Text style={[styles.toggleTitle, servicePickup && styles.toggleTitleActive]}>Забор груза</Text>
                  <Text style={[styles.toggleSubtitle, servicePickup && styles.toggleSubtitleActive]}>Заберем груз по адресу</Text>
                </View>
                <View style={[styles.toggle, servicePickup && styles.toggleActive]}>
                  <View style={[styles.toggleThumb, servicePickup && styles.toggleThumbActive]} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleCard, serviceDoorDelivery && styles.toggleCardActive]}
                onPress={() => setServiceDoorDelivery(!serviceDoorDelivery)}
              >
                <View style={styles.toggleInfo}>
                  <Text style={[styles.toggleTitle, serviceDoorDelivery && styles.toggleTitleActive]}>Доставка до двери</Text>
                  <Text style={[styles.toggleSubtitle, serviceDoorDelivery && styles.toggleSubtitleActive]}>Доставим по адресу получателя</Text>
                </View>
                <View style={[styles.toggle, serviceDoorDelivery && styles.toggleActive]}>
                  <View style={[styles.toggleThumb, serviceDoorDelivery && styles.toggleThumbActive]} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Планируемая дата загрузки</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.dropdownButtonText, !plannedLoadingDate && styles.dropdownPlaceholder]}>
                  {plannedLoadingDate || 'Выберите дату'}
                </Text>
                <CalendarIcon size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {step > 1 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep(step - 1)}
          >
            <Text style={styles.backButtonText}>Назад</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, step === 1 && { flex: 1 }]}
          onPress={() => {
            if (step < 6) {
              setStep(step + 1);
            } else {
              handleCreateOrder();
            }
          }}
        >
          <Text style={styles.nextButtonText}>
            {step === 6 ? 'Создать перевозку' : 'Далее'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCompanyDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompanyDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCompanyDropdown(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Выберите компанию</Text>
            <ScrollView style={styles.modalList}>
              {companies.map((company) => (
                <TouchableOpacity
                  key={company.id}
                  style={styles.modalItem}
                  onPress={() => handleCompanySelect(company.id)}
                >
                  <Text style={styles.modalItemText}>{company.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showSenderHoursDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSenderHoursDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSenderHoursDropdown(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Выберите часы работы</Text>
            <ScrollView style={styles.modalList}>
              {WORKING_HOURS_OPTIONS.map((hours) => (
                <TouchableOpacity
                  key={hours}
                  style={styles.modalItem}
                  onPress={() => {
                    setSenderWorkingHours(hours);
                    setShowSenderHoursDropdown(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{hours}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showReceiverHoursDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReceiverHoursDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowReceiverHoursDropdown(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Выберите часы работы</Text>
            <ScrollView style={styles.modalList}>
              {WORKING_HOURS_OPTIONS.map((hours) => (
                <TouchableOpacity
                  key={hours}
                  style={styles.modalItem}
                  onPress={() => {
                    setReceiverWorkingHours(hours);
                    setShowReceiverHoursDropdown(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{hours}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          >
            <View style={styles.datePickerModal}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.modalTitle}>Выберите дату</Text>
              </View>
              {Platform.OS === 'web' ? (
                <View style={styles.webDatePicker}>
                  <TextInput
                    style={styles.input}
                    placeholder="ГГГГ-ММ-ДД"
                    placeholderTextColor={Colors.textTertiary}
                    value={plannedLoadingDate}
                    onChangeText={(text) => {
                      setPlannedLoadingDate(text);
                    }}
                  />
                  <View style={styles.datePickerButtons}>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.datePickerButtonText}>Отмена</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.datePickerButton, styles.datePickerButtonPrimary]}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={[styles.datePickerButtonText, styles.datePickerButtonTextPrimary]}>Готово</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="spinner"
                    onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                      if (selectedDate) {
                        setTempDate(selectedDate);
                      }
                    }}
                    minimumDate={new Date()}
                  />
                  <View style={styles.datePickerButtons}>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.datePickerButtonText}>Отмена</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.datePickerButton, styles.datePickerButtonPrimary]}
                      onPress={() => {
                        const year = tempDate.getFullYear();
                        const month = String(tempDate.getMonth() + 1).padStart(2, '0');
                        const day = String(tempDate.getDate()).padStart(2, '0');
                        setPlannedLoadingDate(`${year}-${month}-${day}`);
                        setShowDatePicker(false);
                      }}
                    >
                      <Text style={[styles.datePickerButtonText, styles.datePickerButtonTextPrimary]}>Готово</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: Colors.primary,
  },
  stepContainer: {
    gap: 20,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000000',
    backgroundColor: Colors.white,
  },
  inputDisabled: {
    backgroundColor: Colors.backgroundSecondary,
    color: Colors.textSecondary,
  },
  dropdownButton: {
    height: 52,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#000000',
  },
  dropdownPlaceholder: {
    color: Colors.textTertiary,
  },
  cargoTypes: {
    flexDirection: 'row',
    gap: 8,
  },
  cargoTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cargoType: {
    flex: 1,
    minWidth: '48%',
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  cargoTypeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cargoTypeActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  cargoTypeTextActive: {
    color: Colors.white,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  servicesRow: {
    gap: 12,
  },
  toggleCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.infoBg,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  toggleTitleActive: {
    color: Colors.primary,
  },
  toggleSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  toggleSubtitleActive: {
    color: Colors.primary,
  },
  toggle: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: Colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: Colors.primary,
  },
  toggleThumb: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: Colors.white,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  backButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSecondary,
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  nextButton: {
    flex: 2,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.white,
  },
  addressInputContainer: {
    position: 'relative',
    zIndex: 1,
  },
  inputWrapper: {
    position: 'relative',
  },
  loadingIndicator: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  suggestionsList: {
    maxHeight: 250,
  },
  suggestionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionText: {
    fontSize: 15,
    color: '#000000',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalItemText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
  },
  modalItemSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  datePickerModal: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  datePickerHeader: {
    marginBottom: 16,
  },
  webDatePicker: {
    gap: 16,
  },
  datePickerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  datePickerButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSecondary,
  },
  datePickerButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  datePickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  datePickerButtonTextPrimary: {
    color: Colors.white,
  },
});
