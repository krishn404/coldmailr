import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Cold Mailr and its Gmail-connected AI cold email workspace.',
  alternates: {
    canonical: '/privacy-policy',
  },
}

const sections = [
  {
    title: 'App Identity and Contact',
    body: [
      'Cold Mailr is operated as an AI-powered Gmail outreach workspace by the developer associated with psyxdes@gmail.com. The app helps users draft, refine, send, and review cold email outreach from their own connected Gmail account.',
      'For privacy, OAuth, or data deletion requests, contact the developer at psyxdes@gmail.com.',
    ],
  },
  {
    title: 'Information We Collect',
    body: [
      'Cold Mailr collects the information you provide while using the app, including email draft content, recipient addresses, prompt context, generated outreach copy, saved broadcast records, and account details needed to operate the workspace.',
      'When you connect Gmail, we may receive Google account information such as your email address and basic profile details, along with OAuth access and refresh tokens required to provide Gmail features you explicitly authorize.',
    ],
  },
  {
    title: 'Google OAuth Scopes We Request',
    body: [
      'Cold Mailr requests openid, email, and profile to identify the connected Google account and show the signed-in account in the app.',
      'Cold Mailr requests https://www.googleapis.com/auth/gmail.send only so you can send email messages from your Gmail account after you review and approve the message in the composer.',
      'Cold Mailr requests https://www.googleapis.com/auth/gmail.readonly only so you can view recent Gmail inbox message metadata and message snippets inside the app. Cold Mailr does not use Gmail read access to monitor your account in the background, build advertising profiles, or sell data.',
    ],
  },
  {
    title: 'How We Use Information',
    body: [
      'We use your information to draft, personalize, save, send, and manage cold email outreach; maintain your sent email history; authenticate your account; improve reliability; and protect the service from misuse.',
      'Email content and campaign context may be sent to AI providers only when needed to generate, rewrite, or improve copy requested by you inside the app.',
    ],
  },
  {
    title: 'Google User Data',
    body: [
      'Cold Mailr uses Google user data only to provide user-facing email features, including connecting your Gmail account, composing messages, sending emails through Gmail, and showing related account or message status inside the app.',
      'Cold Mailr stores OAuth tokens in an HTTP-only session cookie for up to 30 days so the app can keep your Gmail connection active. Broadcast records may store the recipient, subject, body, context, sender address, sent status, sent timestamp, and Gmail message id so you can manage sent email history.',
      'We do not sell Google user data. We do not use Google user data for advertising, retargeting, personalized ads, creditworthiness, lending, or data brokerage. We do not transfer Google user data except as needed to provide user-facing Cold Mailr features, comply with law, maintain security, or with your explicit consent.',
      'We do not allow humans to read Google user data unless you ask for support and give affirmative permission for the specific data, it is necessary for security or abuse investigation, or we are required to comply with applicable law.',
      'Our use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.',
    ],
  },
  {
    title: 'Sharing and Service Providers',
    body: [
      'We may share information with service providers that help operate Cold Mailr, such as hosting, database, analytics, authentication, email delivery, and AI generation providers. These providers are only given information needed to perform their services.',
      'We may disclose information if required by law, to enforce our terms, or to protect the rights, safety, and security of users, Cold Mailr, or the public.',
    ],
  },
  {
    title: 'Data Retention and Control',
    body: [
      'We keep saved drafts, broadcast records, generated content, and connected account data for as long as needed to provide the service or until you delete the data where deletion is available.',
      'You can disconnect Gmail access from the app or revoke access from your Google Account permissions page at https://myaccount.google.com/permissions. Disconnecting or revoking access prevents future Gmail actions.',
      'To request deletion of saved Cold Mailr records associated with your account, contact psyxdes@gmail.com. We will honor deletion requests unless retention is required for security, legal compliance, fraud prevention, or legitimate operational needs.',
    ],
  },
  {
    title: 'Security',
    body: [
      'We use reasonable technical and organizational safeguards designed to protect your information. No internet service can be guaranteed to be completely secure, so you should avoid storing sensitive personal information in outreach drafts unless necessary.',
    ],
  },
  {
    title: 'Changes',
    body: [
      'We may update this Privacy Policy as Cold Mailr changes. The updated version will be posted on this page with a new effective date.',
    ],
  },
]

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Privacy at Cold Mailr"
      title="Privacy Policy"
      description="How Cold Mailr handles account data, Gmail access, AI-generated outreach content, and saved email records."
      sections={sections}
    />
  )
}
