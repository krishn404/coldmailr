// Block-based email system types

export type Intent = 'cold' | 'freelance' | 'follow_up' | 'custom';
export type BlockType = 'hook' | 'personalization' | 'value' | 'cta' | 'signature' | 'custom';
export type Tone = 'casual' | 'professional' | 'persuasive' | 'urgent' | 'friendly';

// ==========================================
// STRATEGIES
// ==========================================
export interface Strategy {
  id: string;
  user_id: string;
  intent: Intent;
  name: string;
  description?: string;
  tone?: Tone;
  hooks: string[];
  personalization_hints: string[];
  cta_types: string[];
  is_system: boolean;
  usage_count: number;
  success_score: number;
  last_used_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ==========================================
// EMAIL CONTEXT
// ==========================================
export interface EmailContext {
  id: string;
  user_id: string;
  broadcast_id?: string;
  recipient_name?: string;
  recipient_email?: string;
  company_name?: string;
  company_industry?: string;
  recipient_role?: string;
  recipient_pain_points?: string[];
  company_size?: string;
  context_insights?: string;
  personalization_strength: number;
  ai_suggestions?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ==========================================
// EMAIL BLOCKS
// ==========================================
export interface BlockVariant {
  index: number;
  content: string;
  description?: string;
}

export interface EmailBlock {
  id: string;
  broadcast_id: string;
  block_type: BlockType;
  position: number;
  content: string;
  variants: BlockVariant[];
  active_variant_index: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EmailBlockData {
  type: BlockType;
  content: string;
  variants?: string[];
}

// ==========================================
// BLOCK STRUCTURE (stored as JSONB in broadcasts.body_structure)
// ==========================================
export interface BlockStructure {
  blocks: EmailBlockData[];
  strategy_id?: string;
  context_id?: string;
  generated_at?: string;
}

// ==========================================
// CACHED VARIANTS
// ==========================================
export interface BlockVariantsCache {
  id: string;
  user_id: string;
  block_type: BlockType;
  context_hash: string;
  strategy_id?: string;
  variants: string[];
  created_at: string;
  expires_at: string;
}

// ==========================================
// BROADCAST EXTENSION
// ==========================================
export interface BroadcastWithBlocks {
  id: string;
  user_id: string;
  from_email?: string;
  to_email: string;
  subject: string;
  body: string;
  body_structure?: BlockStructure;
  context?: string;
  strategy_id?: string;
  context_id?: string;
  intent?: Intent;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  created_at: string;
  updated_at: string;
  sent_at?: string;
  message_id?: string;
  reply_detected?: boolean;
  reply_at?: string;
}

// ==========================================
// GENERATION REQUEST/RESPONSE
// ==========================================
export interface GenerateBlockRequest {
  strategy_id: string;
  block_type: BlockType;
  context: Partial<EmailContext>;
  previousContent?: string;
}

export interface GenerateBlockResponse {
  block_type: BlockType;
  content: string;
  variants: string[];
  metadata?: Record<string, unknown>;
}

export interface GenerateFullEmailRequest {
  intent: Intent;
  strategy_id: string;
  context: Partial<EmailContext>;
  subject?: string;
}

export interface GenerateFullEmailResponse {
  subject: string;
  blocks: EmailBlockData[];
  context_id: string;
  strategy_id: string;
}

// ==========================================
// COMPOSER STATE
// ==========================================
export interface ComposerState {
  broadcastId: string;
  intent: Intent;
  selectedStrategy: Strategy | null;
  strategies: Strategy[];
  context: Partial<EmailContext>;
  blocks: EmailBlock[];
  personalizationStrength: number;
  isGenerating: boolean;
  activeBlockIndex: number;
}

// ==========================================
// UI HELPER TYPES
// ==========================================
export interface StrategyCard {
  strategy: Strategy;
  matchScore: number; // 0-1, how well it matches current context
  variants: number; // count of available variants
}
