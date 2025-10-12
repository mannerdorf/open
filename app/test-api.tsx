import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, XCircle, Send } from 'lucide-react-native';
import { useThemeColors } from '@/constants/colors';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

type TestResult = {
  name: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  response?: string;
  error?: string;
  duration?: number;
};

export default function TestApiScreen() {
  const Colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [results, setResults] = useState<TestResult[]>([
    { name: 'GET /GetPerevozki (2024-2026)', status: 'idle' },
  ]);
  const [input, setInput] = useState('');
  const [gptInput, setGptInput] = useState('');
  const [gptMessages, setGptMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isGptLoading, setIsGptLoading] = useState(false);
  
  // Удалено использование tRPC mutation

  // Временно отключено из-за отсутствия @rork/toolkit-sdk
  // const { messages, error: chatError, sendMessage } = useRorkAgent({
  //   tools: {
  //     testApi: createRorkTool({
  //       description: 'Test the 1C API endpoint',
  //       zodSchema: z.object({
  //         action: z.enum(['test', 'reset']).describe('Action to perform: test or reset'),
  //       }),
  //       execute(input) {
  //         if (input.action === 'test') {
  //           testAll();
  //           return 'Тесты запущены';
  //         } else {
  //           resetAll();
  //           return 'Результаты сброшены';
  //         }
  //       },
  //     }),
  //   },
  // });
  
  // Временные заглушки
  const messages: any[] = [];
  const chatError = null;
  const sendMessage = (message: string) => {
    console.log('Rork Agent временно отключен:', message);
  };



  const updateResult = (index: number, update: Partial<TestResult>) => {
    setResults(prev => prev.map((r, i) => i === index ? { ...r, ...update } : r));
  };

  const testGetPerevozki = async (index: number) => {
    updateResult(index, { status: 'loading', response: undefined, error: undefined });
    const startTime = Date.now();

    try {
      console.log('Testing GET /GetPerevozki...');

      const apiUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
      console.log('Raw API URL from env:', apiUrl);
      
      if (!apiUrl) {
        throw new Error('EXPO_PUBLIC_RORK_API_BASE_URL не настроен в .env');
      }
      
      const url = `${apiUrl}/api/test-perevozki`;
      
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      console.log('Response content-type:', response.headers.get('content-type'));
      
      const responseText = await response.text();
      console.log('Response text (first 500 chars):', responseText.substring(0, 500));
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText.substring(0, 200)}`);
      }
      
      const data = JSON.parse(responseText);
      const duration = Date.now() - startTime;

      console.log('Response:', data);
      
      if (data.success) {
        const dataStr = JSON.stringify(data, null, 2);
        updateResult(index, {
          status: 'success',
          response: dataStr.length > 5000 ? dataStr.substring(0, 5000) + '\n\n... (обрезано)' : dataStr,
          duration,
        });
      } else {
        updateResult(index, {
          status: 'error',
          error: data.error || 'Неизвестная ошибка',
          duration,
        });
      }
    } catch (err) {
      const duration = Date.now() - startTime;
      console.error('API Error:', err);
      updateResult(index, {
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
        duration,
      });
    }
  };

  const testAll = async () => {
    await testGetPerevozki(0);
  };

  const resetAll = () => {
    setResults(prev => prev.map(r => ({ ...r, status: 'idle', response: undefined, error: undefined, duration: undefined })));
  };

  const sendGptMessage = async () => {
    if (!gptInput.trim()) return;
    
    const userMessage = { role: 'user' as const, content: gptInput.trim() };
    const newMessages = [...gptMessages, userMessage];
    setGptMessages(newMessages);
    setGptInput('');
    setIsGptLoading(true);
    
    try {
      const apiUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/chat-gpt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newMessages }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setGptMessages([...newMessages, { role: 'assistant', content: data.message || 'Нет ответа' }]);
      } else {
        throw new Error(data.error || 'Неизвестная ошибка');
      }
    } catch (error) {
      console.error('GPT Error:', error);
      setGptMessages([...newMessages, { 
        role: 'assistant', 
        content: `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}` 
      }]);
    } finally {
      setIsGptLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={[styles.header, { backgroundColor: Colors.surface1, paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.text }]}>Тестирование API 1С</Text>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.infoBox, { backgroundColor: Colors.surface1 }]}>
          <Text style={[styles.infoTitle, { color: Colors.text }]}>Информация</Text>
          <Text style={[styles.infoText, { color: Colors.textSecondary }]}>
            Тестирование подключения к API 1С через backend
          </Text>
          <Text style={[styles.infoText, { color: Colors.textSecondary }]}>
            Все запросы выполняются с авторизацией
          </Text>
        </View>

        <View style={[styles.filtersBox, { backgroundColor: Colors.surface1 }]}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Информация о запросе</Text>
          <Text style={[styles.infoText, { color: Colors.textSecondary }]}>
            Запрос к API: /workbase/hs/DeliveryWebService/GetPerevozki
          </Text>
          <Text style={[styles.infoText, { color: Colors.textSecondary }]}>
            Период: 2024-01-01 до 2026-01-01
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.primary }]}
            onPress={testAll}
            disabled={results.some(r => r.status === 'loading')}
          >
            {results.some(r => r.status === 'loading') ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={[styles.actionButtonText, { color: Colors.white }]}>Запустить все тесты</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.surface1, borderWidth: 1, borderColor: Colors.border }]}
            onPress={resetAll}
            disabled={results.some(r => r.status === 'loading')}
          >
            <Text style={[styles.actionButtonText, { color: Colors.text }]}>Сбросить</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.testsContainer}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Результаты тестов</Text>
          
          {results.map((result, index) => (
            <View key={index} style={[styles.testCard, { backgroundColor: Colors.surface1 }]}>
              <View style={styles.testHeader}>
                <View style={styles.testTitleRow}>
                  {result.status === 'loading' && <ActivityIndicator size="small" color={Colors.primary} />}
                  {result.status === 'success' && <CheckCircle2 size={20} color={Colors.success} />}
                  {result.status === 'error' && <XCircle size={20} color={Colors.error} />}
                  <Text style={[styles.testName, { color: Colors.text }]}>{result.name}</Text>
                </View>
                
                {result.status !== 'idle' && result.status !== 'loading' && (
                  <TouchableOpacity
                    style={[styles.retryButton, { backgroundColor: Colors.primary }]}
                    onPress={() => testGetPerevozki(index)}
                  >
                    <Text style={[styles.retryButtonText, { color: Colors.white }]}>Повторить</Text>
                  </TouchableOpacity>
                )}
              </View>

              {result.duration !== undefined && (
                <Text style={[styles.duration, { color: Colors.textSecondary }]}>
                  Время выполнения: {result.duration}ms
                </Text>
              )}

              {result.error && (
                <View style={[styles.errorBox, { backgroundColor: `${Colors.error}15`, borderColor: Colors.error }]}>
                  <Text style={[styles.errorTitle, { color: Colors.error }]}>Ошибка:</Text>
                  <Text style={[styles.errorText, { color: Colors.error }]}>{result.error}</Text>
                </View>
              )}

              {result.response && (
                <View style={styles.responseContainer}>
                  <Text style={[styles.responseTitle, { color: Colors.text }]}>Ответ:</Text>
                  <ScrollView horizontal style={styles.responseScroll}>
                    <Text style={[styles.responseText, { color: Colors.textSecondary }]}>{result.response}</Text>
                  </ScrollView>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={[styles.chatSection, { backgroundColor: Colors.surface1 }]}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Чат с Rork Agent (с инструментами)</Text>
          
          <ScrollView style={styles.chatMessages} contentContainerStyle={styles.chatMessagesContent}>
            {messages.map((m) => (
              <View key={m.id} style={styles.messageContainer}>
                <View style={[
                  styles.messageBubble,
                  m.role === 'user' 
                    ? { backgroundColor: Colors.primary, alignSelf: 'flex-end' as const }
                    : { backgroundColor: Colors.surface2, alignSelf: 'flex-start' as const }
                ]}>
                  <Text style={[
                    styles.messageRole,
                    { color: m.role === 'user' ? Colors.white : Colors.textSecondary }
                  ]}>
                    {m.role === 'user' ? 'Вы' : 'GPT'}
                  </Text>
                  {m.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return (
                          <Text key={`${m.id}-${i}`} style={[
                            styles.messageText,
                            { color: m.role === 'user' ? Colors.white : Colors.text }
                          ]}>
                            {part.text}
                          </Text>
                        );
                      case 'tool':
                        const toolName = part.toolName;
                        switch (part.state) {
                          case 'input-streaming':
                          case 'input-available':
                            return (
                              <Text key={`${m.id}-${i}`} style={[
                                styles.toolText,
                                { color: m.role === 'user' ? Colors.white : Colors.textSecondary }
                              ]}>
                                Вызов {toolName}...
                              </Text>
                            );
                          case 'output-available':
                            return (
                              <Text key={`${m.id}-${i}`} style={[
                                styles.toolText,
                                { color: m.role === 'user' ? Colors.white : Colors.success }
                              ]}>
                                ✓ {toolName} выполнен
                              </Text>
                            );
                          case 'output-error':
                            return (
                              <Text key={`${m.id}-${i}`} style={[
                                styles.toolText,
                                { color: Colors.error }
                              ]}>
                                ✗ Ошибка: {part.errorText}
                              </Text>
                            );
                        }
                    }
                  })}
                </View>
              </View>
            ))}
            {chatError && (
              <View style={[styles.errorBox, { backgroundColor: `${Colors.error}15`, borderColor: Colors.error }]}>
                <Text style={[styles.errorText, { color: Colors.error }]}>{chatError.message}</Text>
              </View>
            )}
          </ScrollView>

          <View style={[styles.chatInputContainer, { borderTopColor: Colors.border }]}>
            <TextInput
              style={[styles.chatInput, { backgroundColor: Colors.surface2, color: Colors.text }]}
              value={input}
              onChangeText={setInput}
              placeholder="Напишите сообщение..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: input.trim() ? Colors.primary : Colors.surface2 }]}
              onPress={() => {
                if (input.trim()) {
                  sendMessage(input.trim());
                  setInput('');
                }
              }}
              disabled={!input.trim()}
            >
              <Send size={20} color={input.trim() ? Colors.white : Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.chatSection, { backgroundColor: Colors.surface1 }]}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Прямой чат с ChatGPT</Text>
          
          <ScrollView style={styles.chatMessages} contentContainerStyle={styles.chatMessagesContent}>
            {gptMessages.map((msg, idx) => (
              <View key={idx} style={styles.messageContainer}>
                <View style={[
                  styles.messageBubble,
                  msg.role === 'user' 
                    ? { backgroundColor: Colors.primary, alignSelf: 'flex-end' as const }
                    : { backgroundColor: Colors.surface2, alignSelf: 'flex-start' as const }
                ]}>
                  <Text style={[
                    styles.messageRole,
                    { color: msg.role === 'user' ? Colors.white : Colors.textSecondary }
                  ]}>
                    {msg.role === 'user' ? 'Вы' : 'ChatGPT'}
                  </Text>
                  <Text style={[
                    styles.messageText,
                    { color: msg.role === 'user' ? Colors.white : Colors.text }
                  ]}>
                    {msg.content}
                  </Text>
                </View>
              </View>
            ))}
            {isGptLoading && (
              <View style={styles.messageContainer}>
                <View style={[styles.messageBubble, { backgroundColor: Colors.surface2, alignSelf: 'flex-start' as const }]}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              </View>
            )}
          </ScrollView>

          <View style={[styles.chatInputContainer, { borderTopColor: Colors.border }]}>
            <TextInput
              style={[styles.chatInput, { backgroundColor: Colors.surface2, color: Colors.text }]}
              value={gptInput}
              onChangeText={setGptInput}
              placeholder="Напишите сообщение ChatGPT..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              maxLength={1000}
              editable={!isGptLoading}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: gptInput.trim() && !isGptLoading ? Colors.primary : Colors.surface2 }]}
              onPress={sendGptMessage}
              disabled={!gptInput.trim() || isGptLoading}
            >
              {isGptLoading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Send size={20} color={gptInput.trim() ? Colors.white : Colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  filtersBox: {
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  filterRow: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  typeButtons: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center' as const,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  input: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  testsContainer: {
    gap: 12,
  },
  testCard: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  testHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  testTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    flex: 1,
  },
  testName: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  retryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  duration: {
    fontSize: 12,
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
  },
  responseContainer: {
    gap: 8,
  },
  responseTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  responseScroll: {
    maxHeight: 200,
  },
  responseText: {
    fontSize: 11,
    fontFamily: 'monospace' as const,
    lineHeight: 16,
  },
  chatSection: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
    height: 400,
  },
  chatMessages: {
    flex: 1,
  },
  chatMessagesContent: {
    gap: 12,
    paddingBottom: 8,
  },
  messageContainer: {
    width: '100%' as const,
  },
  messageBubble: {
    maxWidth: '80%' as const,
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  messageRole: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  toolText: {
    fontSize: 12,
    fontStyle: 'italic' as const,
  },
  chatInputContainer: {
    flexDirection: 'row' as const,
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  chatInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});
