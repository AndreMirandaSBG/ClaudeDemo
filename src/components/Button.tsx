interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'operator' | 'function' | 'equals' | 'sci' | 'active-sci' | 'default';
  wide?: boolean;
  active?: boolean;
}

export function Button({ label, onClick, variant = 'default', wide = false, active = false }: ButtonProps) {
  return (
    <button
      className={[
        'calc-btn',
        `calc-btn--${variant}`,
        wide ? 'calc-btn--wide' : '',
        active ? 'calc-btn--active' : '',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
