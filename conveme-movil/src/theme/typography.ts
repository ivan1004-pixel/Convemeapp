import { TextStyle } from 'react-native';

export const Typography: Record<string, TextStyle> = {
  // Galada solo para títulos de impacto (Brand)
  display: { fontFamily: 'Galada', fontSize: 42, lineHeight: 50 },
  h1: { fontFamily: 'Galada', fontSize: 32, lineHeight: 40 },
  
  // Montserrat/Sans para UI e información crítica
  h2: { fontSize: 24, fontWeight: '900', lineHeight: 30, textTransform: 'uppercase' },
  h3: { fontSize: 20, fontWeight: '800', lineHeight: 26, textTransform: 'uppercase' },
  h4: { fontSize: 16, fontWeight: '900', lineHeight: 22, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  body: { fontSize: 16, fontWeight: '500', lineHeight: 24 },
  bodyBold: { fontSize: 16, fontWeight: '700', lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  
  caption: { fontSize: 12, fontWeight: '600', lineHeight: 16, color: '#595959' },
  label: { fontSize: 12, fontWeight: '900', lineHeight: 18, textTransform: 'uppercase', letterSpacing: 1 },
  
  button: { fontSize: 14, fontWeight: '900', lineHeight: 20, textTransform: 'uppercase', letterSpacing: 1 },
  buttonSmall: { fontSize: 12, fontWeight: '900', lineHeight: 18, textTransform: 'uppercase', letterSpacing: 0.5 },
};
