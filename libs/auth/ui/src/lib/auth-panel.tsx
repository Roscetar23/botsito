'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from './auth-context.js';
import { AuthApiError } from './auth-types.js';
import { Field } from './field.js';
import { MailIcon, LockIcon, UserIcon } from './icons.js';
import styles from './auth-ui.module.css';

type Mode = 'login' | 'register';

const COPY = {
  login: { title: 'Vuelve a la misión.', subtitle: 'Inicia sesión para continuar donde lo dejaste.', cta: 'Entrar a Botcito' },
  register: { title: 'Activa tu Botcito.', subtitle: 'Crea tu espacio de trabajo en menos de un minuto.', cta: 'Crear mi cuenta' },
};

/**
 * Formulario de acceso (lado derecho del split): portal + título, tabs
 * login/registro, campos con icono, checkbox y botón de marca. Envía al
 * backend vía `useAuth`; al autenticar, `AuthProvider` muestra la app.
 */
export function AuthPanel() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';
  const copy = COPY[mode];

  function pick(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (isRegister && !terms) {
      setError('Debes aceptar los términos de servicio');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (isRegister) await register({ email, password, displayName: displayName || undefined });
      else await login({ email, password });
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : 'Ocurrió un error inesperado');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <p className={styles.kicker}>Portal de control</p>
      <div className={styles.pane} key={`${mode}-head`}>
        <h1 className={styles.title}>{copy.title}</h1>
        <p className={styles.subtitle}>{copy.subtitle}</p>
      </div>

      <div className={styles.tabs} role="tablist">
        <button type="button" role="tab" aria-selected={!isRegister}
          className={`${styles.tab} ${!isRegister ? styles.tabActive : ''}`.trim()} onClick={() => pick('login')}>
          Iniciar sesión
        </button>
        <button type="button" role="tab" aria-selected={isRegister}
          className={`${styles.tab} ${isRegister ? styles.tabActive : ''}`.trim()} onClick={() => pick('register')}>
          Crear cuenta
        </button>
      </div>

      <div className={styles.pane} key={`${mode}-body`}>
      {error && <p className={styles.error} role="alert">{error}</p>}

      {isRegister && (
        <Field label="Nombre" type="text" value={displayName} onChange={setDisplayName}
          icon={<UserIcon />} placeholder="Cómo te llamamos" autoComplete="name" />
      )}
      <Field label="Correo electrónico" type="email" value={email} onChange={setEmail}
        icon={<MailIcon />} placeholder="tu@correo.com" autoComplete="email" required />
      <Field label="Contraseña" type="password" value={password} onChange={setPassword}
        icon={<LockIcon />} placeholder="Mínimo 8 caracteres" minLength={8} required
        autoComplete={isRegister ? 'new-password' : 'current-password'}
        labelAside={!isRegister && <span className={styles.aside}>¿La olvidaste?</span>} />

      <label className={styles.check}>
        <input type="checkbox" checked={isRegister ? terms : remember}
          onChange={(e) => (isRegister ? setTerms : setRemember)(e.target.checked)} />
        {isRegister ? (
          <span>Acepto los <span className={styles.link}>términos de servicio</span> y la política de privacidad.</span>
        ) : (
          <span>Mantener mi sesión activa</span>
        )}
      </label>

      <button className={styles.button} type="submit" disabled={submitting}>
        {submitting ? 'Enviando…' : `${copy.cta} →`}
      </button>
      </div>

      <p className={styles.switch}>
        {isRegister ? '¿Ya formas parte de Botcito? ' : '¿Aún no tienes acceso? '}
        <button type="button" className={styles.link} onClick={() => pick(isRegister ? 'login' : 'register')}>
          {isRegister ? 'Inicia sesión' : 'Crea una cuenta'}
        </button>
      </p>

      <p className={styles.legal}>© 2026 BOTCITO · HECHO PARA CREAR</p>
    </form>
  );
}
