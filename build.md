# Coldmailr Onboarding Layer (Blocking)

## Objective

Insert a mandatory onboarding layer between Gmail authentication and dashboard access. This layer captures user identity + intent preferences and stores it as structured base context in Supabase. No user can access the dashboard or composer without completing onboarding.

---

## Flow

Gmail OAuth → Onboarding (blocking) → Dashboard

Condition:
- if onboarding_complete = false → redirect to /onboarding
- else → allow dashboard

This must be enforced both:
- client side (routing guard)
- server side (API guard)

---

## Tech Stack

- Next.js (App Router)
- Supabase (Auth + DB)
- Existing UI system (no redesign)

---

## Database Schema (Supabase)

Table: users (extend existing)

Columns:
- id (uuid, primary, from auth)
- email (text)
- name (text)
- bio (text)
- social_links (jsonb)
- intent_preferences (jsonb)
- base_context (jsonb)
- onboarding_complete (boolean, default false)
- created_at (timestamp)
- updated_at (timestamp)

---

## JSON Structures

### intent_preferences

{
  "selected": ["freelance", "internship", "investor", "networking"],
  "custom": ""
}

Rules:
- selected: array (min 1 required)
- custom: required only if "other" selected

---

### base_context

{
  "name": "",
  "bio": "",
  "social_links": {
    "linkedin": "",
    "twitter": "",
    "portfolio": ""
  },
  "intent_preferences": {
    "selected": [],
    "custom": ""
  }
}

---

## Onboarding UI

Constraints:
- follow existing UI
- minimal, clean, no clutter
- max 3 steps
- single column layout

---

### Step 1: Identity

Fields:
- name (required, min 2 chars)
- bio (required, max 200 chars)

Behavior:
- realtime validation
- autosave (debounced)

---

### Step 2: Intent Preferences

Checkboxes:
- Freelance work
- Internship
- Investor pitch
- Networking / intro
- Other

If "Other" selected:
- show text input (required)

Validation:
- at least 1 checkbox selected
- if other selected → custom required

---

### Step 3: Social Links (Optional)

Fields:
- LinkedIn
- Twitter
- Portfolio

Validation:
- must be valid URL if filled
- optional

---

## Persistence Logic

- autosave after each step via API
- maintain local state (React state)
- sync with DB on every step

On final submit:
- construct base_context
- persist all fields
- set onboarding_complete = true
- redirect to /dashboard

---

## API Design

### GET /api/user/profile

Returns:
- name
- bio
- social_links
- intent_preferences
- onboarding_complete

---

### POST /api/user/profile

Input:
- name
- bio
- social_links
- intent_preferences

Process:
- validate input
- construct base_context
- update user record
- set updated_at

---

## Route Protection

Client:
- middleware or layout check
- if onboarding_complete = false → redirect /onboarding

Server:
- protect generation/send APIs
- reject if onboarding incomplete

---

## Frontend Structure

/onboarding
  layout.tsx
  page.tsx
  components/
    step-identity.tsx
    step-intents.tsx
    step-social.tsx
  hooks/
    useOnboarding.ts

---

## Hook: useOnboarding

Responsibilities:
- manage step state
- manage form state
- handle validation
- call API
- persist progress

---

## Validation Rules

name:
- required
- min 2 chars

bio:
- required
- max 200 chars

intent_preferences:
- selected.length >= 1
- if "other" selected → custom required

social_links:
- valid URL format if present

---

## Edge Cases

- refresh mid onboarding → restore from DB
- partial save → continue from last valid step
- API failure → retry without losing input
- invalid URL → block progression

---

## UI Guidelines

- no large components (>300 lines)
- separate form + logic
- no API logic in components
- use hooks for API

---

## Definition of Done

- onboarding blocks dashboard access
- user data saved in Supabase
- base_context correctly structured
- autosave works
- resume works after refresh
- validation enforced
- API protected