import { Color } from '@api/models';

export interface Tone {
  light: string;
  dark: string;
}

// Categorical palette (colour-blind-safe order, same as sentry's charts); the dark column is the same
// hue stepped for the dark surface. Projects and tasks store the key, never the value.
export const COLORS: Record<Color, Tone> = {
  [Color.Blue]: { light: '#2a78d6', dark: '#3987e5' },
  [Color.Orange]: { light: '#eb6834', dark: '#d95926' },
  [Color.Green]: { light: '#1baf7a', dark: '#199e70' },
  [Color.Yellow]: { light: '#eda100', dark: '#c98500' },
  [Color.Pink]: { light: '#e87ba4', dark: '#d55181' },
  [Color.Teal]: { light: '#008300', dark: '#0ca30c' },
  [Color.Purple]: { light: '#6250d6', dark: '#9085e9' },
  [Color.Red]: { light: '#e34948', dark: '#e66767' },
  [Color.Gray]: { light: '#898781', dark: '#898781' },
};

export const COLOR_KEYS = Object.keys(COLORS) as Color[];

export function colorOf(color: Color | undefined, dark: boolean): string {
  const tone = COLORS[color ?? Color.Gray];
  return dark ? tone.dark : tone.light;
}

// Text colour that stays readable on the given background (#rrggbb): dark on light fills, white on dark ones.
export function textOn(background: string): string {
  const [red, green, blue] = [1, 3, 5].map((index) => {
    const channel = parseInt(background.slice(index, index + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  // Whichever of white and near-black has the higher contrast ratio against the fill.
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.06 ? '#ffffff' : '#18181b';
}
