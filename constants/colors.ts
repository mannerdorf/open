import { useAuth } from '@/contexts/AuthContext';

const darkTheme = {
  primary: '#2D5BFF',
  primaryLight: '#7EA1FF',
  primaryWeak: '#7EA1FF',
  
  bgApp: '#0B0D12',
  surface1: '#111418',
  surface2: '#1F2937',
  
  background: '#0B0D12',
  backgroundSecondary: '#111418',
  backgroundTertiary: '#1F2937',
  
  text: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#6B7280',
  textTertiary: '#6B7280',
  textInverse: '#0A0B0F',
  
  border: '#1F2937',
  borderLight: '#1F2937',
  
  success: '#A3FF12',
  successLight: '#A3FF12',
  successBg: '#1F2937',
  
  warning: '#FF6A00',
  warningLight: '#FF6A00',
  warningBg: '#1F2937',
  
  error: '#FF6A00',
  errorLight: '#FF6A00',
  errorBg: '#1F2937',
  
  info: '#00B5A5',
  infoLight: '#00B5A5',
  infoBg: '#1F2937',
  
  statusCreated: '#7EA1FF',
  statusAtWarehouse: '#00B5A5',
  statusInTransit: '#2D5BFF',
  statusAtBorder: '#FF6A00',
  statusOutForDelivery: '#A3FF12',
  statusDelivered: '#A3FF12',
  statusDelayed: '#FF6A00',
  statusCancelled: '#6B7280',
  
  card: '#111418',
  cardShadow: 'rgba(0, 0, 0, 0.3)',
  
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  
  white: '#FFFFFF',
  black: '#0A0B0F',
  
  gradientPrimary: ['#2D5BFF', '#7EA1FF'],
};

const lightTheme = {
  primary: '#2D5BFF',
  primaryLight: '#7EA1FF',
  primaryWeak: '#E8EEFF',
  
  bgApp: '#FFFFFF',
  surface1: '#F9FAFB',
  surface2: '#F3F4F6',
  
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  backgroundTertiary: '#F3F4F6',
  
  text: '#0A0B0F',
  textPrimary: '#0A0B0F',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  success: '#10B981',
  successLight: '#34D399',
  successBg: '#D1FAE5',
  
  warning: '#FF6A00',
  warningLight: '#FF8534',
  warningBg: '#FFF4ED',
  
  error: '#EF4444',
  errorLight: '#F87171',
  errorBg: '#FEE2E2',
  
  info: '#00B5A5',
  infoLight: '#00D4C3',
  infoBg: '#CCFBF1',
  
  statusCreated: '#7EA1FF',
  statusAtWarehouse: '#00B5A5',
  statusInTransit: '#2D5BFF',
  statusAtBorder: '#FF6A00',
  statusOutForDelivery: '#10B981',
  statusDelivered: '#10B981',
  statusDelayed: '#FF6A00',
  statusCancelled: '#6B7280',
  
  card: '#FFFFFF',
  cardShadow: 'rgba(0, 0, 0, 0.08)',
  
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  
  white: '#FFFFFF',
  black: '#0A0B0F',
  
  gradientPrimary: ['#2D5BFF', '#7EA1FF'],
};

export const useThemeColors = () => {
  const auth = useAuth();
  const effectiveTheme = auth?.effectiveTheme ?? 'dark';
  return effectiveTheme === 'dark' ? darkTheme : lightTheme;
};

export default darkTheme;
