interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'operator' | 'function' | 'equals' | 'default';
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
      ].join(' ').trim()}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
