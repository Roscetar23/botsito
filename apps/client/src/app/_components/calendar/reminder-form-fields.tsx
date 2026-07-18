import type { ReactNode } from 'react';
import styles from './calendar.module.css';

interface SelectFieldProps<T extends string> {
  id: string;
  label: string;
  value: T;
  options: Record<T, string>;
  onChange: (value: T) => void;
  /** Adorno opcional junto a la etiqueta, p. ej. el punto de color del tipo seleccionado. */
  indicator?: ReactNode;
}

/** Select genérico (tipo/frecuencia) con la misma etiqueta y estilo que el resto del formulario. */
export function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  indicator,
}: SelectFieldProps<T>) {
  return (
    <div className={styles.formField}>
      <label className={styles.formLabel} htmlFor={id}>
        {label}
        {indicator}
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

interface CountFieldProps {
  value: number;
  onChange: (value: number) => void;
}

/** Campo "Nº de veces" del formulario, solo visible cuando la frecuencia no es "una vez". */
export function CountField({ value, onChange }: CountFieldProps) {
  return (
    <div className={styles.formField}>
      <label className={styles.formLabel} htmlFor="reminder-count">
        Nº de veces
      </label>
      <input
        id="reminder-count"
        type="number"
        min={1}
        max={365}
        className={styles.formInput}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
