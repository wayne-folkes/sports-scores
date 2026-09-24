export function normalizeHexColor(color: string | undefined, fallback: string): string {
  const cleaned = color?.replace('#', '').trim();
  if (!cleaned || !/^[\da-f]{6}$/i.test(cleaned)) {
    return fallback;
  }
  return `#${cleaned}`;
}

export function hexToRgb(hexColor: string): { r: number; g: number; b: number } {
  const value = hexColor.replace('#', '');
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

export function rgba(hexColor: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hexColor);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function mixColors(primaryHex: string, secondaryHex: string, weight = 0.5): string {
  const primary = hexToRgb(primaryHex);
  const secondary = hexToRgb(secondaryHex);
  const mix = (first: number, second: number) => Math.round(first * weight + second * (1 - weight));
  return `rgb(${mix(primary.r, secondary.r)}, ${mix(primary.g, secondary.g)}, ${mix(primary.b, secondary.b)})`;
}
