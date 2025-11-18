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
        padding: 20,
        color: '#fff',
        fontFamily: 'system-ui',
        minHeight: '100vh',
      }}
    >
      <h1>Вы авторизованы</h1>
      <p>Теперь можно переходить ко второму экрану.</p>
    </div>
  );
};

export default App;
