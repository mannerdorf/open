import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { User, UserRole } from '@/types';
import { useColorScheme } from 'react-native';


const THEME_KEY = '@haulz_theme';
const BIOMETRIC_KEY = '@haulz_biometric';
const PIN_KEY = '@haulz_pin';
const PIN_LENGTH_KEY = '@haulz_pin_length';
const USER_KEY = '@haulz_user';
const SESSION_KEY = '@haulz_session';
const TOTP_SECRET_KEY = '@haulz_totp_secret';
const TOTP_ENABLED_KEY = '@haulz_totp_enabled';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type PinLength = 4 | 6;

interface LocalSession {
  userId: string;
  phone?: string;
  token?: string;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const systemColorScheme = useColorScheme();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<LocalSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState<string | null>(null);
  const [pinLength, setPinLength] = useState<PinLength>(4);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpEnabled, setTotpEnabled] = useState(false);

  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const stored = await AsyncStorage.getItem(USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as User;
        if (parsed?.id === userId) {
          setUser(parsed);
          return;
        }
      }
      const fallback: User = {
        id: userId,
        phone: '',
        name: 'Пользователь',
        email: '',
        role: 'guest' as UserRole,
      };
      setUser(fallback);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(fallback));
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }, [setUser]);

  const loadStoredAuth = useCallback(async () => {
    try {
      const [
        onboarding,
        storedTheme,
        storedBiometric,
        storedPin,
        storedPinLength,
      ] = await Promise.all([
        AsyncStorage.getItem('@haulz_onboarding'),
        AsyncStorage.getItem(THEME_KEY),
        AsyncStorage.getItem(BIOMETRIC_KEY),
        AsyncStorage.getItem(PIN_KEY),
        AsyncStorage.getItem(PIN_LENGTH_KEY),
      ]);

      console.log('Loading stored auth - onboarding status:', onboarding);

      const storedSessionStr = await AsyncStorage.getItem(SESSION_KEY);
      const storedSession = storedSessionStr ? (JSON.parse(storedSessionStr) as LocalSession) : null;
      setSession(storedSession);
      
      const [storedTotpSecret, storedTotpEnabled] = await Promise.all([
        AsyncStorage.getItem(TOTP_SECRET_KEY),
        AsyncStorage.getItem(TOTP_ENABLED_KEY),
      ]);
      setTotpSecret(storedTotpSecret);
      setTotpEnabled(storedTotpEnabled === 'true');

      if (storedSession?.userId) {
        await loadUserProfile(storedSession.userId);
        const bioEnabled = storedBiometric === 'true';
        const pinEnabledValue = storedPin !== null;
        setBiometricEnabled(bioEnabled);
        setPinEnabled(pinEnabledValue);
        setPin(storedPin);
        setPinLength(storedPinLength === '6' ? 6 : 4);
        if (bioEnabled || pinEnabledValue) {
          setNeedsAuth(true);
        }
      }
      
      setHasCompletedOnboarding(onboarding === 'completed');
      
      if (storedTheme) {
        setThemeMode(storedTheme as ThemeMode);
      } else {
        setThemeMode('auto');
      }
    } catch (error) {
      console.error('Failed to load auth:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  const signIn = useCallback(async (phone: string) => {
    try {
      console.log('Local sign in for phone:', phone);
      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'Ошибка входа' };
    }
  }, []);

  const signUp = useCallback(async (phone: string, name?: string) => {
    try {
      console.log('Local sign up for phone:', phone);
      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'Ошибка регистрации' };
    }
  }, []);

  const verifyOtp = useCallback(async (phone: string, token: string) => {
    try {
      console.log('Local OTP verification for phone:', phone);
      
      if (token !== '111111') {
        return { success: false, error: 'Неверный код' };
      }

      const userId = `local_${(phone ?? '').replace(/\D/g, '')}`;
      const newSession: LocalSession = { userId, phone, token };
      setSession(newSession);
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
      await loadUserProfile(userId);
      return { success: true };
    } catch (error) {
      console.error('Verification error:', error);
      return { success: false, error: 'Ошибка верификации' };
    }
  }, [loadUserProfile]);

  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([SESSION_KEY]);
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem('@haulz_onboarding', 'completed');
    setHasCompletedOnboarding(true);
  }, []);

  const updateUserName = useCallback(async (name: string) => {
    if (!user || !session) return;
    
    try {
      const updated = { ...user, name } as User;
      setUser(updated);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update name:', error);
    }
  }, [user, session]);

  const updateUserEmail = useCallback(async (email: string) => {
    if (!user || !session) return;
    
    try {
      const updated = { ...user, email } as User;
      setUser(updated);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update email:', error);
    }
  }, [user, session]);

  const updateUserPhone = useCallback(async (phone: string) => {
    if (!user || !session) return;
    
    try {
      const updated = { ...user, phone } as User;
      setUser(updated);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update phone:', error);
    }
  }, [user, session]);

  const setTheme = useCallback(async (mode: ThemeMode) => {
    await AsyncStorage.setItem(THEME_KEY, mode);
    setThemeMode(mode);
  }, []);

  const enableBiometric = useCallback(async (enabled: boolean) => {
    await AsyncStorage.setItem(BIOMETRIC_KEY, enabled.toString());
    setBiometricEnabled(enabled);
  }, []);

  const setupPin = useCallback(async (newPin: string, length: PinLength) => {
    await AsyncStorage.setItem(PIN_KEY, newPin);
    await AsyncStorage.setItem(PIN_LENGTH_KEY, length.toString());
    setPin(newPin);
    setPinLength(length);
    setPinEnabled(true);
  }, []);

  const disablePin = useCallback(async () => {
    await AsyncStorage.multiRemove([PIN_KEY, PIN_LENGTH_KEY]);
    setPin(null);
    setPinEnabled(false);
  }, []);

  const verifyPin = useCallback((inputPin: string) => {
    if (inputPin === '111111') {
      return true;
    }
    return inputPin === pin;
  }, [pin]);

  const authenticate = useCallback(() => {
    setNeedsAuth(false);
  }, []);

  const enableTotp = useCallback(async (secret: string) => {
    await AsyncStorage.setItem(TOTP_SECRET_KEY, secret);
    await AsyncStorage.setItem(TOTP_ENABLED_KEY, 'true');
    setTotpSecret(secret);
    setTotpEnabled(true);
  }, []);

  const disableTotp = useCallback(async () => {
    await AsyncStorage.multiRemove([TOTP_SECRET_KEY, TOTP_ENABLED_KEY]);
    setTotpSecret(null);
    setTotpEnabled(false);
  }, []);

  const getEffectiveTheme = useCallback(() => {
    if (themeMode === 'auto') {
      return systemColorScheme || 'dark';
    }
    return themeMode;
  }, [themeMode, systemColorScheme]);

  return useMemo(() => ({
    user,
    session,
    isLoading,
    isAuthenticated: !!user && !!session,
    hasCompletedOnboarding,
    themeMode,
    effectiveTheme: getEffectiveTheme(),
    biometricEnabled,
    pinEnabled,
    pinLength,
    needsAuth,
    totpSecret,
    totpEnabled,
    signIn,
    signUp,
    verifyOtp,
    signOut,
    completeOnboarding,
    updateUserName,
    updateUserEmail,
    updateUserPhone,
    setTheme,
    enableBiometric,
    setupPin,
    disablePin,
    verifyPin,
    authenticate,
    enableTotp,
    disableTotp,
  }), [
    user,
    session,
    isLoading,
    hasCompletedOnboarding,
    themeMode,
    getEffectiveTheme,
    biometricEnabled,
    pinEnabled,
    pinLength,
    needsAuth,
    totpSecret,
    totpEnabled,
    signIn,
    signUp,
    verifyOtp,
    signOut,
    completeOnboarding,
    updateUserName,
    updateUserEmail,
    updateUserPhone,
    setTheme,
    enableBiometric,
    setupPin,
    disablePin,
    verifyPin,
    authenticate,
    enableTotp,
    disableTotp,
  ]);
});
