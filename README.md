# coldmailr - AI-Powered Cold Email Platform

A scalable, white-label SaaS platform for AI-powered cold email outreach with a dark, minimal interface and advanced AI features.

## Features

### Core Composition
- **Smart Email Composer**: Centered, focused interface with real-time AI generation
- **Streaming Generation**: Live streaming text from Groq AI with cursor-aware insertion
- **Context-Aware AI**: Personalized emails based on recipient details and outreach goals
- **Full Manual Editability**: Complete control over generated content with live updates

### Advanced Controls
- **Tone Selection**: Professional, Casual, Friendly, Formal
- **Length Control**: Short (2-3 sentences), Medium (4-5), Long (6-8+)
- **Personalization Depth**: Minimal, Standard, Deep
- **Quick Actions**: Regenerate, Shorten, Formalize, Add CTA—without leaving the composer
- **Undo/Redo**: Full state history with keyboard shortcuts
- **Version History**: Timeline view of all email iterations

### Organization
- **Recent Drafts**: Quick access to previous work in a lightweight sidebar
- **Templates**: Pre-built email templates for common outreach scenarios
- **Draft Management**: Save, load, and organize outreach campaigns
- **Email Statistics**: Word count, sentence count, reading time estimates

### Developer Experience
- **Keyboard-First**: Shortcuts for all major actions
- **Real-Time Streaming**: Smooth, progressive text generation
- **State Management**: Zustand-based store with undo/redo
- **TypeScript**: Full type safety throughout
- **Responsive Design**: Mobile-friendly dark interface

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Components**: shadcn/ui with Tailwind CSS v4
- **State**: Zustand for client-side state management
- **Icons**: Lucide React
- **AI Integration**: Groq SDK for streaming generation

### Backend
- **Runtime**: Node.js
- **Database**: Supabase (PostgreSQL)
- **API**: Next.js Route Handlers
- **AI**: Groq (Mixtral-8x7b-32768)

### Database Schema
- `users`: Authentication and user profiles
- `tenants`: Multi-tenant support
- `drafts`: Email drafts (From, To, CC, BCC, Subject, Body)
- `draft_versions`: Version history for drafts
- `templates`: User-created templates
- `generation_history`: AI generation logs for analytics
- `team_members`: Team collaboration (future)

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account with PostgreSQL database
- Groq API key for AI generation

### Installation

1. **Clone and install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment variables** (in Vercel settings or .env.local):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   GROQ_API_KEY=your_groq_api_key
   ```

3. **Run migrations:**
   ```bash
   pnpm exec node scripts/01_init_schema.sql
   ```

4. **Start development server:**
   ```bash
   pnpm dev
   ```

Visit `http://localhost:3000` to start composing emails.

## Project Structure

```
app/
  api/
    generate/          # Groq streaming generation endpoint
    generate-action/   # Quick action generation
    drafts/           # Draft CRUD operations
    templates/        # Template management

components/
  composer.tsx        # Main email composer
  sidebar.tsx         # Recent drafts and templates
  quick-actions.tsx   # Tone/length/regenerate controls
  version-history.tsx # Draft version timeline
  email-stats.tsx     # Word count and metrics
  onboarding.tsx      # First-time user guide
  keyboard-help.tsx   # Keyboard shortcuts reference

lib/
  store.ts           # Zustand state management
  supabase.ts        # Database client
  ai-utils.ts        # AI helper functions
  theme.ts           # Design tokens
```

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Undo | ⌘Z / CtrlZ |
| Redo | ⌘⇧Z / CtrlShiftZ |
| Generate | ⌘Enter / CtrlEnter |
| Save Draft | ⌘S / CtrlS |
| Close Modal | Escape |

## Architecture Highlights

### Multi-Tenant White-Label Ready
- Tenant isolation at database level
- Custom domain routing support
- Configurable accent colors and logos
- Team collaboration foundation

### Scalability
- Stateless API routes for horizontal scaling
- Database query optimization
- Streaming responses for large generations
- CDN-friendly static assets

### Real-Time Generation
- Server Sent Events (SSE) for streaming
- Cursor-aware text insertion
- Progressive enhancement for network delays
- Graceful error handling and retry logic

### Data Integrity
- Row-Level Security (RLS) on Supabase
- Parameterized queries preventing SQL injection
- Version history for audit trails
- Soft deletes for data recovery

## Performance Optimizations

1. **Streaming Generation**: Text appears as it's generated, not in one block
2. **Lazy Loading**: Sidebar templates and recent drafts load on demand
3. **Debouncing**: Save operations throttled to avoid excessive DB writes
4. **Code Splitting**: Route-based code splitting with Next.js
5. **CSS-in-JS**: Minimal CSS with Tailwind's JIT compilation

## Security Considerations

- Supabase RLS policies enforce user-level isolation
- Email content never exposed in logs (sanitized before storage)
- API routes validate all user inputs
- CORS headers configured for white-label domains
- Rate limiting on generation endpoint (future)

## Future Enhancements

- [ ] Real email sending (Sendgrid/Mailgun integration)
- [ ] Email tracking and analytics
- [ ] Team collaboration with mentions
- [ ] Advanced prompt engineering UI
- [ ] Bulk outreach campaigns
- [ ] A/B testing for subject lines
- [ ] Email deliverability scoring
- [ ] Custom model fine-tuning
- [ ] Supabase authentication (sign-up/login)
- [ ] Subscription billing with Stripe

## Contributing


1. Keep components focused and reusable
2. Use Zustand for state management
3. Maintain type safety with TypeScript
4. Follow the design system color/spacing guidelines
5. Add keyboard shortcuts for power users

## License

MIT - See LICENSE file for details

## Support

For issues or feature requests, open an issue on GitHub or contact support.
