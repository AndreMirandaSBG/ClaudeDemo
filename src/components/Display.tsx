interface DisplayProps {
  value: string;
}

export function Display({ value }: DisplayProps) {
  const fontSize = value.length > 12 ? '1.5rem' : value.length > 9 ? '2rem' : '2.5rem';

  return (
    <div className="display" data-testid="display">
      <span style={{ fontSize }}>{value}</span>
    </div>
  );
}
