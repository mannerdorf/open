import { Tabs, usePathname } from "expo-router";
import { Home, Package, FileText, MessageCircle, User } from "lucide-react-native";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useThemeColors } from "@/constants/colors";

export default function TabLayout() {
  const Colors = useThemeColors();
  const pathname = usePathname();
  
  const getPageName = () => {
    if (pathname === '/home' || pathname === '/') return 'Главная';
    if (pathname === '/orders') return 'Грузы';
    if (pathname === '/documents') return 'Документы';
    if (pathname === '/support') return 'Поддержка';
    if (pathname === '/profile') return 'Профиль';
    if (pathname === '/companies') return 'Компании';
    if (pathname === '/inn') return 'ИНН';
    return pathname;
  };
  
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.surface1,
            borderTopColor: Colors.surface2,
            borderTopWidth: 1,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600' as const,
          },
        }}
      >
      <Tabs.Screen
        name="home"
        options={{
          title: "Главная",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Грузы",
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: "Документы",
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: "Поддержка",
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Профиль",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="companies"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="inn"
        options={{
          href: null,
        }}
      />
    </Tabs>
    <View style={[styles.footer, { backgroundColor: Colors.surface2, borderTopColor: Colors.surface2 }]}>
      <Text style={[styles.footerText, { color: Colors.textSecondary }]}>
        {getPageName()}
      </Text>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    alignItems: 'center' as const,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '500' as const,
  },
});
