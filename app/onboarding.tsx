import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { Package, MapPin, FileText, Shield } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/constants/colors';

const slides = [
  {
    icon: Package,
    title: 'Доставка грузов в Калининград и обратно',
    description: 'Быстрая и надежная доставка грузов между Москвой и Калининградом',
  },
  {
    icon: MapPin,
    title: 'Отслеживание в реальном времени',
    description: 'Следите за вашим грузом на каждом этапе пути',
  },
  {
    icon: FileText,
    title: 'Документы онлайн',
    description: 'Все документы доступны в приложении в любое время',
  },
  {
    icon: Shield,
    title: 'Безопасность и надежность',
    description: 'Ваши данные защищены, груз застрахован',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAuth();
  const insets = useSafeAreaInsets();
  const Colors = useThemeColors();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  console.log('Onboarding - Colors:', {
    background: Colors.background,
    text: Colors.text,
    primary: Colors.primary,
    surface1: Colors.surface1,
  });
  console.log('Onboarding - Current slide:', currentIndex, slides[currentIndex]);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      
      setCurrentIndex(currentIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    await completeOnboarding();
    router.replace('/login');
  };

  const currentSlide = slides[currentIndex];
  const Icon = currentSlide.icon;

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <TouchableOpacity style={[styles.skipButton, { top: insets.top + 20 }]} onPress={handleSkip}>
        <Text style={[styles.skipText, { color: Colors.textSecondary }]}>Пропустить</Text>
      </TouchableOpacity>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={[styles.iconContainer, { backgroundColor: Colors.surface1 }]}>
          <Icon size={80} color={Colors.primary} strokeWidth={1.5} />
        </View>

        <Text style={[styles.title, { color: Colors.text }]}>{currentSlide.title}</Text>
        <Text style={[styles.description, { color: Colors.textSecondary }]}>{currentSlide.description}</Text>
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 50 }]}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: Colors.surface2 },
                index === currentIndex && [styles.dotActive, { backgroundColor: Colors.primary }],
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={[styles.button, { backgroundColor: Colors.primary }]} onPress={handleNext}>
          <Text style={[styles.buttonText, { color: Colors.white }]}>
            {currentIndex === slides.length - 1 ? 'Начать' : 'Далее'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute' as const,
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 12,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
    marginBottom: 20,
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  description: {
    fontSize: 18,
    textAlign: 'center' as const,
    lineHeight: 26,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  pagination: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 32,
  },
  button: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
});
