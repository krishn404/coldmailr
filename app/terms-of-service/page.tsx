import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Cold Mailr and its AI cold email workspace.',
  alternates: {
    canonical: '/terms-of-service',
  },
}

const sections = [
  {
    title: 'App Operator',
    body: [
      'Cold Mailr is operated as an AI-powered Gmail outreach workspace by the developer associated with psyxdes@gmail.com. Questions about these terms, Google OAuth access, or account data can be sent to psyxdes@gmail.com.',
    ],
  },
  {
    title: 'Acceptance',
    body: [
      'By using Cold Mailr, you agree to these Terms of Service. If you do not agree, do not use the app.',
      'Cold Mailr is an AI-powered cold email workspace for drafting, refining, sending, and managing outreach through connected services such as Gmail.',
    ],
  },
  {
    title: 'Your Responsibilities',
    body: [
      'You are responsible for the recipients you contact, the content you send, and your compliance with applicable email, privacy, anti-spam, consumer protection, and platform rules.',
      'You must not use Cold Mailr to send unlawful, deceptive, abusive, harassing, infringing, or unsolicited messages that violate applicable law or service provider policies.',
    ],
  },
  {
    title: 'Gmail and Third-Party Services',
    body: [
      'When you connect Gmail or another third-party service, you authorize Cold Mailr to access and use that service only for the features you choose, such as composing, sending emails, displaying your connected account, and viewing recent inbox data inside the app.',
      'Cold Mailr requests Google openid, email, profile, Gmail send, and Gmail readonly permissions. Gmail send is used to send messages you approve. Gmail readonly is used to display inbox message information inside Cold Mailr. You can revoke access at any time from your Google Account permissions page.',
      'Third-party services are governed by their own terms and policies. Cold Mailr is not responsible for changes, outages, restrictions, or enforcement actions by those services.',
    ],
  },
  {
    title: 'AI-Generated Content',
    body: [
      'Cold Mailr may generate draft email content, subject lines, or improvements using AI. AI output can be inaccurate, incomplete, or unsuitable for your audience.',
      'You are responsible for reviewing, editing, and approving all content before sending it. Cold Mailr does not guarantee deliverability, replies, conversions, or business outcomes.',
    ],
  },
  {
    title: 'Accounts and Access',
    body: [
      'You are responsible for maintaining access to your account and connected services. You should disconnect integrations you no longer want Cold Mailr to use.',
      'We may suspend or restrict access if we believe your use creates risk, violates these terms, or could harm Cold Mailr, other users, service providers, or the public.',
    ],
  },
  {
    title: 'Intellectual Property',
    body: [
      'Cold Mailr and its software, branding, design, and underlying technology are owned by their respective owners. These terms do not grant you ownership of the app or its code.',
      'You retain responsibility for and rights you have in the content you provide. You grant Cold Mailr permission to process that content as needed to provide the service.',
    ],
  },
  {
    title: 'Disclaimers and Liability',
    body: [
      'Cold Mailr is provided as is and as available, without warranties of any kind to the fullest extent permitted by law.',
      'To the fullest extent permitted by law, Cold Mailr will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, lost revenue, lost data, or business interruption.',
    ],
  },
  {
    title: 'Changes',
    body: [
      'We may update these Terms of Service as the app changes. Continued use of Cold Mailr after updates means you accept the revised terms.',
    ],
  },
]

export default function TermsOfServicePage() {
  return (
    <LegalPage
      eyebrow="Terms for Cold Mailr"
      title="Terms of Service"
      description="The rules for using Cold Mailr, connecting Gmail, generating outreach copy, and sending emails responsibly."
      sections={sections}
    />
  )
}
