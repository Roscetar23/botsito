'use client';

import type { ChangeEvent } from 'react';
import styles from './auth-ui.module.css';

export interface FieldProps {
  label: string;
  type: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  icon?: string;
}

/**
 * Campo de formulario de marca: etiqueta en mayúsculas espaciada + input con
 * icono opcional. Presentacional; el estado lo maneja el formulario padre.
 */
export function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  minLength,
  icon,
}: FieldProps) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <span className={styles.inputWrap}>
        {icon && <span className={styles.inputIcon} aria-hidden="true">{icon}</span>}
        <input
          className={styles.input}
          type={type}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
        />
      </span>
    </label>
  );
}
