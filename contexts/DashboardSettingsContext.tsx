import { useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

export type DashboardKey =
  | 'main_tiles'
  | 'sla'
  | 'cashflow'
  | 'delivery_forecast'
  | 'damage_monitor'
  | 'edo_monitor';

export type DashboardSettings = Record<DashboardKey, boolean>;

const STORAGE_KEY = 'dashboard_settings_v1';

const DEFAULTS: DashboardSettings = {
  main_tiles: true,
  sla: true,
  cashflow: true,
  delivery_forecast: true,
  damage_monitor: true,
  edo_monitor: true,
};

const defaultContext = {
  enabled: DEFAULTS,
  isHydrated: false,
  error: null,
  toggle: async () => {},
  setMany: async () => {},
};

export const [DashboardSettingsProvider, useDashboardSettings] = createContextHook(() => {
  const [enabled, setEnabled] = useState<DashboardSettings>(DEFAULTS);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        console.log('[DashboardSettings] Loading from storage...');
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!isMounted) return;
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<DashboardSettings>;
          const merged: DashboardSettings = { ...DEFAULTS, ...parsed };
          setEnabled(merged);
          console.log('[DashboardSettings] Loaded', merged);
        } else {
          console.log('[DashboardSettings] No stored settings, using defaults');
        }
      } catch (e) {
        console.error('[DashboardSettings] Load error', e);
        setError('Не удалось загрузить настройки дашбордов');
      } finally {
        if (isMounted) setIsHydrated(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const setMany = useCallback(async (next: Partial<DashboardSettings>) => {
    try {
      const merged = { ...enabled, ...next } as DashboardSettings;
      setEnabled(merged);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      console.log('[DashboardSettings] Saved', merged);
    } catch (e) {
      console.error('[DashboardSettings] Save error', e);
      setError('Не удалось сохранить настройки');
    }
  }, [enabled]);

  const toggle = useCallback(async (key: DashboardKey, value: boolean) => {
    await setMany({ [key]: value } as Partial<DashboardSettings>);
  }, [setMany]);

  const ctx = useMemo(() => ({ enabled, isHydrated, error, toggle, setMany }), [enabled, isHydrated, error, toggle, setMany]);
  return ctx;
}, defaultContext);
