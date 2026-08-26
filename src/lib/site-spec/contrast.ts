function parseHex(color: string): [number, number, number] | null {
  const hex = color.replace("#", "").trim();
  if (!/^[\da-fA-F]{6}$/.test(hex)) {
    return null;
  }
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
}

function relativeLuminance(rgb: [number, number, number]): number {
  const channel = rgb.map((value) => {
    const srgb = value / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2];
}

export function contrastRatio(a: string, b: string): number | null {
  const left = parseHex(a);
  const right = parseHex(b);
  if (!left || !right) {
    return null;
  }
  const l1 = relativeLuminance(left);
  const l2 = relativeLuminance(right);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function hasUsefulContrast(foreground: string, background: string): boolean {
  const ratio = contrastRatio(foreground, background);
  return ratio === null ? true : ratio >= 4.5;
}

export function colorDistance(a: string, b: string): number {
  const left = parseHex(a);
  const right = parseHex(b);
  if (!left || !right) {
    return a === b ? 0 : 1;
  }
  const distance = Math.sqrt(
    (left[0] - right[0]) ** 2 +
      (left[1] - right[1]) ** 2 +
      (left[2] - right[2]) ** 2,
  );
  return distance / Math.sqrt(255 ** 2 * 3);
}
