'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from './auth-context.js';
import { AuthApiError } from './auth-types.js';
import styles from './auth-ui.module.css';

type Mode = 'login' | 'register';

/**
 * Panel de acceso: alterna login/registro, envía credenciales al backend
 * vía `useAuth` y muestra errores legibles. Al autenticar, `AuthProvider`
 * cambia el estado y el `apps/client` muestra la app.
 */
export function AuthPanel() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isRegister) {
        await register({ email, password, displayName: displayName || undefined });
      } else {
        await login({ email, password });
      }
    } catch (err) {
      const msg =
        err instanceof AuthApiError ? err.message : 'Ocurrió un error inesperado';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.card} onSubmit={onSubmit}>
      <h2 className={styles.title}>{isRegister ? 'Crear cuenta' : 'Iniciar sesión'}</h2>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.form}>
        {isRegister && (
          <label className={styles.field}>
            Nombre (opcional)
            <input
              className={styles.input}
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              maxLength={120}
            />
          </label>
        )}
        <label className={styles.field}>
          Email
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className={styles.field}>
          Contraseña
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            minLength={isRegister ? 8 : undefined}
            required
          />
        </label>
        <button className={styles.button} type="submit" disabled={submitting}>
          {submitting ? 'Enviando…' : isRegister ? 'Registrarme' : 'Entrar'}
        </button>
      </div>

      <p className={styles.toggle}>
        {isRegister ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
        <button
          type="button"
          className={styles.link}
          onClick={() => {
            setMode(isRegister ? 'login' : 'register');
            setError(null);
          }}
        >
          {isRegister ? 'Inicia sesión' : 'Regístrate'}
        </button>
      </p>
    </form>
  );
}
