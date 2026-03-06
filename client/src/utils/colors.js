export function normalizeHexColor(color, fallback) {
  const cleaned = color?.replace('#', '').trim();
  if (!cleaned || !/^[\da-f]{6}$/i.test(cleaned)) {
    return fallback;
  }
  return `#${cleaned}`;
}

export function hexToRgb(hexColor) {
  const value = hexColor.replace('#', '');
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

export function rgba(hexColor, alpha) {
  const { r, g, b } = hexToRgb(hexColor);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function mixColors(primaryHex, secondaryHex, weight = 0.5) {
  const primary = hexToRgb(primaryHex);
  const secondary = hexToRgb(secondaryHex);
  const mix = (first, second) => Math.round(first * weight + second * (1 - weight));
  return `rgb(${mix(primary.r, secondary.r)}, ${mix(primary.g, secondary.g)}, ${mix(primary.b, secondary.b)})`;
}
