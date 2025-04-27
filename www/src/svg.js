export function createSVGElement(name, attrs = {}, style = {}) {
  const SVG_NS = 'http://www.w3.org/2000/svg';
	const element = document.createElementNS(SVG_NS, name);
	setAttributes(element, attrs);
	Object.assign(element.style, style);
	return element;
}

export function setAttributes(element, attrs) {
	for (const [key, value] of Object.entries(attrs)) {
		element.setAttribute(key, value);
	}
	return element;
}

export function setStyle(elem, style) {
  Object.assign(elem.style, style);
  return elem;
}

export function setInnerHTML(elem, html) {
  elem.innerHTML = html;
  return elem;
}

