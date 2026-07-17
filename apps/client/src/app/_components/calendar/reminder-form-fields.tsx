import type { ReactNode } from 'react';
import styles from './calendar.module.css';

interface SelectFieldProps<T extends string> {
  id: string;
  label: string;
  value: T;
  options: Record<T, string>;
  onChange: (value: T) => void;
}

/** Select genérico (tipo/frecuencia) con la misma etiqueta y estilo que el resto del formulario. */
export function SelectField<T extends string>({ id, label, value, options, onChange }: SelectFieldProps<T>) {
  return (
    <div className={styles.formField}>
      <label className={styles.formLabel} htmlFor={id}>
        {label}
      </label>
      <select id={id} className={styles.formSelect} value={value} onChange={(event) => onChange(event.target.value as T)}>
        {Object.entries(options).map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel as ReactNode}
          </option>
        ))}
      </select>
    </div>
  );
}
