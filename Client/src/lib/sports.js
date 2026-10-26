export const FORMATS = {
  single_elimination: 'Single elimination',
  round_robin: 'Round robin',
};

export const ACCENTS = [
  { bg: '#e7f1d3', fg: '#2b541f', dot: '#5f8f3e' },
  { bg: '#fde6d3', fg: '#8a3d14', dot: '#dc7a3a' },
  { bg: '#dcebe8', fg: '#15564b', dot: '#2e8c78' },
  { bg: '#eee3f4', fg: '#5b2d70', dot: '#9058a8' },
  { bg: '#f6e6d8', fg: '#6e4a25', dot: '#b58a55' },
  { bg: '#dfe8f6', fg: '#254474', dot: '#587cb8' },
];

export function accentFor(value = '') {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) % 997;
  return ACCENTS[hash % ACCENTS.length];
}

export function sportInitials(name = '') {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

export const STATUS = {
  scheduled: { label: 'Scheduled', tone: 'blue' },
  ongoing: { label: 'Live now', tone: 'orange' },
  completed: { label: 'Final', tone: 'green' },
};
