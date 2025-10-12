import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePathname, useSegments } from 'expo-router';
import { useThemeColors } from '@/constants/colors';

export function DebugFooter() {
  const pathname = usePathname();
  const segments = useSegments();
  const Colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: Colors.surface2, borderTopColor: Colors.border }]}>
      <Text style={[styles.text, { color: Colors.textSecondary }]} numberOfLines={1}>
        Path: {pathname} | Segments: [{segments.join(', ')}]
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    alignItems: 'center' as const,
    zIndex: 9999,
  },
  text: {
    fontSize: 9,
    fontWeight: '400' as const,
    fontFamily: 'monospace' as const,
  },
});
