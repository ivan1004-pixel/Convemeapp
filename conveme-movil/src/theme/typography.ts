import { TextStyle } from 'react-native';

export const Typography: Record<string, TextStyle> = {
  display: { fontFamily: 'Galada', fontSize: 48, lineHeight: 56 },
  h1: { fontFamily: 'Galada', fontSize: 36, lineHeight: 44 },
  h2: { fontFamily: 'Galada', fontSize: 28, lineHeight: 34 },
  h3: { fontSize: 22, fontWeight: '800', lineHeight: 28 }, // More impact
  h4: { fontSize: 18, fontWeight: '800', lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '600', lineHeight: 24 }, // Slightly heavier for neobrutalism
  bodySmall: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  label: { fontSize: 14, fontWeight: '900', lineHeight: 20, letterSpacing: 0.5 }, // Strong labels
  button: { fontSize: 16, fontWeight: '900', lineHeight: 24, letterSpacing: 1 },
  buttonSmall: { fontSize: 14, fontWeight: '900', lineHeight: 20, letterSpacing: 0.5 },
};
