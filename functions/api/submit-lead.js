/**
 * Cloudflare Pages Function: Unified Lead Submission Handler
 * Endpoint: POST /api/submit-lead
 * Deployed natively by Cloudflare Pages from /functions/api/submit-lead.js
 */

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const payload = await context.request.json();

    // 1. Honeypot Bot Trap: If hidden _hp field is filled, silently accept to fool bot
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

    // 2. Mobile validation: ensure 10 digits
    const rawPhone = (data.phone || '').toString().replace(/\D/g, '');
    if (rawPhone.length < 10) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Please enter a valid 10-digit mobile number.',
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 3. West Bengal PIN code qualification for site surveys and subsidy
    if (['site_survey', 'subsidy_application'].includes(formType) && data.pincode) {
      const pin = data.pincode.toString().trim();
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

    // 4. Enrich record with submission metadata
    const leadRecord = {
      lead_id: `MTC-${Date.now()}`,
      form_type: formType,
      source_page: sourcePage,
      source_title: payload.source_title || '',
      submitted_at: new Date().toISOString(),
      client_ip: context.request.headers.get('cf-connecting-ip') || 'unknown',
      fields: data,
    };

    // 5. Optional Integrations (Configured via Cloudflare Pages Environment Variables)

    // Option A: Forward to Google Sheets Webhook (Apps Script)
    const googleSheetWebhook = context.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (googleSheetWebhook) {
      try {
        await fetch(googleSheetWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadRecord),
        });
      } catch (sheetErr) {
        console.error('Google Sheet Webhook Dispatch Error:', sheetErr);
      }
    }

    // Option B: Forward to Notification Webhook (e.g. Email / Discord / Telegram / CRM)
    const notificationWebhook = context.env.NOTIFICATION_WEBHOOK_URL;
    if (notificationWebhook) {
      try {
        await fetch(notificationWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `Solar Lead [${formType.toUpperCase()}]: ${data.name || data.company || 'Customer'} (${rawPhone}) from ${data.pincode || data.location || sourcePage}`,
            lead: leadRecord,
          }),
        });
      } catch (notifyErr) {
        console.error('Notification Webhook Error:', notifyErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Thank you! Your request has been received. Our engineering team will contact you shortly.',
        lead_id: leadRecord.lead_id,
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
