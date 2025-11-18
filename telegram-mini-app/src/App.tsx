import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Telegram?: any;
  }
}

const App = () => {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    tg.ready();
    tg.expand();

    const user = tg.initDataUnsafe?.user;
    if (user) {
      setUsername(user.first_name || user.username || null);
    }

    tg.MainButton.setText('Закрыть');
    tg.MainButton.show();
    tg.MainButton.onClick(() => tg.close());
  }, []);

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui' }}>
      <h1>Haulz mini app</h1>
      {username ? (
        <p>Привет, {username}!</p>
      ) : (
        <p>Запущено внутри Telegram Mini App</p>
      )}
      <p style={{ fontSize: 12, opacity: 0.7 }}>
        Этот экран потом заменим на реальный функционал.
      </p>
    </div>
  );
};

export default App;
