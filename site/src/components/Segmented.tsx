import { useId } from 'react';

interface Props<T extends string> {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  column?: boolean;
}

export function Segmented<T extends string>({ label, value, options, onChange, column }: Props<T>) {
  const name = useId();
  return (
    <div className={`field${column ? ' field-col' : ''}`} role="radiogroup" aria-label={label}>
      <span aria-hidden="true">{label}</span>
      <div className="seg">
        {options.map((o) => (
          <label key={o} className="seg-opt">
            <input type="radio" name={name} checked={value === o} onChange={() => onChange(o)} />
            {o}
          </label>
        ))}
      </div>
    </div>
  );
}
