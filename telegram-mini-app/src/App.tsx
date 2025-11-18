import { useEffect } from 'react';
import { LoginScreen } from './screens/LoginScreen';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

const App = () => {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    tg.ready();
    tg.expand();

    // Пока main button просто закрывает мини-апп
    tg.MainButton.setText('Закрыть');
    tg.MainButton.show();
    tg.MainButton.onClick(() => tg.close());
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <LoginScreen />
    </div>
  );
};

export default App;
