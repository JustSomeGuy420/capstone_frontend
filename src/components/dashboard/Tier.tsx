export type TierValue = 'strong_fit' | 'good_fit' | 'partial_fit' | 'low_fit';

const LABELS: Record<TierValue, string> = {
  strong_fit:  'Strong fit',
  good_fit:    'Good fit',
  partial_fit: 'Partial fit',
  low_fit:     'Low fit',
};

const CLASSES: Record<TierValue, string> = {
  strong_fit:  'strong',
  good_fit:    'good',
  partial_fit: 'partial',
  low_fit:     'low',
};

export function Tier({ value }: { value: TierValue | string }) {
  const cls = CLASSES[value as TierValue] ?? 'good';
  const label = LABELS[value as TierValue] ?? value;
  return <span className={`tier ${cls}`}>{label}</span>;
}
