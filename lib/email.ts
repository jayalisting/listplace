import nodemailer from "nodemailer"

export interface VipTourBookingData {
  id?: number | string
  propertyId: string
  propertyTitle: string
  propertyPrice?: string
  propertyLocation?: string
  tourType: "in-person" | "virtual"
  tourDate: string
  tourTime: string
  clientName: string
  clientPhone: string
  clientEmail: string
  notes?: string
}

const GMAIL_USER = process.env.GMAIL_USER || "jayalisting@gmail.com"
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || ""
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jayalisting.com"

/**
 * Creates an authenticated Nodemailer transporter for Gmail SMTP
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // SSL
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD.replace(/\s+/g, ""), // strip any spaces
    },
    // Pool connections to avoid opening too many sockets
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
  })
}

/**
 * Clean phone number for WhatsApp wa.me links
 */
function formatPhoneForWhatsApp(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.length === 10) return `91${digits}`
  return digits
}

/**
 * Generates an email notification for a new VIP Tour Booking
 */
export async function sendVipTourNotificationEmail(booking: VipTourBookingData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = createTransporter()

    const waPhone = formatPhoneForWhatsApp(booking.clientPhone)
    const propertyUrl = `${SITE_URL}/property/${booking.propertyId}`
    const adminUrl = `${SITE_URL}/admin`
    const isVirtual = booking.tourType === "virtual"
    const tourTypeLabel = isVirtual ? "Private 4K Virtual Tour" : "In-Person VIP Tour"

    const subject = `👑 [VIP Tour Booking] ${booking.clientName} requested ${tourTypeLabel} for "${booking.propertyTitle}"`

    // Plain Text Version (Essential for spam filters & text readers)
    const textBody = `
======================================================
NEW VIP TOUR BOOKING REQUEST - JAYALISTING ROYAL ESTATES
======================================================

An exclusive private viewing appointment has been requested.

ESTATE DETAILS:
- Title: ${booking.propertyTitle} (ID #${booking.propertyId})
- Offered Value: ${booking.propertyPrice || "Upon Request"}
- Location: ${booking.propertyLocation || "Prime Location"}
- View Online: ${propertyUrl}

APPOINTMENT SCHEDULE:
- Preference: ${tourTypeLabel}
- Preferred Date: ${booking.tourDate}
- Preferred Time: ${booking.tourTime}

CLIENT / INVESTOR PROFILE:
- Full Legal Name / Entity: ${booking.clientName}
- Phone: ${booking.clientPhone}
- Email: ${booking.clientEmail}
${booking.notes ? `- Notes: ${booking.notes}\n` : ""}

DIRECT CONCIERGE ACTIONS:
- WhatsApp: https://wa.me/${waPhone}?text=Hello%20${encodeURIComponent(booking.clientName)},%20this%20is%20the%20Private%20Client%20Office%20at%20JayaListing%20regarding%20your%20VIP%20viewing%20request%20for%20${encodeURIComponent(booking.propertyTitle)}.
- Call Client: tel:${booking.clientPhone.replace(/\s+/g, "")}
- Admin Dashboard: ${adminUrl}

Generated: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
JayaListing Private Client Concierge
    `.trim()

    // Royal Luxury HTML Email Version with inline CSS for 100% email client compatibility
    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4c0519 0%, #881337 50%, #4c0519 100%); padding: 32px 28px; text-align: center;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; padding: 4px 14px; background-color: rgba(245, 158, 11, 0.2); border: 1px solid rgba(251, 191, 36, 0.4); border-radius: 9999px; margin-bottom: 12px;">
                      <span style="color: #fef3c7; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
                        👑 VIP Tour Booking Alert
                      </span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; line-height: 1.2;">
                      JayaListing Royal Estates
                    </h1>
                    <p style="margin: 6px 0 0 0; color: #fecdd3; font-size: 13px; font-weight: 500;">
                      Private Client Office • Acquisition Viewing Request
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Notification Alert Card -->
          <tr>
            <td style="padding: 24px 28px 12px 28px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 14px; padding: 14px 18px;">
                <tr>
                  <td>
                    <p style="margin: 0; color: #78350f; font-size: 13px; line-height: 1.5; font-weight: 600;">
                      🔔 <strong>Action Required:</strong> A verified prospective client has submitted an exclusive appointment request for private viewing.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Client / Investor Details -->
          <tr>
            <td style="padding: 12px 28px;">
              <h2 style="margin: 0 0 12px 0; color: #881337; font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                👤 Client / Principal Profile
              </h2>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; width: 35%; color: #64748b; font-size: 12px; font-weight: 600;">
                    Legal Name / Entity
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 800;">
                    ${booking.clientName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 12px; font-weight: 600;">
                    Direct Phone
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 800;">
                    <a href="tel:${booking.clientPhone.replace(/\s+/g, "")}" style="color: #881337; text-decoration: none;">
                      ${booking.clientPhone}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 12px; font-weight: 600;">
                    Email Address
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 700;">
                    <a href="mailto:${booking.clientEmail}" style="color: #881337; text-decoration: none;">
                      ${booking.clientEmail}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; color: #64748b; font-size: 12px; font-weight: 600;">
                    Tour Type
                  </td>
                  <td style="padding: 12px 16px; color: #0f172a; font-size: 13px; font-weight: 800;">
                    <span style="display: inline-block; padding: 2px 10px; background-color: #881337; color: #ffffff; border-radius: 6px; font-size: 11px;">
                      ${tourTypeLabel}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; font-weight: 600;">
                    Requested Schedule
                  </td>
                  <td style="padding: 12px 16px; border-top: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 800;">
                    📅 ${booking.tourDate} at ⏰ ${booking.tourTime}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Requested Property Information -->
          <tr>
            <td style="padding: 12px 28px;">
              <h2 style="margin: 0 0 12px 0; color: #881337; font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                🏰 Target Estate Information
              </h2>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 14px; padding: 16px;">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 800; color: #881337; text-transform: uppercase; letter-spacing: 1px;">
                      Estate ID #${booking.propertyId}
                    </div>
                    <div style="font-size: 16px; font-weight: 900; color: #4c0519; margin-top: 4px;">
                      ${booking.propertyTitle}
                    </div>
                    ${booking.propertyPrice ? `<div style="font-size: 15px; font-weight: 800; color: #881337; margin-top: 4px;">Offered at ${booking.propertyPrice}</div>` : ""}
                    ${booking.propertyLocation ? `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">📍 ${booking.propertyLocation}</div>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Quick Action Buttons -->
          <tr>
            <td style="padding: 20px 28px 12px 28px;">
              <h2 style="margin: 0 0 14px 0; color: #0f172a; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                ⚡ Direct Executive Actions
              </h2>

              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <!-- WhatsApp Button (Green) -->
                <tr>
                  <td style="padding-bottom: 10px;">
                    <a href="https://wa.me/${waPhone}?text=Hello%20${encodeURIComponent(booking.clientName)},%20this%20is%20the%20Private%20Client%20Office%20at%20JayaListing%20following%20up%20on%20your%20VIP%20tour%20request%20for%20${encodeURIComponent(booking.propertyTitle)}." target="_blank" style="display: block; background-color: #25D366; color: #ffffff; text-align: center; padding: 13px 20px; border-radius: 12px; font-size: 13px; font-weight: 800; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(37, 211, 102, 0.3);">
                      💬 Chat with Client on WhatsApp (${booking.clientPhone})
                    </a>
                  </td>
                </tr>

                <!-- Direct Call Button -->
                <tr>
                  <td style="padding-bottom: 10px;">
                    <a href="tel:${booking.clientPhone.replace(/\s+/g, "")}" style="display: block; background-color: #0f172a; color: #ffffff; text-align: center; padding: 13px 20px; border-radius: 12px; font-size: 13px; font-weight: 800; text-decoration: none;">
                      📞 Call Client Immediately (${booking.clientPhone})
                    </a>
                  </td>
                </tr>

                <!-- Two side-by-side buttons: View Estate & Admin Hub -->
                <tr>
                  <td>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="48%" style="padding-right: 2%;">
                          <a href="${propertyUrl}" target="_blank" style="display: block; background-color: #881337; color: #ffffff; text-align: center; padding: 11px 14px; border-radius: 10px; font-size: 12px; font-weight: 700; text-decoration: none;">
                            🏰 View Estate Page
                          </a>
                        </td>
                        <td width="48%" style="padding-left: 2%;">
                          <a href="${adminUrl}" target="_blank" style="display: block; background-color: #ffffff; color: #881337; border: 1.5px solid #881337; text-align: center; padding: 9.5px 14px; border-radius: 10px; font-size: 12px; font-weight: 700; text-decoration: none;">
                            ⚙️ Open Admin Hub
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 28px 28px 28px; text-align: center; border-top: 1px solid #f1f5f9; margin-top: 16px;">
              <p style="margin: 0; color: #94a3b8; font-size: 11px; line-height: 1.5;">
                This confidential notification was dispatched automatically by JayaListing Royal Concierge Engine.<br>
                Recipient: <a href="mailto:${GMAIL_USER}" style="color: #881337; text-decoration: none;">${GMAIL_USER}</a> • Reference: JAYA-VIP-${booking.propertyId}-${Date.now().toString().slice(-4)}
              </p>
              <p style="margin: 8px 0 0 0; color: #cbd5e1; font-size: 10px;">
                © ${new Date().getFullYear()} JayaListing. Ultra-Luxury Portfolio. Strictly Confidential.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim()

    // Send Mail with high deliverability architecture
    const info = await transporter.sendMail({
      from: `"JayaListing VIP Concierge" <${GMAIL_USER}>`,
      to: GMAIL_USER,
      replyTo: `"${booking.clientName}" <${booking.clientEmail}>`,
      subject,
      text: textBody,
      html: htmlBody,
      headers: {
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        Importance: "High",
        "X-Entity-Ref-ID": `vip-booking-${booking.propertyId}-${Date.now()}`,
      },
    })

    console.log("VIP Tour Booking Email Sent. Message ID:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error("Failed to send VIP Tour Booking email:", error)
    return { success: false, error: error.message || "Email dispatch failed" }
  }
}

