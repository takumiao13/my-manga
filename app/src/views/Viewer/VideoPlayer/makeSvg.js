

export default function(svgText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const svg = doc.children[0];
  svg.classList.add('svg-icon');
  svg.setAttribute('width', 16);
  svg.setAttribute('height', 16);
  return svg;
}