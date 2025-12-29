export const colors = {
  // Primary brand colors - Modern Purple/Blue gradient theme
  primary: '#6366F1', // Indigo
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  primarySoft: '#EEF2FF',
  
  // Accent colors
  accent: '#10B981', // Emerald
  accentDark: '#059669',
  accentLight: '#34D399',
  accentSoft: '#DCFCE7',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  
  // Neutral colors - Dark theme for main app
  background: '#0F172A', // Dark slate
  surface: '#1E293B',
  surfaceLight: '#334155',
  surfaceElevated: '#475569',
  
  // Auth screen colors - Light modern theme
  authBackground: '#F8FAFF', // Very light blue-white
  authSurface: '#FFFFFF',
  authSurfaceElevated: '#FFFFFF',
  authText: '#1E293B',
  authTextSecondary: '#64748B',
  authTextMuted: '#94A3B8',
  authBorder: '#E2E8F0',
  authBorderFocus: '#6366F1',
  authInputBg: '#F8FAFF',
  
  // Text colors
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textDisabled: '#64748B',
  
  // Border and dividers
  border: '#334155',
  borderLight: '#475569',
  divider: '#1E293B',
  
  // Special colors
  gold: '#FBBF24',
  purple: '#A78BFA',
  pink: '#F472B6',
  
  // Gradients - MUST be arrays for LinearGradient
  gradientPrimary: ['#6366F1', '#8B5CF6'], // Professional indigo to purple
  gradientAccent: ['#10B981', '#059669'], // Success green
  gradientGold: ['#F59E0B', '#F97316'], // Warm orange-gold
  gradientPurple: ['#8B5CF6', '#A78BFA'], // Soft purple
  gradientPink: ['#EC4899', '#F472B6'], // Vibrant pink
  gradientOrange: ['#F59E0B', '#EF4444'], // Orange gradient for streak
  gradientBlue: ['#3B82F6', '#2563EB'], // Professional blue
  gradientTeal: ['#14B8A6', '#0D9488'], // Modern teal
  gradientAuth: ['#667EEA', '#764BA2'], // Beautiful purple gradient for auth
  gradientAuthLight: ['#F8FAFF', '#FFFFFF'], // Clean white background
  gradientPurpleLight: ['#F5F3FF', '#EDE9FE'], // Very light purple for backgrounds
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const typography = {
  display: {
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 40,
  },
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  small: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 12,
  },
};

export const animations = {
  fast: 150,
  normal: 250,
  slow: 350,
};
