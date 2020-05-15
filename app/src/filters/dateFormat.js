import dateFn from '@/helpers/date';

export default function dateFormat(value) {
  const d = new Date(value);
  if (isNaN(d)) return '';
  return dateFn.format(new Date(value), 'yyyy-mm-dd HH:MM');
}