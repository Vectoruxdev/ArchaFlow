import { Resend } from "resend"

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    throw new Error(
      "RESEND_API_KEY is not set. Add it to .env.local (local) or Vercel Environment Variables (deployed)."
    )
  }
  return new Resend(key)
}

const FROM_EMAIL = "ArchaFlow <noreply@archaflow.com>"

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
}

export async function sendContractEmail({
  to,
  signerName,
  contractName,
  senderName,
  signingToken,
}: {
  to: string
  signerName: string
  contractName: string
  senderName: string
  signingToken: string
}) {
  const signingUrl = `${getSiteUrl()}/sign/${signingToken}`

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${contractName} — Ready for your signature`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="margin-bottom: 32px;">
          <div style="width: 40px; height: 40px; background: #000; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
            <div style="width: 20px; height: 20px; border: 2px solid #fff; transform: rotate(45deg);"></div>
          </div>
        </div>
        <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #000;">
          Contract Ready for Signature
        </h1>
        <p style="color: #555; line-height: 1.6; margin-bottom: 8px;">
          Hi ${signerName},
        </p>
        <p style="color: #555; line-height: 1.6; margin-bottom: 24px;">
          ${senderName} has sent you <strong>${contractName}</strong> to review and sign via ArchaFlow.
        </p>
        <a href="${signingUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 32px; border-radius: 9999px; text-decoration: none; font-weight: 500; font-size: 14px;">
          Review &amp; Sign
        </a>
        <p style="color: #999; font-size: 13px; margin-top: 32px; line-height: 1.5;">
          Or copy this link: ${signingUrl}
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #999; font-size: 12px;">
          Sent via ArchaFlow · Project management for architecture firms
        </p>
      </div>
    `,
  })

  if (error) throw error
}

export async function sendContractSignedEmail({
  to,
  contractName,
  signerName,
}: {
  to: string | string[]
  contractName: string
  signerName: string
}) {
  const recipients = Array.isArray(to) ? to : [to]

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: recipients,
    subject: `${contractName} — Signed by ${signerName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="margin-bottom: 32px;">
          <div style="width: 40px; height: 40px; background: #000; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
            <div style="width: 20px; height: 20px; border: 2px solid #fff; transform: rotate(45deg);"></div>
          </div>
        </div>
        <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #000;">
          Contract Signed ✓
        </h1>
        <p style="color: #555; line-height: 1.6; margin-bottom: 24px;">
          <strong>${signerName}</strong> has signed <strong>${contractName}</strong>.
        </p>
        <p style="color: #555; line-height: 1.6;">
          You can view the signed contract and download a copy from your ArchaFlow dashboard.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #999; font-size: 12px;">
          Sent via ArchaFlow · Project management for architecture firms
        </p>
      </div>
    `,
  })

  if (error) throw error
}

export async function sendInvoiceEmail({
  to,
  recipientName,
  businessName,
  invoiceNumber,
  amount,
  dueDate,
  viewingToken,
}: {
  to: string
  recipientName: string
  businessName: string
  invoiceNumber: string
  amount: string
  dueDate: string
  viewingToken: string
}) {
  const viewUrl = `${getSiteUrl()}/invoice/${viewingToken}`

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Invoice ${invoiceNumber} from ${businessName} — ${amount} due by ${dueDate}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="margin-bottom: 32px;">
          <div style="width: 40px; height: 40px; background: #000; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
            <div style="width: 20px; height: 20px; border: 2px solid #fff; transform: rotate(45deg);"></div>
          </div>
        </div>
        <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #000;">
          Invoice ${invoiceNumber}
        </h1>
        <p style="color: #555; line-height: 1.6; margin-bottom: 8px;">
          Hi ${recipientName},
        </p>
        <p style="color: #555; line-height: 1.6; margin-bottom: 24px;">
          ${businessName} has sent you an invoice for <strong>${amount}</strong>, due by <strong>${dueDate}</strong>.
        </p>
        <a href="${viewUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 32px; border-radius: 9999px; text-decoration: none; font-weight: 500; font-size: 14px;">
          View Invoice
        </a>
        <p style="color: #999; font-size: 13px; margin-top: 32px; line-height: 1.5;">
          Or copy this link: ${viewUrl}
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #999; font-size: 12px;">
          Sent via ArchaFlow · Project management for architecture firms
        </p>
      </div>
    `,
  })

  if (error) throw error
}

export async function sendPaymentReceivedEmail({
  to,
  recipientName,
  businessName,
  invoiceNumber,
  paymentAmount,
  remainingBalance,
}: {
  to: string
  recipientName: string
  businessName: string
  invoiceNumber: string
  paymentAmount: string
  remainingBalance: string
}) {
  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Payment of ${paymentAmount} received on Invoice ${invoiceNumber}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="margin-bottom: 32px;">
          <div style="width: 40px; height: 40px; background: #000; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
            <div style="width: 20px; height: 20px; border: 2px solid #fff; transform: rotate(45deg);"></div>
          </div>
        </div>
        <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #000;">
          Payment Received
        </h1>
        <p style="color: #555; line-height: 1.6; margin-bottom: 8px;">
          Hi ${recipientName},
        </p>
        <p style="color: #555; line-height: 1.6; margin-bottom: 16px;">
          A payment of <strong>${paymentAmount}</strong> has been recorded on Invoice <strong>${invoiceNumber}</strong> from ${businessName}.
        </p>
        <p style="color: #555; line-height: 1.6; margin-bottom: 24px;">
          Remaining balance: <strong>${remainingBalance}</strong>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #999; font-size: 12px;">
          Sent via ArchaFlow · Project management for architecture firms
        </p>
      </div>
    `,
  })

  if (error) throw error
}

export async function sendInvoiceOverdueEmail({
  to,
  recipientName,
  businessName,
  invoiceNumber,
  amount,
  daysOverdue,
  viewingToken,
}: {
  to: string
  recipientName: string
  businessName: string
  invoiceNumber: string
  amount: string
  daysOverdue: number
  viewingToken: string
}) {
  const viewUrl = `${getSiteUrl()}/invoice/${viewingToken}`

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Invoice ${invoiceNumber} is past due`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="margin-bottom: 32px;">
          <div style="width: 40px; height: 40px; background: #000; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
            <div style="width: 20px; height: 20px; border: 2px solid #fff; transform: rotate(45deg);"></div>
          </div>
        </div>
        <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #000;">
          Invoice Past Due
        </h1>
        <p style="color: #555; line-height: 1.6; margin-bottom: 8px;">
          Hi ${recipientName},
        </p>
        <p style="color: #555; line-height: 1.6; margin-bottom: 16px;">
          Invoice <strong>${invoiceNumber}</strong> from ${businessName} for <strong>${amount}</strong> is now <strong>${daysOverdue} day${daysOverdue === 1 ? "" : "s"}</strong> past due.
        </p>
        <a href="${viewUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 32px; border-radius: 9999px; text-decoration: none; font-weight: 500; font-size: 14px;">
          View Invoice
        </a>
        <p style="color: #999; font-size: 13px; margin-top: 32px; line-height: 1.5;">
          Or copy this link: ${viewUrl}
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #999; font-size: 12px;">
          Sent via ArchaFlow · Project management for architecture firms
        </p>
      </div>
    `,
  })

  if (error) throw error
}
