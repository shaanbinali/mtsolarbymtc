# M.T. Solar by MTC — Complete GitHub & Cloudflare Pages Deployment Guide

This guide provides a comprehensive, step-by-step walkthrough to deploy the **M.T. Solar by MTC** website and its unified serverless backend.

```
[Local Mac: Desktop/MTSolarByMTC]
              │
              ▼ (git push)
       [GitHub Repository]
              │
              ▼ (Automatic Webhook Deployment)
    [Cloudflare Pages Global CDN]
       ├── Static Files (HTML / CSS / JS / SVG)
       └── Pages Functions (/functions/api/*)
              ├── POST /api/submit-lead  ──► [Cloudflare D1 Database] (Private SQLite)
              │                          └──► [Direct Email Alert] (To your inboxes)
              └── GET  /api/export-leads ──► [Download CSV Spreadsheet]
```

---

## 📋 Pre-Flight Checklist
- [x] Website performance optimized (Precompiled 9.1 KB gzipped CSS bundle, deferred JS, 60fps passive scrolling).
- [x] All 16 forms standardized and bound to `/api/submit-lead`.
- [x] Zero reliance on Google Sheets (uses native Cloudflare D1 SQL database + direct email delivery).
- [x] Edge CDN caching headers (`_headers`) configured.
- [x] Project ready on your Desktop at `/Users/shahnawazkhan/Desktop/MTSolarByMTC`.

---

## Part 1: Push Code from Desktop to GitHub

### Step 1.1: Open Terminal and Verify Project Folder
Open your macOS Terminal and navigate to the project on your Desktop:
```bash
cd /Users/shahnawazkhan/Desktop/MTSolarByMTC
```

Check that all files are committed and clean:
```bash
git status
```
*(You should see `On branch main`, `nothing to commit, working tree clean`)*.

---

### Step 1.2: Create a New Repository on GitHub
1. Log in to your GitHub account at **[github.com](https://github.com)**.
2. In the top-right corner, click the **`+`** icon and select **New repository**.
3. Fill in the details:
   - **Repository name**: `MTSolarByMTC` (or `mt-solar-website`)
   - **Description**: `Official website for M.T. Solar by MTC with Cloudflare Pages serverless backend`
   - **Visibility**: Choose **Public** or **Private** (Cloudflare Pages supports both for free).
   - **Initialize repository with**: **Leave ALL boxes UNCHECKED** (Do NOT add README, .gitignore, or license, as your local project already has them).
4. Click **Create repository**.

---

### Step 1.3: Link and Push Local Code to GitHub
Copy and paste these commands into your terminal (replace `<YOUR_GITHUB_USERNAME>` with your actual GitHub username):

```bash
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/MTSolarByMTC.git
git branch -M main
git push -u origin main
```

> [!TIP]
> **Authentication Note**: If GitHub prompts for a password, enter your **Personal Access Token (classic)** with `repo` permissions, or use GitHub Desktop / SSH.

Verify by refreshing your GitHub repository page in your browser — all 44 files, folders, and documents will appear!

---

## Part 2: Connect and Deploy on Cloudflare Pages (3 Clicks)

Cloudflare Pages provides free global hosting with unlimited bandwidth, automatic SSL, and global edge CDN distribution.

### Step 2.1: Connect Your GitHub Account
1. Log in to the **[Cloudflare Dashboard](https://dash.cloudflare.com)**.
2. In the left sidebar, click **Workers & Pages**.
3. Click the blue **Create application** button.
4. Select the **Pages** tab (not Workers).
5. Click **Connect to Git**.
6. Select your GitHub account and choose the repository you just created (`MTSolarByMTC`).
7. Click **Begin setup**.

---

### Step 2.2: Configure Build Settings
Fill in the deployment settings:
- **Project name**: `mtsolarbymtc` (or your choice)
- **Production branch**: `main`
- **Framework preset**: `None`
- **Build command**: *(Leave completely blank)*
- **Build output directory**: `.` *(Type a single dot or leave blank / root)*

---

### Step 2.3: Deploy!
1. Click **Save and Deploy**.
2. Cloudflare will deploy the site across its global edge network in ~30 seconds.
3. You will receive a live URL: `https://<project-name>.pages.dev`!

> [!NOTE]
> Cloudflare Pages automatically detects the `/functions` directory in your repo and activates the serverless API routes `/api/submit-lead` and `/api/export-leads` at zero cost.

---

## Part 3: Set Up Cloudflare D1 Database (Private Native SQLite)

Cloudflare D1 is Cloudflare's serverless SQL database. It stores all form submissions securely inside your Cloudflare account with **5 million free queries per month** and **10 GB storage**.

### Step 3.1: Create the Database in Cloudflare
1. In Cloudflare Dashboard, go to **Storage & Databases** in the left sidebar.
2. Click **D1 SQL Database**.
3. Click **Create database**.
4. Name your database: `mt_solar_leads`
5. Click **Create**.

---

### Step 3.2: Bind the Database to Your Pages Website
1. In the left sidebar, go to **Workers & Pages** -> click your `mtsolarbymtc` project.
2. Go to the **Settings** tab at the top.
3. In the sub-menu on the left, click **Functions**.
4. Scroll down to **D1 database bindings**.
5. Click **Add binding**:
   - **Variable name**: `DB` *(Must be uppercase `DB`)*
   - **D1 database**: Select `mt_solar_leads` from the dropdown.
6. Click **Save**.

🎉 **That's all!** The `/api/submit-lead` endpoint will automatically create the `leads` table on first submission and save every incoming request (Site Survey, PM Surya Ghar subsidy, Commercial audit, Partner, Career, or Seminar registration).

---

### Step 3.3: How to View & Download Your Leads

#### Method A: Instant One-Click CSV Download (Fastest)
Whenever you want to download all inbound leads into Excel or Numbers on your computer or phone, visit:
```
https://<your-project>.pages.dev/api/export-leads?key=mtc_solar_admin_2026
```
This downloads a clean `mt_solar_leads_YYYY-MM-DD.csv` spreadsheet containing:
- Customer Name / Company Name
- Mobile Phone Number
- PIN Code & District
- Form Type (Survey, Subsidy, Commercial, etc.)
- Specific Details (Monthly Bill, Sanctioned Load, Roof Type, Consumer ID)
- Source Webpage URL & Submission Timestamp

> [!TIP]
> You can change the secret download key anytime by adding an environment variable `ADMIN_EXPORT_KEY` in Pages Settings.

#### Method B: Cloudflare Dashboard Console
1. Go to **Storage & Databases** -> **D1** -> `mt_solar_leads`.
2. Click the **Explore data** tab.
3. Click the `leads` table to view all records in a visual table, or run custom SQL queries.
4. Click **Export** to save as SQL or JSON.

---

## Part 4: Set Up Direct Email Notifications to Company Inboxes

Whenever a customer submits any form on the website, you will receive an instant, formatted email notification in your inboxes with customer details and one-tap **Call Customer** / **WhatsApp** buttons.

We recommend **Resend** (takes 30 seconds, 3,000 free emails per month):

### Step 4.1: Get a Free Resend API Key
1. Go to **[resend.com](https://resend.com)** and sign up with your email (100% free, no credit card required).
2. Go to **API Keys** in the left sidebar.
3. Click **Create API Key**.
4. Name it `M.T. Solar Website` -> Click **Add**.
5. Copy the key (starts with `re_...`).

---

### Step 4.2: Add Environment Variables in Cloudflare Pages
1. Go to Cloudflare Dashboard -> **Workers & Pages** -> click your `mtsolarbymtc` project.
2. Go to the **Settings** tab -> click **Environment variables** on the left.
3. Under **Production**, click **Add variable**:
   - Variable name: `RESEND_API_KEY`
   - Value: *(Paste your `re_...` key)*
4. Click **Add variable** again to set recipient emails:
   - Variable name: `LEAD_NOTIFICATION_EMAILS`
   - Value: `mtsolarbymtc@gmail.com, contact@mtsolarbymtc.com, sales@mtsolarbymtc.com`
5. Click **Save**.

### What the Email Alert Looks Like:
```
┌────────────────────────────────────────────────────────┐
│  M.T. SOLAR BY MTC                                     │
│  NEW WEBSITE INQUIRY RECEIVED                          │
├────────────────────────────────────────────────────────┤
│  LEAD TYPE: Rooftop Site Survey & Feasibility          │
│  LEAD ID:   MTC-1791568200123                          │
│  PAGE:      /solutions/on-grid.html                    │
│                                                        │
│  NAME:         Subrata Ghosh                           │
│  PHONE:        9083326210                              │
│  PINCODE:      743331 (Diamond Harbour)                │
│  MONTHLY BILL: ₹3,500                                  │
│  ROOF TYPE:    RCC Concrete Terrace                    │
│                                                        │
│  [ 📞 Call 9083326210 ]   [ 💬 WhatsApp Customer ]     │
└────────────────────────────────────────────────────────┘
```

*(Alternative providers supported)*: If you prefer Brevo or Web3Forms, simply set `BREVO_API_KEY` or `WEB3FORMS_ACCESS_KEY` in environment variables instead.

---

## Part 5: Connect Your Custom Domain (`mtsolarbymtc.com`)

1. In Cloudflare Dashboard, go to **Workers & Pages** -> click your `mtsolarbymtc` project.
2. Click the **Custom domains** tab at the top.
3. Click **Set up a custom domain**.
4. Enter your domain: `mtsolarbymtc.com` (and repeat for `www.mtsolarbymtc.com`).
5. Follow the automatic DNS prompt:
   - If your domain DNS is managed by Cloudflare: Click **Activate domain** (instant 1-click setup).
   - If your domain is registered on GoDaddy / Namecheap / Hostinger: Add the CNAME record pointing to `<project-name>.pages.dev`.
6. Cloudflare automatically generates and renews **free lifetime SSL/HTTPS certificates**.

---

## Part 6: Local Development Server (Offline Testing on Mac)

You can test the entire website, submit test forms, and download test CSV exports locally on your Mac at any time:

```bash
cd /Users/shahnawazkhan/Desktop/MTSolarByMTC
python3 dev-server.py 8080
```

- **Open Website**: `http://localhost:8080/`
- **Test Submissions**: Fill out any form on the home page, PM Surya Ghar page, or On-Grid page.
- **Terminal Log**: New leads are printed with full details and color formatting.
- **Local File Storage**: Stored locally in `data/leads.json`.
- **Download Local CSV**: Visit `http://localhost:8080/api/export-leads`.

---

## ⚡ Ongoing Updates (How to Push Future Changes)

Whenever you edit files on your Desktop in the future:
```bash
cd /Users/shahnawazkhan/Desktop/MTSolarByMTC

# 1. If you added new Tailwind CSS classes, recompile the CSS bundle:
npm run build:css

# 2. Commit and push to GitHub:
git add .
git commit -m "Update website content"
git push origin main
```
Cloudflare Pages will detect the push and automatically deploy the updates globally in ~30 seconds!

---

## 📞 Support & Configuration Summary

| Setting / Variable | Recommended Value | Purpose |
| :--- | :--- | :--- |
| **Local Project Path** | `/Users/shahnawazkhan/Desktop/MTSolarByMTC` | Project root on your Mac |
| **Cloudflare Framework Preset** | `None` | Pure static + Functions |
| **Cloudflare Build Output Dir** | `.` | Root directory |
| **D1 Database Binding** | Variable: `DB` / Database: `mt_solar_leads` | Stores all leads in Cloudflare |
| **Resend Email API Key** | Variable: `RESEND_API_KEY` (`re_...`) | Sends instant lead emails |
| **Notification Recipients** | Variable: `LEAD_NOTIFICATION_EMAILS` | `mtsolarbymtc@gmail.com, contact@mtsolarbymtc.com` |
| **Secret CSV Export Link** | `https://<domain>/api/export-leads?key=mtc_solar_admin_2026` | One-click lead spreadsheet download |
