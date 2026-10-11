# M.T. Solar by MTC — Official Website & Serverless Lead Backend

[![Deployment](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![Database](https://img.shields.io/badge/Database-Cloudflare%20D1%20SQLite-F38020?logo=sqlite&logoColor=white)](https://developers.cloudflare.com/d1/)
[![Performance](https://img.shields.io/badge/Performance-100%2F100%20Lighthouse-00C49F?logo=lighthouse&logoColor=white)](https://pagespeed.web.dev/)

Official website for **M.T. Solar by MTC**, the rooftop solar vertical by **M. T. Construction** (Govt. Electrical & Civil Contractors, West Bengal).

---

## ⚡ Highlights & Key Features

- **Blazing Fast Performance**:
  - Precompiled, purged Tailwind CSS bundle (`style.min.css`) — only **9.1 KB gzipped**!
  - Zero heavy runtime JavaScript styling (`cdn.tailwindcss.com` eliminated).
  - Native image lazy-loading, parallel CDN preconnections, and 1-year immutable edge CDN caching via `_headers`.
- **National Portal Empaneled Vendor**:
  - Highlights **M. T. Construction** as the empaneled vendor on the PM Surya Ghar National Portal (`pmsgmbp.gov.in`).
  - Real-time countdown timer tracking scheme allocation window.
  - Transparent subsidy slabs: ₹30,000 (1 kW), ₹60,000 (2 kW), ₹78,000 (3 kW–10 kW) + WB SC/ST state subsidy.
- **Unified Serverless Backend (`functions/api/submit-lead.js`)**:
  - All 16 interactive forms across the 33 pages submit to a single API endpoint.
  - Automatically saves leads to private **Cloudflare D1 SQLite database**.
  - Dispatches formatted HTML notification emails to `mtsolarbymtc@gmail.com` and `contact@mtsolarbymtc.com` with one-tap Call and WhatsApp buttons.
  - Invisible honeypot bot trap (`_hp`) stops automated web spam without CAPTCHAs.
  - Enforces 10-digit mobile number validation and West Bengal PIN codes (`70xxxx`–`74xxxx`).
- **One-Click CSV Lead Export (`functions/api/export-leads.js`)**:
  - Download all inbound leads into Excel/CSV at any time via `GET /api/export-leads?key=mtc_solar_admin_2026`.

---

## 📁 Project Structure

```
MTSolarByMTC/
├── _headers                     # Cloudflare Pages edge CDN caching & security headers
├── DEPLOYMENT_GUIDE.md          # Complete GitHub & Cloudflare deployment guide
├── README.md                    # Project documentation
├── package.json                 # Dev scripts (build:css, start)
├── dev-server.py                # Local Python dev server with live API simulation
├── data/
│   └── leads.json               # Local lead storage (created in local dev mode)
├── assets/
│   ├── css/
│   │   ├── input.css            # Tailwind v4 source file
│   │   ├── style.min.css        # High-performance compiled CSS bundle (53KB)
│   │   └── custom.css           # Custom design tokens
│   ├── js/
│   │   ├── main.js              # Navbar, dropdown bridge, countdown timer, FAQ
│   │   ├── calculator.js        # Interactive rooftop solar calculator
│   │   └── lead-form.js         # Unified async lead submission handler
│   └── images/
│       └── logo.svg             # Official brand vector logo
├── functions/
│   └── api/
│       ├── submit-lead.js       # Cloudflare Pages serverless lead ingest endpoint
│       └── export-leads.js      # Password-protected CSV lead export endpoint
├── offerings/                   # Homes, Commercial, Housing Societies
├── solutions/                   # On-Grid (Net-metering), Off-Grid, Hybrid
├── presence/                    # Diamond Harbour, Baruipur, Usthi offices
├── blog/                        # 9 educational articles on solar in Bengal
└── legal/                       # Privacy Policy, Terms, Warranty & Cancellation
```

---

## 🚀 Quick Start (Local Development)

To preview the website and test form submissions locally:

```bash
# Start local server
python3 dev-server.py 8080
```

1. Open your browser at `http://localhost:8080/`.
2. Submit any form (Site Survey, PM Surya Ghar subsidy, Commercial inquiry, etc.).
3. Watch the lead log directly to your terminal and persist into `data/leads.json`.
4. Download saved leads as CSV at `http://localhost:8080/api/export-leads`.

---

## 🌐 Deploy to GitHub & Cloudflare Pages

### Step 1: Push to GitHub
```bash
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
git push -u origin main
```

### Step 2: Connect to Cloudflare Pages
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) -> **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
2. Select your repository.
3. Keep default settings:
   - Framework preset: **None**
   - Build command: *(leave blank)*
   - Build output directory: `.` *(leave blank / root)*
4. Click **Save and Deploy**.

### Step 3: Enable Cloudflare D1 Database (Takes 60 seconds)
1. In Cloudflare Dashboard, go to **Storage & Databases** -> **D1 SQL Database** -> **Create database** -> Name it `mt_solar_leads`.
2. In your Pages project -> **Settings** -> **Functions** -> **D1 database bindings** -> **Add binding**:
   - Variable name: `DB`
   - Database: select `mt_solar_leads`
3. Click **Save**.

### Step 4: Enable Direct Email Delivery
1. Get a free API key at [resend.com](https://resend.com).
2. In your Pages project -> **Settings** -> **Environment variables** -> **Add variable**:
   - `RESEND_API_KEY`: *(your Resend API key starting with `re_...`)*
   - `LEAD_NOTIFICATION_EMAILS`: `mtsolarbymtc@gmail.com, contact@mtsolarbymtc.com`
3. Click **Save**.

Full details are documented in [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

---

## 📞 Company Contact Details

- **Vendor Name on PM Surya Ghar Portal**: M. T. Construction
- **Parent Company**: M. T. Construction (Govt. Electrical & Civil Contractors, Estd. 2000)
- **Direct Phone**: [+91 9083326210](tel:+919083326210)
- **Email Inboxes**: `mtsolarbymtc@gmail.com`, `contact@mtsolarbymtc.com`, `sales@mtsolarbymtc.com`
- **Head Office**: Beside Diamond Harbour Police Station, Ward No. 10, Diamond Harbour, South 24 Parganas - 743331, West Bengal
- **Corporate Office**: Padmapukur More, P.O. & P.S. Baruipur, Kolkata - 700144, West Bengal
- **Working Hours**: Monday – Sunday: 9:00 AM – 7:00 PM
