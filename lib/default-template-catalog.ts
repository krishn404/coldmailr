type DefaultTemplate = {
  name: string
  subject: string
  context: string
  body: string
  use_case: string
  tone: string
  length_hint: string
  tags: string[]
  is_pinned?: boolean
}

export const DEFAULT_TEMPLATE_CATALOG: DefaultTemplate[] = [
  {
    name: 'Introduction / Outreach',
    subject: 'Quick intro for {{company}}',
    context:
      'Intent: open a first conversation. Target persona: founder, hiring manager, or team lead. Use when reaching out cold for the first time.',
    body:
      'Hi {{first_name}},\n\nI came across {{company}} and wanted to introduce myself quickly. I help teams improve {{pain_point}} using {{your_product}}.\n\nIf useful, I can share 2 practical ideas tailored to your workflow.\n\nOpen to a short 15-minute chat next week?',
    use_case: 'introduction/outreach',
    tone: 'professional',
    length_hint: 'short',
    tags: ['outreach', 'first-touch'],
    is_pinned: true,
  },
  {
    name: 'Value Proposition',
    subject: 'A practical way to reduce {{pain_point}}',
    context:
      'Intent: lead with value. Target persona: operators and heads of function. Use when pain and outcome are clear.',
    body:
      'Hi {{first_name}},\n\nMost teams at {{company}} eventually hit friction around {{pain_point}}. {{your_product}} helps remove that bottleneck without adding process overhead.\n\nTeams usually see faster turnaround and fewer manual follow-ups in the first few weeks.\n\nWould it be worth sending a short walkthrough?',
    use_case: 'value-proposition',
    tone: 'direct',
    length_hint: 'medium',
    tags: ['value', 'roi'],
  },
  {
    name: 'Problem-Solution',
    subject: 'Noticed this common bottleneck at {{company}}',
    context:
      'Intent: frame a specific problem and clear solution. Target persona: leaders responsible for outcomes. Use when prospect pain is likely known.',
    body:
      'Hi {{first_name}},\n\nA common issue I see is {{pain_point}} slowing down execution. We built {{your_product}} to solve exactly that with minimal setup.\n\nInstead of replacing your process, it improves what is already working.\n\nWould you like a quick example relevant to {{company}}?',
    use_case: 'problem-solution',
    tone: 'professional',
    length_hint: 'medium',
    tags: ['problem-solution'],
  },
  {
    name: 'Personalized Compliment',
    subject: 'Loved what your team shipped at {{company}}',
    context:
      'Intent: personalized opener before pitch. Target persona: founders and marketing/product leaders. Use when you can reference recent work.',
    body:
      'Hi {{first_name}},\n\nI saw your recent work at {{company}} and genuinely liked how your team approached it. That kind of execution usually comes with growing pains around {{pain_point}}.\n\n{{your_product}} helps keep quality high while reducing manual effort.\n\nHappy to share a brief teardown if helpful.',
    use_case: 'personalized-compliment',
    tone: 'casual',
    length_hint: 'short',
    tags: ['personalized', 'compliment'],
  },
  {
    name: 'Mutual Connection Referral',
    subject: '{{mutual_connection}} suggested I reach out',
    context:
      'Intent: warm intro leverage. Target persona: any stakeholder where trust helps open reply. Use when mutual contact exists.',
    body:
      'Hi {{first_name}},\n\n{{mutual_connection}} mentioned you might be the right person to speak with about {{pain_point}} at {{company}}.\n\nI work on {{your_product}}, which teams use to solve that without heavy implementation.\n\nWould you be open to a quick call to see if it is relevant?',
    use_case: 'mutual-connection-referral',
    tone: 'professional',
    length_hint: 'short',
    tags: ['referral', 'warm-intro'],
  },
  {
    name: 'Quick Question',
    subject: 'Quick question about {{company}}',
    context:
      'Intent: low-friction response. Target persona: busy decision-makers. Use when you want a reply with minimal commitment.',
    body:
      'Hi {{first_name}},\n\nQuick question: is {{pain_point}} currently a priority for your team at {{company}}?\n\nIf yes, I can send a concise 2-minute overview of how {{your_product}} is being used by similar teams.\n\nIf not, no worries at all.',
    use_case: 'quick-question',
    tone: 'direct',
    length_hint: 'short',
    tags: ['quick-question', 'low-friction'],
  },
  {
    name: 'Case Study / Social Proof',
    subject: 'How a similar team solved {{pain_point}}',
    context:
      'Intent: credibility via evidence. Target persona: skeptical or analytical buyers. Use when you have proof points.',
    body:
      'Hi {{first_name}},\n\nA team similar to {{company}} used {{your_product}} to address {{pain_point}} and improved performance within the first month.\n\nThe biggest win was reducing manual back-and-forth while keeping quality steady.\n\nWant me to send the short case summary?',
    use_case: 'case-study-social-proof',
    tone: 'professional',
    length_hint: 'medium',
    tags: ['case-study', 'social-proof'],
  },
  {
    name: 'Follow-up (Soft Nudge)',
    subject: 'Worth revisiting this, {{first_name}}?',
    context:
      'Intent: polite follow-up. Target persona: prospects who did not reply initially. Use 3-5 days after first message.',
    body:
      'Hi {{first_name}},\n\nWanted to quickly follow up on my last note in case it got buried.\n\nIf {{pain_point}} is still on your radar, I can share a short, tailored plan for how {{your_product}} could help.\n\nShould I send that over?',
    use_case: 'follow-up-soft-nudge',
    tone: 'casual',
    length_hint: 'short',
    tags: ['follow-up', 'nudge'],
  },
  {
    name: 'Follow-up (Breakup Email)',
    subject: 'Should I close the loop?',
    context:
      'Intent: final follow-up with graceful close. Target persona: non-responsive leads. Use after 2-3 prior attempts.',
    body:
      'Hi {{first_name}},\n\nI have reached out a couple of times regarding {{pain_point}} and do not want to spam your inbox.\n\nIf this is not a priority right now, I can close the loop here.\n\nIf you want, I am happy to reconnect when timing is better.',
    use_case: 'follow-up-breakup',
    tone: 'direct',
    length_hint: 'short',
    tags: ['follow-up', 'breakup'],
  },
  {
    name: 'Partnership / Collaboration Pitch',
    subject: 'Possible collaboration between us and {{company}}',
    context:
      'Intent: propose strategic collaboration. Target persona: partnerships, BD, founders. Use when there is audience or workflow overlap.',
    body:
      'Hi {{first_name}},\n\nI think there is a strong collaboration opportunity between your team at {{company}} and what we are building with {{your_product}}.\n\nGiven your focus on {{pain_point}}, there may be a practical way for both sides to create value quickly.\n\nOpen to exploring a lightweight pilot?',
    use_case: 'partnership-collaboration',
    tone: 'professional',
    length_hint: 'medium',
    tags: ['partnership', 'collaboration'],
  },
]
