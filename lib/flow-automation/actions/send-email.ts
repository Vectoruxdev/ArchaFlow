import type { ActionHandler } from '@/types/flow-automation'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'send_email',
  label: 'Send email',
  description: 'Sends an email to the card\'s contact or a custom address',
  category: 'notification',
  icon: 'Mail',
  configSchema: {
    fields: [
      {
        key: 'mode',
        label: 'Send to',
        type: 'select',
        required: true,
        options: [
          { label: 'Card contact email', value: 'card_contact' },
          { label: 'Custom email address', value: 'custom' },
        ],
        defaultValue: 'card_contact',
      },
      {
        key: 'customEmail',
        label: 'Email address',
        type: 'text',
        required: false,
        placeholder: 'email@example.com',
        helpText: 'Required for custom mode',
        supportsVariables: true,
      },
      {
        key: 'subject',
        label: 'Subject',
        type: 'text',
        required: true,
        supportsVariables: true,
        placeholder: 'Email subject',
      },
      {
        key: 'body',
        label: 'Body',
        type: 'textarea',
        required: true,
        supportsVariables: true,
        placeholder: 'Email body text',
      },
    ],
  },
  async execute(config, context) {
    const subject = config.subject as string
    const body = config.body as string

    if (!subject || !body) {
      return { success: false, error: 'Subject and body are required' }
    }

    let toEmail: string
    if (config.mode === 'custom') {
      toEmail = config.customEmail as string
      if (!toEmail) {
        return { success: false, error: 'Custom email address is required' }
      }
    } else {
      toEmail = context.card.clientEmail ?? ''
      if (!toEmail) {
        return { success: false, error: 'Card has no contact email' }
      }
    }

    // Use Resend HTTP API directly to avoid @react-email/render dependency at bundle time
    try {
      const apiKey = process.env.RESEND_API_KEY
      if (!apiKey) {
        return { success: false, error: 'RESEND_API_KEY not configured' }
      }

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          ${body.replace(/\n/g, '<br />')}
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
          <p style="color: #999; font-size: 12px;">
            Sent automatically by ArchaFlow Flow Automation
          </p>
        </div>
      `

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'ArchaFlow <noreply@archaflow.com>',
          to: toEmail,
          subject,
          html,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return { success: false, error: `Email send failed: ${(err as Record<string, string>).message ?? res.statusText}` }
      }

      return { success: true, output: { sentTo: toEmail } }
    } catch (err) {
      return { success: false, error: `Email service error: ${err instanceof Error ? err.message : 'Unknown'}` }
    }
  },
  validate(config) {
    const errors: string[] = []
    if (config.mode === 'custom' && !config.customEmail) {
      errors.push('Email address is required for custom mode')
    }
    if (!config.subject) errors.push('Subject is required')
    if (!config.body) errors.push('Body is required')
    return { valid: errors.length === 0, errors }
  },
  summarize(config) {
    if (config.mode === 'custom') {
      return `send email to ${config.customEmail ?? '...'}`
    }
    return 'send email to card contact'
  },
}

actionRegistry.register(handler)
export default handler
