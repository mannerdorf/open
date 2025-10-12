import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { AchievementsProvider } from "@/contexts/AchievementsContext";
import { DashboardSettingsProvider } from "@/contexts/DashboardSettingsContext";
import { trpc, trpcClient } from "@/lib/trpc";


SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isLoading, needsAuth } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (needsAuth) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth-lock" />
      </Stack>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="setup-security" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="order/new" options={{ presentation: 'modal', headerShown: true, title: 'Новая заявка' }} />
      <Stack.Screen name="order/[id]" options={{ presentation: 'card', headerShown: true, title: 'Детали заказа' }} />
      <Stack.Screen name="order/[id]/receipt" options={{ headerShown: true, title: 'Экспедиторская расписка', headerBackVisible: true }} />
      <Stack.Screen name="order/[id]/act" options={{ headerShown: true, title: 'Акт приема-передачи', headerBackVisible: true }} />
      <Stack.Screen name="order/[id]/invoice" options={{ headerShown: true, title: 'Счет', headerBackVisible: true }} />
      <Stack.Screen name="order/[id]/upd" options={{ headerShown: true, title: 'УПД', headerBackVisible: true }} />
      <Stack.Screen name="order/[id]/claim" options={{ headerShown: true, title: 'Сформировать претензию', headerBackVisible: true }} />
      <Stack.Screen name="document/invoice/[id]" options={{ headerShown: true, title: 'Счет', headerBackVisible: true }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="support" options={{ headerShown: false }} />
      <Stack.Screen name="legal/offer" options={{ headerShown: true, title: 'Публичная оферта', headerBackVisible: true }} />
      <Stack.Screen name="legal/privacy" options={{ headerShown: true, title: 'Обработка персональных данных', headerBackVisible: true }} />
      <Stack.Screen name="achievements" options={{ headerShown: true, title: 'Мои достижения', headerBackVisible: true }} />
      <Stack.Screen name="test-api" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CompanyProvider>
            <DashboardSettingsProvider>
              <AchievementsProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <RootLayoutNav />
                </GestureHandlerRootView>
              </AchievementsProvider>
            </DashboardSettingsProvider>
          </CompanyProvider>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
