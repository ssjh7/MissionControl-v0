import type { StatusLevel } from '../types';

interface Props {
  status: StatusLevel;
  size?: number;
  pulse?: boolean;
}

const COLOR: Record<StatusLevel, string> = {
  active:  '#22c55e',
  idle:    '#eab308',
  offline: '#ef4444',
};

export function StatusLight({ status, size = 10, pulse = true }: Props) {
  const color = COLOR[status];
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        boxShadow: pulse && status !== 'offline' ? `0 0 6px 2px ${color}66` : undefined,
        flexShrink: 0,
      }}
      title={status}
    />
  );
}
