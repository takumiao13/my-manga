
export default function verName(value) {
  const parts = value.split('.');
  return (parts[1] || parts[0]).toUpperCase();
}