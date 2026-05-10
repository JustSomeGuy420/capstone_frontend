export type TierValue = 'strong_fit' | 'data_gap' | 'partial_fit';

// Normalize legacy tier values produced before the 3-tier consolidation
const LEGACY: Record<string, string> = {
  fully_qualified:    'strong_fit',
  skill_gap:          'partial_fit',
  below_requirements: 'partial_fit',
  good_fit:           'strong_fit',
};

const LABELS: Record<string, string> = {
  strong_fit:  'Strong fit',
  data_gap:    'Data gap',
  partial_fit: 'Partial fit',
};

const CLASSES: Record<string, string> = {
  strong_fit:  'strong',
  data_gap:    'good',
  partial_fit: 'partial',
};

export function Tier({ value }: { value: TierValue | string }) {
  const normalized = LEGACY[value] ?? value;
  const cls = CLASSES[normalized] ?? 'partial';
  const label = LABELS[normalized] ?? normalized;
  return <span className={`tier ${cls}`}>{label}</span>;
}
