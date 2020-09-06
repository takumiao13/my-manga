
export default function stripVer(value) {
  const striped = value.replace(/(?:\s\[[^\]]*?\]){0,}$/g, '');
  return striped
}