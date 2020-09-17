
export default function stripVer(value) {
  const striped = value.replace(/(?:\s\[[^\]]*?\]){0,}(?:\.\w{3,4})?$/g, '');
  return striped
}