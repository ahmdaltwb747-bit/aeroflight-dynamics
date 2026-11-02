import type { UnitSystem } from '@/lib/units';

interface UnitToggleProps {
  sys: UnitSystem;
  onChange: (sys: UnitSystem) => void;
}

export function UnitToggle({ sys, onChange }: UnitToggleProps) {
  const options: Array<{ key: UnitSystem; label: string }> = [
    { key: 'imperial', label: 'Imperial' },
    { key: 'metric', label: 'SI' },
  ];
  return (
    <div
      className="inline-flex rounded-lg border border-border bg-muted/60 p-0.5"
      role="group"
      aria-label="Unit system"
    >
      {options.map(o => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          aria-pressed={sys === o.key}
          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${
            sys === o.key
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
