# coldmailr - Source of Truth

This document consolidates and replaces:
- `API.md`
- `BROADCASTS_REDESIGN.md`
- `BUILD_SUMMARY.md`
- `COLD_EMAIL_COMPOSER_GUIDE.md`
- `DEPLOYMENT.md`
- `DESIGN_UPDATES.md`
- `IMPLEMENTATION.md`

Use this as the single reference for current product status, architecture, APIs, and deployment.

## 1) Current Product State (Code-Verified)

The current app entrypoint (`app/page.tsx`) renders:
- `BroadcastsSidebar`
- `BroadcastsDashboard`
- `ColdEmailComposer` (opened from "Create email")

### UX Scope
- Primary navigation: `Emails` and `Broadcasts`
- Default landing view: `Broadcasts`
- Composer: focused cold-email workflow (single recipient), with deliverability and contact-preview support components
- Dark-mode-first visual system with restrained grayscale palette

## 2) Architecture Snapshot

### Frontend
- Next.js App Router
- TypeScript strict mode
- Tailwind CSS + shadcn/ui primitives
- Component-driven UI with modular feature components

### Backend
- Next.js route handlers under `app/api`
- Supabase PostgreSQL for persistence
- Groq-powered streaming generation

### Data Domains
- Draft lifecycle (create, update, delete, version)
- Template management
- White-label tenant configuration
- AI generation and generation refinements

## 3) API Surface (Current)

Base path:
- `/api/*` (same project deployment domain)

### Generation
- `POST /api/generate`
- `POST /api/generate-action`

Both endpoints stream text output for progressive UI rendering.

### Drafts
- `GET /api/drafts`
- `POST /api/drafts`
- `GET /api/drafts/[id]`
- `PUT /api/drafts/[id]`
- `DELETE /api/drafts/[id]`
- `GET /api/drafts/[id]/versions`
- `POST /api/drafts/[id]/versions`

### Templates
- `GET /api/templates`
- `POST /api/templates`

### White Label
- `GET /api/white-label/[tenantId]`
- `PUT /api/white-label/[tenantId]`

## 4) UI and Design Decisions

### Canonical Direction
- Dark, minimal, low-noise interface
- Tight grayscale system, strong hierarchy, subtle hover/focus states
- Functional controls over decorative UI

### Composer Principles
- Cold outreach focus
- Minimal formatting defaults
- Quick send/save actions
- Deliverability-awareness and lightweight recipient context

## 5) Deployment and Operations

### Required Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GROQ_API_KEY`
- `NODE_ENV=production`

### Standard Deployment Flow
1. Install dependencies
2. Run database schema/migrations in Supabase
3. Run production build
4. Deploy to Vercel
5. Perform post-deploy smoke tests (compose, generate, drafts, versions)

### Operational Priorities
- Enable error tracking
- Configure analytics/monitoring
- Verify backup/recovery posture in Supabase
- Apply security headers and API hardening

## 6) Known Gaps / Next Priorities

Short-term priorities:
- Complete authentication UX on top of prepared backend foundations
- Integrate sending provider (SendGrid/Mailgun equivalent)
- Implement robust rate limiting and abuse protection
- Expand testing coverage (integration + E2E for compose/generate/draft flows)

Medium-term priorities:
- Team collaboration and campaign workflows
- Delivery analytics
- White-label expansion tooling and tenant ops UX

## 7) Historical Notes (What Changed)

The removed docs mixed multiple iterations:
- Broad "full SaaS build" claims
- Premium visual redesign notes
- Broadcasts-focused UI rework
- Cold-email-composer workflow specification

Current code indicates the active direction is:
- Broadcasts shell + cold-email composition flow
- Existing API set for generation, drafts, templates, and tenant config

## 8) Recommended Cleanup

After confirming this file covers your needs, you can delete:
- `API.md`
- `BROADCASTS_REDESIGN.md`
- `BUILD_SUMMARY.md`
- `COLD_EMAIL_COMPOSER_GUIDE.md`
- `DEPLOYMENT.md`
- `DESIGN_UPDATES.md`
- `IMPLEMENTATION.md`

Keep this file and optionally rename it to `README_PROJECT.md` if you want it to be your canonical internal reference.
