// Dark minimal design system for AI Email SaaS

export const THEME = {
  // Colors
  colors: {
    // Background & Surfaces
    background: '#0F0F0F',        // Main background (near-black)
    surface: '#1A1A1A',           // Container/card background
    border: '#262626',            // Subtle borders
    
    // Text
    text: {
      primary: '#FFFFFF',         // Main text
      secondary: '#A0A0A0',       // Muted text (labels, help)
      tertiary: '#666666',        // Very muted (disabled, placeholder)
    },
    
    // Accents (configurable per tenant, default blue)
    accent: '#4F46E5',            // Primary action color
    accentHover: '#4338CA',       // Darker on hover
    accentLight: '#EEF2FF',       // Light variant for backgrounds
    
    // Semantic colors
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
  
  // Spacing (8px base unit)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: 'system-ui, -apple-system, sans-serif',
      mono: 'Menlo, monospace',
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '32px',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.2',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  
  // Border radius
  borderRadius: {
    sm: '4px',
    md: '8px',     // Default for soft rounded containers
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  
  // Shadows (minimal)
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.2)',
  },
  
  // Transitions
  transitions: {
    fast: '150ms',
    base: '250ms',
    slow: '350ms',
  },
  
  // Z-index
  zIndex: {
    hide: '-1',
    base: '0',
    dropdown: '1000',
    sticky: '1100',
    fixed: '1200',
    modal: '1300',
    popover: '1400',
    tooltip: '1500',
  },
}

// Helper to generate gradient (if needed for future enhancements)
export const generateGradient = (startColor: string, endColor: string) => {
  return `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)`
}

// Responsive breakpoints
export const BREAKPOINTS = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}

// Media query helpers
export const mq = {
  xs: `@media (min-width: ${BREAKPOINTS.xs})`,
  sm: `@media (min-width: ${BREAKPOINTS.sm})`,
  md: `@media (min-width: ${BREAKPOINTS.md})`,
  lg: `@media (min-width: ${BREAKPOINTS.lg})`,
  xl: `@media (min-width: ${BREAKPOINTS.xl})`,
  '2xl': `@media (min-width: ${BREAKPOINTS['2xl']})`,
}
