'use client';

import { useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { EyeIcon, EyeOffIcon } from './icons.js';
import styles from './auth-ui.module.css';

export interface FieldProps {
  label: string;
  type: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  icon?: ReactNode;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  /** Elemento a la derecha del label (p. ej. enlace "¿La olvidaste?"). */
  labelAside?: ReactNode;
}

/**
 * Campo de marca: fila de label (+ aside opcional) e input con icono a la
 * izquierda; si es contraseña, añade un botón "ojo" para mostrar/ocultar.
 * Presentacional; el estado del valor lo maneja el formulario padre.
 */
export function Field({
  label,
  type,
  value,
  onChange,
  icon,
  placeholder,
  autoComplete,
  required,
  minLength,
  labelAside,
}: FieldProps) {
  const [reveal, setReveal] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && reveal ? 'text' : type;

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={styles.label}>{label}</label>
        {labelAside}
      </div>
      <div className={styles.inputWrap}>
        {icon && <span className={styles.inputIcon}>{icon}</span>}
        <input
          className={styles.input}
          type={inputType}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
        />
        {isPassword && (
          <button
            type="button"
            className={styles.reveal}
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {reveal ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
    </div>
  );
}
