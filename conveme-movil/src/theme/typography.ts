import { TextStyle } from 'react-native';

export const Typography: Record<string, TextStyle> = {
  display: { fontFamily: 'Galada', fontSize: 48, lineHeight: 56 },
  h1: { fontFamily: 'Galada', fontSize: 36, lineHeight: 44 },
  h2: { fontFamily: 'Galada', fontSize: 28, lineHeight: 34 },
  h3: { fontSize: 22, fontWeight: '600', lineHeight: 28 },
  h4: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  label: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  button: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  buttonSmall: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
};
