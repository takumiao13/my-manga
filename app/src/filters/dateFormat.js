import dateFn from '@/helpers/date';

export default function dateFormat(value, pattern = 'yyyy-mm-dd HH:MM') {
  const d = new Date(value);
  if (isNaN(d)) return '';
  return dateFn.format(new Date(value), pattern);
}