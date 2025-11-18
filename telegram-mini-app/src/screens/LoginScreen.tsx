import React, { useState, FormEvent } from 'react';

const API_URL =
  'https://tdn.postb.ru/workbase/hs/DeliveryWebService/GetPerevozki?DateB=2024-01-01&DateE=2026-01-01';

const SERVICE_AUTH = 'Basic YWRtaW46anVlYmZueWU='; // как в твоем curl

export const LoginScreen: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!login || !password) {
      setError('Введите логин и пароль');
      return;
    }

    try {
      setLoading(true);

      const raw = `${login}:${password}`;

      const res = await fetch(API_URL, {
        method: 'GET',
        headers: {
          Auth: `Basic ${raw}`,
          Authorization: SERVICE_AUTH,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        setError(`Ошибка ${res.status}: ${text || 'запрос не выполнен'}`);
        return;
      }

      // Если добрались сюда → авторизация успешна
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, color: '#fff', fontFamily: 'system-ui' }}>
      <h2>Авторизация</h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          placeholder="Логин"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          style={{ padding: 10, borderRadius: 8 }}
        />

        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10, borderRadius: 8 }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 12,
            borderRadius: 8,
            background: '#2D5BFF',
            color: '#fff',
            fontWeight: 600,
          }}
        >
          {loading ? 'Проверяем...' : 'Войти'}
        </button>
      </form>

      {error && <p style={{ marginTop: 10, color: 'red' }}>{error}</p>}
    </div>
  );
};
