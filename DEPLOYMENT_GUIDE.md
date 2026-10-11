# M.T. Solar by MTC — GitHub & Cloudflare Pages Deployment Guide

This guide walks you through deploying the **M.T. Solar by MTC** website and its unified forms backend using **GitHub** and **Cloudflare Pages** in the simplest, most reliable way possible.

---

## 🌟 Why This Architecture?
- **Zero Cost**: 100% free hosting, global CDN, and 100,000 free serverless form submissions per day on Cloudflare.
- **No Complex Servers**: No Apache, Nginx, Docker, or Node build pipelines required.
- **Automatic SSL**: Free lifetime HTTPS for your custom domain.
- **Serverless Backend Included**: The `/functions/api/submit-lead.js` endpoint runs automatically on Cloudflare Pages Functions.

---

## Part 1: Push Code to GitHub

### Step 1.1: Open your terminal and navigate to the project directory
```bash
cd /Users/shahnawazkhan/.gemini/antigravity/scratch/mt-solar-website
```

### Step 1.2: Initialize Git and commit all files
```bash
git init
git add .
git commit -m "feat: complete M.T. Solar website with unified Cloudflare backend"
git branch -M main
```

### Step 1.3: Create a new repository on GitHub
1. Log in to your GitHub account at [github.com](https://github.com).
2. Click the **`+`** icon in the top right corner and select **New repository**.
3. Name it (for example: `mt-solar-website`).
4. Keep it **Public** or **Private** (both work with Cloudflare Pages).
5. **Do NOT** initialize with README, .gitignore, or license (we already have our project files).
6. Click **Create repository**.

### Step 1.4: Link and push your local code to GitHub
Run the commands shown on GitHub (replace `<YOUR_USERNAME>` and `<REPO_NAME>` with your details):
```bash
git remote add origin https://github.com/<YOUR_USERNAME>/<REPO_NAME>.git
git push -u origin main
```

---

## Part 2: Deploy on Cloudflare Pages (3 Clicks)

### Step 2.1: Connect GitHub in Cloudflare
1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com).
2. In the left navigation menu, click **Workers & Pages**.
3. Click **Create application** -> select the **Pages** tab -> click **Connect to Git**.
4. Select your GitHub account and choose the repository `mt-solar-website`.
5. Click **Begin setup**.

### Step 2.2: Configure Build Settings
Fill in the configuration fields:
- **Project name**: `mt-solar-website` (or your choice)
- **Production branch**: `main`
- **Framework preset**: `None`
- **Build command**: *(Leave completely empty)*
- **Build output directory**: `.` *(or leave as root)*

### Step 2.3: Deploy!
Click **Save and Deploy**.
Within 30–60 seconds, your site will be live at `https://mt-solar-website.pages.dev`!

> [!NOTE]
> Cloudflare Pages will automatically detect the `/functions` directory and deploy `POST /api/submit-lead` as a live serverless API at `https://<your-project>.pages.dev/api/submit-lead`.

---

## Part 3: Connecting Leads to Google Sheets (Recommended & Free)

To receive every lead directly into a Google Spreadsheet in real time:

### Step 3.1: Create a Google Sheet
1. Open [Google Sheets](https://sheets.new) and create a new spreadsheet named `M.T. Solar - Inbound Leads`.
2. In Row 1, add these column headers:
   - `A1`: `Date & Time`
   - `B1`: `Lead ID`
   - `C1`: `Form Type`
   - `D1`: `Name / Company`
   - `E1`: `Mobile Phone`
   - `F1`: `PIN Code`
   - `G1`: `Monthly Bill / Sanctioned Load`
   - `H1`: `Roof / Details`
   - `I1`: `WBSEDCL Consumer ID`
   - `J1`: `Source Page`

### Step 3.2: Add Google Apps Script Webhook
1. In your Google Sheet, click **Extensions** -> **Apps Script**.
2. Replace all code in the editor with this script:

```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var f = data.fields || {};

    sheet.appendRow([
      data.submitted_at || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      data.lead_id || "",
      data.form_type || "",
      f.name || f.company || f.society || f.representative || f.referrer_name || "",
      f.phone || f.referrer_phone || "",
      f.pincode || f.area || f.friend_location || f.location || "",
      f.monthly_bill || f.load || "",
      f.roof_type || f.purpose || f.position || f.message || "",
      f.consumer_id || "",
      data.source_page || ""
    ]);

    return ContentService.createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Click **Deploy** (top right) -> **New deployment**.
4. Click the gear icon next to "Select type" -> choose **Web app**.
5. Set:
   - **Execute as**: `Me`
   - **Who has access**: `Anyone` *(Crucial: allows Cloudflare to post new leads)*
6. Click **Deploy** -> Authorize access with your Google account -> Copy the **Web App URL** (looks like `https://script.google.com/macros/s/AKfycb.../exec`).

### Step 3.3: Add Webhook to Cloudflare Pages
1. In Cloudflare Dashboard, go to **Workers & Pages** -> click your `mt-solar-website` project.
2. Go to **Settings** -> **Environment variables**.
3. Under **Production**, click **Add variable**:
   - Variable name: `GOOGLE_SHEET_WEBHOOK_URL`
   - Value: *(Paste your Google Web App URL)*
4. Click **Save**.

🎉 **Done!** Every time a customer submits a survey request, subsidy application, commercial inquiry, or partner request on the website, it will instantly add a new row to your Google Sheet!

---

## Part 4: Connecting Custom Domain (e.g. `mtsolarbymtc.com`)

1. In Cloudflare Pages, go to the **Custom domains** tab.
2. Click **Set up a custom domain**.
3. Enter your domain (e.g. `mtsolarbymtc.com` and `www.mtsolarbymtc.com`).
4. Follow the automatic DNS setup. Cloudflare configures free, permanent SSL/HTTPS encryption.

---

## Part 5: Local Offline Testing (Before or After Deploying)

You can test the entire site and forms locally on your computer at any time:

1. Run the local dev server:
   ```bash
   python3 dev-server.py 8080
   ```
2. Open your browser at:
   - `http://localhost:8080/`
   - `http://localhost:8080/pm-surya-ghar.html`
   - `http://localhost:8080/solutions/on-grid.html`
3. Submit any form.
4. Leads are immediately logged in your terminal and saved to `data/leads.json`.
5. View all saved leads in your browser at `http://localhost:8080/api/leads`.
