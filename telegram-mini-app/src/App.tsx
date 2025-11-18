import { useState, useEffect } from 'react';
import { LoginScreen } from './screens/LoginScreen';

declare global {
  interface Window {
    Telegram?: { WebApp?: any };
  }
}

const App = () => {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    tg.ready();
    tg.expand();

    tg.MainButton.setText('Закрыть');
    tg.MainButton.show();
    tg.MainButton.onClick(() => tg.close());
  }, []);

  if (!authorized) {
    return <LoginScreen onSuccess={() => setAuthorized(true)} />;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 20,
        background: '#ffffff',
        color: '#000000',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <h1>Вы авторизованы</h1>
      <p>Дальше сюда добавим второй экран с данными.</p>
    </div>
  );
};

export default App;
