export interface PaletteTheme {
  background: string;
  surface: string;
  primary: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
}

export interface PaletteDefinition {
  name: string;
  primary: string;
  lightTheme: PaletteTheme;
  darkTheme: PaletteTheme;
}

export const PALETTES: PaletteDefinition[] = [
  {
    name: 'Corporate Blue (Default)',
    primary: '#1E90FF',
    lightTheme: {
      background: '#F8FAFC',
      surface: '#FFFFFF',
      primary: '#1E90FF',
      textPrimary: '#0F172A',
      textSecondary: '#64748B',
      border: '#E2E8F0',
      success: '#16A34A',
      warning: '#F59E0B',
      danger: '#DC2626',
    },
    darkTheme: {
      background: '#0B1220',
      surface: '#111827',
      primary: '#3BA4FF',
      textPrimary: '#F1F5F9',
      textSecondary: '#94A3B8',
      border: '#1F2937',
      success: '#22C55E',
      warning: '#FBBF24',
      danger: '#EF4444',
    },
  },
  {
    name: 'Emerald Finance',
    primary: '#10B981',
    lightTheme: {
      background: '#F9FAFB',
      surface: '#FFFFFF',
      primary: '#10B981',
      textPrimary: '#111827',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      success: '#059669',
      warning: '#D97706',
      danger: '#DC2626',
    },
    darkTheme: {
      background: '#0F172A',
      surface: '#111827',
      primary: '#34D399',
      textPrimary: '#E5E7EB',
      textSecondary: '#9CA3AF',
      border: '#1F2937',
      success: '#22C55E',
      warning: '#FBBF24',
      danger: '#EF4444',
    },
  },
  {
    name: 'Royal Purple Business',
    primary: '#7C3AED',
    lightTheme: {
      background: '#FAFAFF',
      surface: '#FFFFFF',
      primary: '#7C3AED',
      textPrimary: '#1F2937',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      success: '#16A34A',
      warning: '#F59E0B',
      danger: '#DC2626',
    },
    darkTheme: {
      background: '#0F1020',
      surface: '#18181B',
      primary: '#A78BFA',
      textPrimary: '#F3F4F6',
      textSecondary: '#A1A1AA',
      border: '#27272A',
      success: '#22C55E',
      warning: '#FBBF24',
      danger: '#F87171',
    },
  },
  {
    name: 'Teal Professional',
    primary: '#0EA5A4',
    lightTheme: {
      background: '#F0FDFA',
      surface: '#FFFFFF',
      primary: '#0EA5A4',
      textPrimary: '#0F172A',
      textSecondary: '#64748B',
      border: '#D1FAE5',
      success: '#16A34A',
      warning: '#F59E0B',
      danger: '#DC2626',
    },
    darkTheme: {
      background: '#0B1F1F',
      surface: '#123232',
      primary: '#2DD4BF',
      textPrimary: '#E6FFFA',
      textSecondary: '#99F6E4',
      border: '#134E4A',
      success: '#22C55E',
      warning: '#FBBF24',
      danger: '#F87171',
    },
  },
  {
    name: 'Executive Gold',
    primary: '#D4AF37',
    lightTheme: {
      background: '#FFFBEB',
      surface: '#FFFFFF',
      primary: '#D4AF37',
      textPrimary: '#111827',
      textSecondary: '#6B7280',
      border: '#FDE68A',
      success: '#16A34A',
      warning: '#F59E0B',
      danger: '#B91C1C',
    },
    darkTheme: {
      background: '#1A1405',
      surface: '#2A1F0A',
      primary: '#FACC15',
      textPrimary: '#FEFCE8',
      textSecondary: '#FDE68A',
      border: '#3F2F0B',
      success: '#22C55E',
      warning: '#FBBF24',
      danger: '#EF4444',
    },
  },
];

export const getPaletteByName = (name: string) =>
  PALETTES.find((palette) => palette.name === name) || PALETTES[0];
