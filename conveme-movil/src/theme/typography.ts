import { Platform } from 'react-native';

export const Typography = {
  // Galada - branding/titles
  display: { fontFamily: 'Galada', fontSize: 48, lineHeight: 56 },
  h1: { fontFamily: 'Galada', fontSize: 36, lineHeight: 44 },
  h2: { fontFamily: 'Galada', fontSize: 28, lineHeight: 34 },
  h3: { fontFamily: 'Galada', fontSize: 22, lineHeight: 28 },
  // System fonts for body
  bodyLg: { fontSize: 18, fontWeight: '400' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodySm: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  label: { fontSize: 14, fontWeight: '600' as const },
  button: { fontSize: 16, fontWeight: '600' as const },
  price: { fontFamily: 'Galada', fontSize: 24, lineHeight: 30 },
  stat: { fontFamily: 'Galada', fontSize: 32, lineHeight: 40 },
};
