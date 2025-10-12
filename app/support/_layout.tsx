import { Stack } from 'expo-router';

export default function SupportLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen 
        name="chat" 
        options={{
          title: 'Чат поддержки',
        }}
      />
      <Stack.Screen 
        name="faq" 
        options={{
          title: 'Часто задаваемые вопросы',
        }}
      />
      <Stack.Screen 
        name="report-error" 
        options={{
          title: 'Сообщить об ошибке',
        }}
      />
    </Stack>
  );
}
