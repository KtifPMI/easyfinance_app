export const colors = {
  primary: '#2E7D32',
  primaryLight: '#E8F5E9',
  accent: '#1565C0',
  income: '#2E7D32',
  expense: '#D32F2F',
  transfer: '#1565C0',
  background: '#F5F6F8',
  card: '#FFFFFF',
  text: '#1A1C1E',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  warning: '#F59E0B',
  danger: '#DC2626',
  success: '#16A34A',
  white: '#FFFFFF',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyBold: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  small: { fontSize: 11, fontWeight: '400' as const },
};

export const theme = { colors, spacing, radius, typography };
export type Theme = typeof theme;
