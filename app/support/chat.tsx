import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Send, Menu, ArrowLeft } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'support';
  timestamp: Date;
  isLoading?: boolean;
}

export default function ChatScreen() {
  const Colors = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { prefilledMessage } = useLocalSearchParams<{ prefilledMessage?: string }>();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Здравствуйте! Я умный ассистент HAULZ. У меня есть доступ к вашим перевозкам и документам. Могу помочь вам найти информацию о заказах, счетах, актах и перевозках. Чем могу помочь?',
      sender: 'support',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState(prefilledMessage || '');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendToChatGPT = async (userMessage: string, currentMessages: Message[]) => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'https://api.gapaf.ru';
      
      // Подготавливаем сообщения для ChatGPT
      const chatMessages = [
        {
          role: 'system',
          content: 'Ты умный ассистент для приложения управления перевозками HAULZ. У тебя есть доступ к реальным данным пользователя через функции: getPerevozki (получить перевозки за период) и getDocuments (получить документы - счета, акты). Когда пользователь спрашивает о его перевозках, заказах, грузах или документах - используй эти функции для получения актуальной информации. Отвечай на русском языке, будь дружелюбным и помогай пользователям. Когда показываешь данные, форматируй их читабельно.'
        },
        ...currentMessages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        })),
        {
          role: 'user',
          content: userMessage
        }
      ];

      const response = await fetch(`${apiUrl}/api/chat-gpt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: chatMessages }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.message;
      } else {
        throw new Error(data.error || 'Неизвестная ошибка');
      }
    } catch (error) {
      console.error('ChatGPT API Error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        apiUrl,
        chatMessages
      });
      return 'Извините, произошла ошибка при получении ответа. Попробуйте еще раз.';
    }
  };

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    const newMessage: Message = {
      id: Date.now().toString(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    setIsLoading(true);

    // Добавляем сообщение о загрузке
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: 'Думаю...',
      sender: 'support',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      const response = await sendToChatGPT(userMessage, messages);
      
      // Удаляем сообщение о загрузке и добавляем ответ
      setMessages((prev) => {
        const withoutLoading = prev.filter(msg => !msg.isLoading);
        return [
          ...withoutLoading,
          {
            id: (Date.now() + 2).toString(),
            text: response,
            sender: 'support',
            timestamp: new Date(),
          }
        ];
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Удаляем сообщение о загрузке и добавляем ошибку
      setMessages((prev) => {
        const withoutLoading = prev.filter(msg => !msg.isLoading);
        return [
          ...withoutLoading,
          {
            id: (Date.now() + 2).toString(),
            text: 'Извините, произошла ошибка. Попробуйте еще раз.',
            sender: 'support',
            timestamp: new Date(),
          }
        ];
      });
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading]);

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.supportMessageContainer]}>
        <View style={[
          styles.messageBubble,
          isUser ? { backgroundColor: Colors.primary } : { backgroundColor: Colors.surface1 }
        ]}>
          {item.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.textSecondary} />
              <Text style={[styles.messageText, { color: Colors.text, marginLeft: 8 }]}>
                {item.text}
              </Text>
            </View>
          ) : (
            <Text style={[styles.messageText, { color: isUser ? '#FFFFFF' : Colors.text }]}>
              {item.text}
            </Text>
          )}
          <Text style={[styles.messageTime, { color: isUser ? 'rgba(255,255,255,0.7)' : Colors.textSecondary }]}>
            {item.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  }, [Colors]);

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: Colors.surface1, borderBottomColor: Colors.border }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            accessibilityRole="button"
            testID="chat-back-button"
            onPress={() => {
              try {
                console.log('[Chat] Back pressed');
                if (router.canGoBack?.()) {
                  console.log('[Chat] canGoBack = true, navigating back');
                  router.back();
                } else {
                  console.log('[Chat] canGoBack = false, replacing to Support tab');
                  router.replace('/(tabs)/support');
                }
              } catch (e) {
                console.error('[Chat] Error handling back, fallback replace to home', e);
                try {
                  router.replace('/(tabs)/home');
                } catch {}
              }
            }}
            style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
            <Menu size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>
      <KeyboardAvoidingView 
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        
        <View style={[styles.inputContainer, { backgroundColor: Colors.surface1, borderTopColor: Colors.surface2 }]}>
          <TextInput
            style={[styles.input, { backgroundColor: Colors.surface2, color: Colors.text }]}
            placeholder="Введите сообщение..."
            placeholderTextColor={Colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, { backgroundColor: (inputText.trim() && !isLoading) ? Colors.primary : Colors.surface2 }]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.textSecondary} />
            ) : (
              <Send size={20} color={(inputText.trim() && !isLoading) ? '#FFFFFF' : Colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  backButton: {
    marginRight: 16,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end' as const,
  },
  supportMessageContainer: {
    alignSelf: 'flex-start' as const,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row' as const,
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});
