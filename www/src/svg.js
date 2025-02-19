export function createSVGElement(name, attrs = {}, style = {}) {
  const SVG_NS = 'http://www.w3.org/2000/svg';
	const e = document.createElementNS(SVG_NS, name);
	for (const [key, value] of Object.entries(attrs)) {
		e.setAttribute(key, value);
	}
	for (const [key, value] of Object.entries(style)) {
		e.style[key] = value;
	}
	return e;
}

