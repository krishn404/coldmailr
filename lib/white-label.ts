/**
 * White-Label Configuration System
 * Allows SaaS customers to customize branding and appearance
 */

export interface WhiteLabelConfig {
  tenantId: string;
  name: string;
  logo?: string;
  accentColor: string;
  domain?: string;
  customCSS?: string;
  features: {
    aiGeneration: boolean;
    versioning: boolean;
    templates: boolean;
    teamCollaboration: boolean;
    emailSending: boolean;
    analytics: boolean;
  };
}

// Default configuration
export const DEFAULT_CONFIG: Partial<WhiteLabelConfig> = {
  accentColor: '#3B82F6', // Blue-600
  features: {
    aiGeneration: true,
    versioning: true,
    templates: true,
    teamCollaboration: false,
    emailSending: false,
    analytics: false,
  },
};

// Customer-specific configurations (loaded from Supabase)
export async function getWhiteLabelConfig(tenantId: string): Promise<WhiteLabelConfig> {
  try {
    const response = await fetch(`/api/white-label/${tenantId}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn(`[WhiteLabel] Failed to load config for ${tenantId}`);
      return { tenantId, name: 'coldmailr', accentColor: DEFAULT_CONFIG.accentColor!, features: DEFAULT_CONFIG.features! };
    }

    return response.json();
  } catch (error) {
    console.error('[WhiteLabel] Error loading config:', error);
    return { tenantId, name: 'coldmailr', accentColor: DEFAULT_CONFIG.accentColor!, features: DEFAULT_CONFIG.features! };
  }
}

/**
 * Apply white-label CSS variables to document
 */
export function applyWhiteLabelStyles(config: WhiteLabelConfig) {
  const root = document.documentElement;

  // Set CSS variables
  root.style.setProperty('--accent-color', config.accentColor);
  root.style.setProperty('--accent-color-hover', lightenColor(config.accentColor, 10));
  root.style.setProperty('--accent-color-dark', darkenColor(config.accentColor, 10));

  // Apply custom CSS if provided
  if (config.customCSS) {
    const style = document.createElement('style');
    style.textContent = config.customCSS;
    document.head.appendChild(style);
  }
}

/**
 * Lighten a hex color by a percentage
 */
function lightenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

/**
 * Darken a hex color by a percentage
 */
function darkenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

/**
 * Check if a feature is enabled for tenant
 */
export function isFeatureEnabled(config: WhiteLabelConfig, feature: keyof WhiteLabelConfig['features']): boolean {
  return config.features?.[feature] ?? DEFAULT_CONFIG.features![feature] ?? false;
}
