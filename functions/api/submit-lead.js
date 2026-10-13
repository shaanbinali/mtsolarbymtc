/**
 * Cloudflare Pages Function: Unified Lead Submission Handler
 * Endpoint: POST /api/submit-lead
 * Deployed natively by Cloudflare Pages from /functions/api/submit-lead.js
 * 
 * Features:
 * 1. Cloudflare D1 SQLite Database storage (Native serverless DB inside Cloudflare)
 * 2. Instant Direct Email notification (via Resend, Brevo, or Web3Forms)
 * 3. Honeypot anti-spam protection
 * 4. West Bengal PIN code and 10-digit mobile validation
 */

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      status: 'online',
      service: 'M.T. Solar Lead Ingestion API',
      usage: 'Submit form payloads via HTTP POST'
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const payload = await context.request.json();

    // 1. Honeypot Bot Trap: silently absorb if bot filled hidden field
    if (payload._hp && payload._hp.trim().length > 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Thank you! Your request has been received.',
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    const formType = payload.form_type || 'site_survey';
    const sourcePage = payload.source_page || '/';
    const data = payload.data || {};

    // 2. Validate 10-digit mobile number
    const rawPhone = (data.phone || data.referrer_phone || '').toString().replace(/\D/g, '');
    if (rawPhone.length < 10) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Please enter a valid 10-digit mobile number.',
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 3. West Bengal PIN Code qualification for site surveys and subsidy
    const pin = (data.pincode || '').toString().trim();
    if (['site_survey', 'subsidy_application'].includes(formType) && pin) {
      const prefix = parseInt(pin.substring(0, 2), 10);
      if (isNaN(prefix) || prefix < 70 || prefix > 74) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'PIN code is outside our West Bengal operational territory.',
          }),
          { status: 400, headers: corsHeaders }
        );
      }
    }

    const leadId = `MTC-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const customerName = data.name || data.company || data.society || data.referrer_name || 'Customer';

    // 4. Save to Cloudflare D1 Database (if D1 binding 'DB' is attached)
    if (context.env.DB) {
      try {
        // Ensure table exists
        await context.env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lead_id TEXT UNIQUE,
            form_type TEXT,
            name TEXT,
            phone TEXT,
            pincode TEXT,
            source_page TEXT,
            details_json TEXT,
            created_at TEXT
          );
        `).run();

        // Insert lead record
        await context.env.DB.prepare(`
          INSERT INTO leads (lead_id, form_type, name, phone, pincode, source_page, details_json, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `).bind(
          leadId,
          formType,
          customerName,
          rawPhone,
          pin || data.area || data.location || '',
          sourcePage,
          JSON.stringify(data),
          timestamp
        ).run();
      } catch (dbErr) {
        console.error('Cloudflare D1 Storage Error:', dbErr);
      }
    }

    // 5. Send Direct Email Notification to Company Inboxes
    await dispatchEmailNotification(context.env, {
      leadId,
      formType,
      customerName,
      phone: rawPhone,
      pin,
      sourcePage,
      data,
      timestamp,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Thank you! Your request has been received. Our engineering team will contact you shortly.',
        lead_id: leadId,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error('Lead processing error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Unable to process form submission. Please call us directly at +91 9083326210.',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Dispatches an HTML email notification using configured environment variables
 * Supports:
 * - RESEND_API_KEY (Recommended: https://resend.com - 3000 free emails/month)
 * - BREVO_API_KEY (https://brevo.com - 300 free emails/day)
 * - WEB3FORMS_ACCESS_KEY (https://web3forms.com - instant free key)
 */
async function dispatchEmailNotification(env, lead) {
  const recipientEmails = (env.LEAD_NOTIFICATION_EMAILS || 'mtsolarbymtc@gmail.com, contact@mtsolarbymtc.com, sales@mtsolarbymtc.com')
    .split(',')
    .map(e => e.trim());

  const formTypeTitles = {
    site_survey: 'Rooftop Site Survey & Feasibility',
    subsidy_application: 'PM Surya Ghar Central Subsidy (DBT)',
    commercial_audit: 'Commercial / Society Energy Audit',
    contact_inquiry: 'General Contact Inquiry',
    partner_application: 'Solar Channel Partner Application',
    referral_submission: 'Customer Referral Submission',
    job_application: 'Careers / Job Application',
    event_registration: 'Seminar & Training Registration',
  };

  const humanType = formTypeTitles[lead.formType] || lead.formType;
  const subject = `⚡ New Lead [${humanType}]: ${lead.customerName} (${lead.phone})`;

  // Build clean HTML table of all submitted fields
  let fieldsRows = '';
  for (const [key, val] of Object.entries(lead.data)) {
    if (!val) continue;
    const label = key.replace(/_/g, ' ').toUpperCase();
    fieldsRows += `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569; width: 35%;">${label}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${val}</td>
      </tr>
    `;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        
        <div style="background-color: #0b1528; padding: 20px 24px; border-bottom: 3px solid #fbbf24;">
          <h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 700; letter-spacing: 0.5px;">M.T. SOLAR BY MTC</h2>
          <p style="color: #fbbf24; margin: 4px 0 0; font-size: 13px; font-weight: 600;">NEW WEBSITE INQUIRY RECEIVED</p>
        </div>

        <div style="padding: 24px;">
          <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
            <div style="font-size: 12px; color: #92400e; font-weight: bold; text-transform: uppercase;">Lead Type</div>
            <div style="font-size: 16px; color: #78350f; font-weight: bold;">${humanType}</div>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
            <tbody>
              <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">LEAD ID</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-family: monospace;">${lead.leadId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">SOURCE PAGE</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${lead.sourcePage}</td>
              </tr>
              ${fieldsRows}
            </tbody>
          </table>

          <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
            <a href="tel:${lead.phone}" style="display: inline-block; background-color: #0b1528; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 14px; margin-right: 8px;">
              📞 Call ${lead.phone}
            </a>
            <a href="https://wa.me/91${lead.phone}" style="display: inline-block; background-color: #25d366; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 14px;">
              💬 WhatsApp
            </a>
          </div>
        </div>

        <div style="background-color: #f1f5f9; padding: 12px 24px; text-align: center; font-size: 12px; color: #64748b;">
          M.T. Construction &bull; Diamond Harbour &amp; Baruipur, West Bengal
        </div>

      </div>
    </body>
    </html>
  `;

  // 1. Resend API Integration (https://resend.com)
  if (env.RESEND_API_KEY) {
    try {
      const resendPayload = {
        from: env.FROM_EMAIL || 'M.T. Solar <onboarding@resend.dev>',
        to: recipientEmails,
        subject: subject,
        html: htmlContent,
      };

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resendPayload),
      });

      // If Resend returns an error because multiple recipients aren't allowed on unverified test domains,
      // fallback and send to the primary account email so you never miss a lead!
      if (!res.ok && recipientEmails.length > 1) {
        console.warn('Resend batch failed, retrying with primary email:', recipientEmails[0]);
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...resendPayload,
            to: [recipientEmails[0]],
          }),
        });
      }
      return;
    } catch (e) {
      console.error('Resend dispatch failed:', e);
    }
  }

  // 2. Brevo API Integration (https://brevo.com)
  if (env.BREVO_API_KEY) {
    try {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'M.T. Solar System', email: env.FROM_EMAIL || recipientEmails[0] },
          to: recipientEmails.map(email => ({ email })),
          subject: subject,
          htmlContent: htmlContent,
        }),
      });
      return;
    } catch (e) {
      console.error('Brevo dispatch failed:', e);
    }
  }

  // 3. Web3Forms Free API (https://web3forms.com)
  if (env.WEB3FORMS_ACCESS_KEY) {
    try {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: env.WEB3FORMS_ACCESS_KEY,
          subject: subject,
          from_name: 'M.T. Solar Website',
          to_email: recipientEmails.join(','),
          message: JSON.stringify(lead.data, null, 2),
        }),
      });
      return;
    } catch (e) {
      console.error('Web3Forms dispatch failed:', e);
    }
  }

  // 4. Generic Webhook (e.g. Discord, Telegram bot, custom webhook)
  if (env.NOTIFICATION_WEBHOOK_URL) {
    try {
      await fetch(env.NOTIFICATION_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: subject,
          lead: lead,
        }),
      });
    } catch (e) {
      console.error('Custom Webhook dispatch failed:', e);
    }
  }
}
