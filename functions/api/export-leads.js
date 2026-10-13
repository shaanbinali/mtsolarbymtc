/**
 * Cloudflare Pages Function: Export All Leads to CSV
 * Endpoint: GET /api/export-leads?key=YOUR_ADMIN_KEY
 * Allows downloading all stored leads from Cloudflare D1 as a CSV spreadsheet.
 */

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const providedKey = url.searchParams.get('key');
  const expectedKey = context.env.ADMIN_EXPORT_KEY || 'mtc_solar_admin_2026';

  if (!providedKey || providedKey !== expectedKey) {
    return new Response('Unauthorized. Please provide ?key=YOUR_SECRET_KEY in the URL.', {
      status: 401,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  if (!context.env.DB) {
    return new Response('Cloudflare D1 Database binding "DB" is not connected.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  try {
    // Ensure table exists so query never fails even on fresh/empty database
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

    const { results } = await context.env.DB.prepare(`
      SELECT id, lead_id, form_type, name, phone, pincode, source_page, details_json, created_at
      FROM leads
      ORDER BY id DESC;
    `).all();

    // Generate CSV Header
    const headers = ['ID', 'Lead ID', 'Form Type', 'Customer Name', 'Phone', 'PIN / Area', 'Source Page', 'Submitted At', 'Full Details'];
    const rows = [headers.map(h => `"${h}"`).join(',')];

    for (const r of (results || [])) {
      const sanitizedDetails = (r.details_json || '').replace(/"/g, '""');
      rows.push([
        r.id,
        `"${r.lead_id || ''}"`,
        `"${r.form_type || ''}"`,
        `"${(r.name || '').replace(/"/g, '""')}"`,
        `"${r.phone || ''}"`,
        `"${r.pincode || ''}"`,
        `"${r.source_page || ''}"`,
        `"${r.created_at || ''}"`,
        `"${sanitizedDetails}"`,
      ].join(','));
    }

    const csvContent = rows.join('\r\n');
    const filename = `mt_solar_leads_${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return new Response(`Database query error: ${err.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
