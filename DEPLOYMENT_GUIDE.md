# M.T. Solar by MTC — GitHub & Cloudflare Pages Deployment Guide

This guide walks you through deploying the **M.T. Solar by MTC** website with its unified serverless backend:
1. **GitHub Repository** for version control.
2. **Cloudflare Pages** for free global hosting, automatic SSL, and zero maintenance.
3. **Direct Email Delivery** to `mtsolarbymtc@gmail.com` and `contact@mtsolarbymtc.com`.
4. **Cloudflare D1 Database** to store all leads natively in a private SQLite database inside Cloudflare (with instant CSV spreadsheet download).

*(No Google Sheets, no complex servers, zero monthly fees!)*

---

## Part 1: Push Code to GitHub

### Step 1.1: Initialize Git and commit all files
Run in your terminal from the project folder:
```bash
cd /Users/shahnawazkhan/.gemini/antigravity/scratch/mt-solar-website
git add .
git commit -m "feat: unified lead backend with Cloudflare D1 and direct email delivery"
```

### Step 1.2: Create a new repository on GitHub
1. Log in to your GitHub account at [github.com](https://github.com).
2. Click the **`+`** icon in the top right corner and choose **New repository**.
3. Repository name: `mt-solar-website` (or your choice).
4. Select **Public** or **Private**.
5. Leave all checkboxes (README, .gitignore, license) unchecked.
6. Click **Create repository**.

### Step 1.3: Push your code to GitHub
Run the commands provided by GitHub (replace `<YOUR_USERNAME>` with your GitHub username):
```bash
git remote add origin https://github.com/<YOUR_USERNAME>/mt-solar-website.git
git push -u origin main
```

---

## Part 2: Deploy to Cloudflare Pages (3 Clicks)

### Step 2.1: Connect GitHub in Cloudflare
1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com).
2. In the left navigation menu, click **Workers & Pages**.
3. Click **Create application** -> select the **Pages** tab -> click **Connect to Git**.
4. Select your GitHub account and choose the `mt-solar-website` repository.
5. Click **Begin setup**.

### Step 2.2: Configure Build Settings
Fill in the deployment settings:
- **Project name**: `mt-solar-website`
- **Production branch**: `main`
- **Framework preset**: `None`
- **Build command**: *(Leave completely blank)*
- **Build output directory**: `.` *(Leave blank / root)*

Click **Save and Deploy**.
Within 30–60 seconds, your site is live globally at `https://mt-solar-website.pages.dev`!

---

## Part 3: Set Up Cloudflare D1 Database (Private Native Database)

Cloudflare D1 is Cloudflare's serverless SQLite database. It is 100% free (5 million queries/month, 10 GB storage) and keeps all your leads privately inside your Cloudflare account.

### Step 3.1: Create the D1 Database
1. In Cloudflare Dashboard, go to **Storage & Databases** -> **D1 SQL Database**.
2. Click **Create database**.
3. Name it: `mt_solar_leads`
4. Click **Create**.

### Step 3.2: Bind the Database to Cloudflare Pages
1. Go back to **Workers & Pages** -> click your `mt-solar-website` project.
2. Go to **Settings** -> **Functions**.
3. Scroll down to **D1 database bindings** -> click **Add binding**.
4. Set:
   - **Variable name**: `DB` *(Must be uppercase `DB`)*
   - **D1 database**: Select `mt_solar_leads`
5. Click **Save**.

🎉 **That's it!** The backend endpoint `/api/submit-lead` will automatically create the `leads` table and securely store every form submission (Site Surveys, PM Surya Ghar Subsidies, Commercial Inquiries, Referrals, and Applications).

### Step 3.3: How to View & Download Your Leads
You have two simple ways to access your leads:
1. **From Cloudflare Dashboard**:
   - Go to **Storage & Databases** -> **D1** -> `mt_solar_leads` -> **Explore data** -> Table `leads`.
   - You can view all rows or click **Export**.
2. **One-Click CSV Download Link**:
   - Visit: `https://<your-project>.pages.dev/api/export-leads?key=mtc_solar_admin_2026`
   - It instantly downloads `mt_solar_leads_YYYY-MM-DD.csv`, which opens directly in Microsoft Excel or Apple Numbers!
   *(You can change the secret key anytime by adding the environment variable `ADMIN_EXPORT_KEY` in Pages Settings).*

---

## Part 4: Set Up Direct Email Notifications to Your Inboxes

Whenever a customer fills out any form on the site, you will receive an instant, formatted email notification with their details and one-tap **Call Customer** / **WhatsApp** buttons.

We recommend **Resend** (free, 3,000 emails/month, 30-second setup):

### Step 4.1: Get a Free Resend API Key
1. Go to [resend.com](https://resend.com) and sign up (takes 30 seconds).
2. Go to **API Keys** -> click **Create API Key**.
3. Copy the key (starts with `re_...`).

### Step 4.2: Add the Key to Cloudflare Pages
1. In Cloudflare Dashboard, go to **Workers & Pages** -> click your `mt-solar-website` project.
2. Go to **Settings** -> **Environment variables**.
3. Under **Production**, click **Add variable**:
   - Variable name: `RESEND_API_KEY`
   - Value: *(Paste your `re_...` API key)*
4. (Optional) Add `LEAD_NOTIFICATION_EMAILS`:
   - Value: `mtsolarbymtc@gmail.com, contact@mtsolarbymtc.com, sales@mtsolarbymtc.com`
5. Click **Save**.

*(Alternative Email Providers Supported)*: If you prefer Brevo or Web3Forms, simply set `BREVO_API_KEY` or `WEB3FORMS_ACCESS_KEY` instead.

---

## Part 5: Connect Custom Domain (`mtsolarbymtc.com`)

1. In Cloudflare Pages, go to the **Custom domains** tab.
2. Click **Set up a custom domain**.
3. Enter `mtsolarbymtc.com` (and `www.mtsolarbymtc.com`).
4. Cloudflare automatically sets up DNS routing and provisions free lifetime SSL/HTTPS certificates.

---

## Part 6: Local Development & Offline Testing

To test the website, forms, and database locally on your computer:

```bash
python3 dev-server.py 8080
```
- Open `http://localhost:8080/` in your browser.
- Submit any form (Site Survey, PM Surya Ghar subsidy, Commercial inquiry, etc.).
- Watch the colorized lead print in your terminal and save to `data/leads.json`.
- Download CSV locally at `http://localhost:8080/api/export-leads`.
