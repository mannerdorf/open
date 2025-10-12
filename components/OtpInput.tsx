import { View, TextInput, StyleSheet, Platform } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useThemeColors } from '@/constants/colors';

interface OtpInputProps {
  length?: number;
  value: string;
  onChangeText: (text: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export default function OtpInput({ 
  length = 6, 
  value, 
  onChangeText, 
  onComplete,
  disabled = false,
  autoFocus = true 
}: OtpInputProps) {
  const Colors = useThemeColors();
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(autoFocus ? 0 : null);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  const handleChangeText = (text: string, index: number) => {
    const numericText = text.replace(/[^0-9]/g, '');
    
    if (numericText.length === 0) {
      const newValue = value.split('');
      newValue[index] = '';
      onChangeText(newValue.join(''));
      return;
    }

    if (numericText.length === 1) {
      const newValue = value.split('');
      while (newValue.length < length) {
        newValue.push('');
      }
      newValue[index] = numericText;
      const updatedValue = newValue.join('');
      onChangeText(updatedValue);

      if (updatedValue.length === length && onComplete) {
        setTimeout(() => onComplete(updatedValue), 100);
      } else if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    } else if (numericText.length > 1) {
      const digits = numericText.split('');
      const newValue = value.split('');
      while (newValue.length < length) {
        newValue.push('');
      }
      
      digits.forEach((digit, i) => {
        const targetIndex = index + i;
        if (targetIndex < length) {
          newValue[targetIndex] = digit;
        }
      });
      
      const updatedValue = newValue.join('');
      onChangeText(updatedValue);

      if (updatedValue.length === length && onComplete) {
        setTimeout(() => onComplete(updatedValue), 100);
      } else {
        const nextIndex = Math.min(index + digits.length, length - 1);
        inputRefs.current[nextIndex]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(null);
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => (
        <TextInput
          key={index}
          ref={(ref) => { inputRefs.current[index] = ref; return; }}
          style={[
            styles.input,
            { 
              backgroundColor: Colors.surface1, 
              color: Colors.text,
              borderColor: focusedIndex === index ? Colors.primary : Colors.border,
              borderWidth: focusedIndex === index ? 2 : 1,
            }
          ]}
          value={value[index] || ''}
          onChangeText={(text) => handleChangeText(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onFocus={() => handleFocus(index)}
          onBlur={handleBlur}
          keyboardType="number-pad"
          maxLength={Platform.OS === 'ios' ? 1 : 6}
          selectTextOnFocus
          editable={!disabled}
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row' as const,
    gap: 12,
    justifyContent: 'center' as const,
  },
  input: {
    width: 48,
    height: 56,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
});
