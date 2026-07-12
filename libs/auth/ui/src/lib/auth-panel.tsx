'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from './auth-context.js';
import { AuthApiError } from './auth-types.js';
import { Field } from './field.js';
import styles from './auth-ui.module.css';

type Mode = 'login' | 'register';

/**
 * Panel de acceso con la identidad de marca BotCito: icono, título/subtítulo,
 * campos (registro añade nombre, confirmar contraseña y términos), botón
 * morado y toggle login↔registro. Envía al backend vía `useAuth`; al
 * autenticar, `AuthProvider` cambia el estado y se muestra la app.
 */
export function AuthPanel() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

  function switchMode() {
    setMode(isRegister ? 'login' : 'register');
    setError(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (isRegister && password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (isRegister && !terms) {
      setError('Debes aceptar los Términos de Servicio');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (isRegister) {
        await register({ email, password, displayName: displayName || undefined });
      } else {
        await login({ email, password });
      }
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : 'Ocurrió un error inesperado');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.card} onSubmit={onSubmit}>
      <span className={styles.badge} aria-hidden="true">⚡</span>
      <div className={styles.head}>
        <h2 className={styles.title}>{isRegister ? 'Crear cuenta' : 'Iniciar sesión'}</h2>
        <p className={styles.subtitle}>
          {isRegister
            ? 'Únete al futuro de tu asistente virtual.'
            : 'Bienvenido de vuelta a BotCito.'}
        </p>
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.fields}>
        {isRegister && (
          <Field
            label="Nombre completo"
            type="text"
            value={displayName}
            onChange={setDisplayName}
            placeholder="Juan Pérez"
            autoComplete="name"
            icon="👤"
          />
        )}
        <Field
          label="Correo"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="nombre@empresa.com"
          autoComplete="email"
          required
        />
        <div className={isRegister ? styles.row : undefined}>
          <Field
            label="Contraseña"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            minLength={isRegister ? 8 : undefined}
            icon="🔒"
            required
          />
          {isRegister && (
            <Field
              label="Confirmar"
              type="password"
              value={confirm}
              onChange={setConfirm}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          )}
        </div>

        {isRegister && (
          <label className={styles.terms}>
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
            Acepto los <span className={styles.termsLink}>Términos de Servicio</span>
          </label>
        )}

        <button className={styles.button} type="submit" disabled={submitting}>
          {submitting ? 'Enviando…' : isRegister ? 'Registrarme →' : 'Entrar →'}
        </button>
      </div>

      <p className={styles.toggle}>
        {isRegister ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
        <button type="button" className={styles.link} onClick={switchMode}>
          {isRegister ? 'Inicia sesión' : 'Regístrate'}
        </button>
      </p>

      <div className={styles.footerBadges} aria-hidden="true">
        <span>🔒 CIFRADO AES-256</span>
        <span>🤖 AVATAR IA</span>
      </div>
    </form>
  );
}
