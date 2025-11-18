import { useState } from 'react';

const API_URL =
  'https://tdn.postb.ru/workbase/hs/DeliveryWebService/GetPerevozki?DateB=2024-01-01&DateE=2026-01-01';

export const LoginScreen = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResponseText(null);

    if (!login || !password) {
      setError('Введите логин и пароль');
      return;
    }

    try {
      setLoading(true);

      const basic = btoa(`${login}:${password}`);

      const res = await fetch(API_URL, {
        method: 'GET',
        headers: {
          // если сервер ждёт ровно заголовок Auth:
          Auth: `Basic ${basic}`,

          // классический вариант (если вдруг нужно будет):
          // Authorization: `Basic ${basic}`,
        },
      });

      const text = await res.text();

      if (!res.ok) {
        setError(`Ошибка ${res.status}: ${text || 'запрос не выполнен'}`);
        return;
      }

      setResponseText(text);
    } catch (err: any) {
      setError(err?.message || 'Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: 16,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>Авторизация Haulz</h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Логин</label>
          <input
            type="text"
            value={login}
            onChange={e => setLogin(e.target.value)}
            autoComplete="username"
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #555',
              background: 'transparent',
              color: 'inherit',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #555',
              background: 'transparent',
              color: 'inherit',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 4,
            padding: '10px 14px',
            borderRadius: 999,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14,
            background: '#2D5BFF',
            color: '#fff',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Входим…' : 'Войти'}
        </button>
      </form>

      {error && (
        <p style={{ marginTop: 12, color: '#ff6b6b', fontSize: 13 }}>
          {error}
        </p>
      )}

      {responseText && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 8,
            border: '1px solid #444',
            maxHeight: 200,
            overflow: 'auto',
            fontSize: 12,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {responseText}
        </div>
      )}
    </div>
  );
};
