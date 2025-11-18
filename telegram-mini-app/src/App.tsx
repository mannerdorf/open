import React, { useState, FormEvent } from 'react';

const API_URL =
  'https://tdn.postb.ru/workbase/hs/DeliveryWebService/GetPerevozki?DateB=2024-01-01&DateE=2026-01-01';

export const LoginScreen: React.FC = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
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
          // как ты и писал: заголовок Auth с Basic
          Auth: `Basic ${basic}`,
          // Authorization: `Basic ${basic}`, // на всякий случай, если потом понадобится классика
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
        minHeight: '100vh',
        padding: '32px 16px',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#05060A',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
        }}
      >
        {/* Иконка */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 999,
            background: 'rgba(45, 91, 255, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <span
            style={{
              fontSize: 36,
              color: '#2D5BFF',
            }}
          >
            📦
          </span>
        </div>

        {/* Заголовок */}
        <h1
          style={{
            margin: '0 0 12px',
            fontSize: 24,
            fontWeight: 800,
            textAlign: 'center',
          }}
        >
          Введите логин и пароль
        </h1>

        <p
          style={{
            margin: '0 0 24px',
            fontSize: 14,
            lineHeight: 1.4,
            textAlign: 'center',
            opacity: 0.8,
          }}
        >
          Используйте ваши учетные данные для доступа к перевозкам
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div>
            <label
              style={{
                fontSize: 13,
                marginBottom: 6,
                display: 'block',
                opacity: 0.9,
              }}
            >
              Логин (email)
            </label>
            <div
              style={{
                borderRadius: 18,
                background: '#05070E',
                border: '1px solid #202230',
                padding: '10px 14px',
              }}
            >
              <input
                type="text"
                value={login}
                onChange={e => setLogin(e.target.value)}
                placeholder="Логин (email)"
                autoComplete="username"
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: '#ffffff',
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                fontSize: 13,
                marginBottom: 6,
                display: 'block',
                opacity: 0.9,
              }}
            >
              Пароль
            </label>
            <div
              style={{
                borderRadius: 18,
                background: '#05070E',
                border: '1px solid #202230',
                padding: '10px 14px',
              }}
            >
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Пароль"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: '#ffffff',
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 10,
              width: '100%',
              padding: '14px 18px',
              borderRadius: 20,
              border: 'none',
              outline: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 15,
              background: '#2D5BFF',
              color: '#ffffff',
              boxShadow: '0 10px 24px rgba(45, 91, 255, 0.45)',
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? 'Проверяем…' : 'Подтвердить'}
          </button>
        </form>

        {error && (
          <p
            style={{
              marginTop: 12,
              fontSize: 13,
              color: '#ff6b6b',
              textAlign: 'center',
            }}
          >
            {error}
          </p>
        )}

        {responseText && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 12,
              border: '1px solid #202230',
              background: '#05070E',
              maxHeight: 220,
              overflow: 'auto',
              fontSize: 11,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {responseText}
          </div>
        )}
      </div>
    </div>
  );
};
