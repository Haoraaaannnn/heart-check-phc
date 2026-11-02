# Step-by-Step 100% Free Cloud Deployment Guide for Thesis Defense

Complete, beginner-friendly walkthrough to deploy Heart Check PHC to the public internet with zero local hosting and zero credit card required.

---

## 100% Free Services Used

1. **Frontend (Kiosks, Monitors, Workstations):** **Vercel** (Free Hobby Tier, no credit card)
2. **Database & Realtime Engine:** **Supabase Cloud** (Free Tier, no credit card)
3. **Heavy Python Backend (Analytics & Forecasting):** **Render** (Free Web Service, no credit card)
4. **Physical USB Thermal Printer:** **Client-Side WebUSB** in Google Chrome on your presentation laptop

---

## Part 1: Deploy Python Backend to Render (100% Free - No Credit Card)

### 1. Create a Free Account on Render
1. Go to [render.com](https://render.com) and click **Get Started** or **Sign Up**.
2. Sign up using **GitHub** (the same account where your `Heart_Check_PHC` repository is stored).

### 2. Create a New Web Service
1. In your Render Dashboard, click **New +** (top right) -> select **Web Service**.
2. Choose **Build and deploy from a Git repository** -> click **Next**.
3. Under "Connect a repository", find **Heart_Check_PHC** and click **Connect**.

### 3. Configure the Service Settings
Fill in the deployment form with the following exact settings:

* **Name:** `heart-check-backend` (or any name you choose)
* **Region:** Singapore or Oregon (choose the closest to you)
* **Branch:** `main` (or whichever branch has your latest code)
* **Root Directory:** `python_backend`
* **Runtime:** `Python 3`
* **Build Command:** `pip install -r requirements.txt`
* **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
* **Instance Type:** Select **Free** ($0 / month)

### 4. Add Environment Variables
Scroll down to the **Environment Variables** section and click **Add Environment Variable** for each:

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | *(Your Supabase project URL from `.env.local`, e.g. `https://xxxx.supabase.co`)* |
| `SUPABASE_SERVICE_ROLE_KEY` | *(Your Supabase Service Role Key from `.env.local`)* |
| `ALLOWED_ORIGINS` | `*` |

### 5. Deploy
1. Click **Create Web Service** at the bottom of the page.
2. Render will pull your repository, install dependencies from `requirements.txt`, and start Uvicorn.
3. Once the build logs finish, your service status will say **Live** with a green badge.
4. Copy your service URL at the top left of the page:
   `https://heart-check-backend-xxxx.onrender.com`

You can verify it by opening `https://heart-check-backend-xxxx.onrender.com/health` in your browser. It will return:
```json
{"status": "ok", "message": "Analytics backend is running"}
```

### 6. Defense Day Tip: Keep Render Awake
Render free instances go to sleep after 15 minutes of inactivity. To prevent any 50-second wake-up delay during your thesis defense:
1. Open [cron-job.org](https://cron-job.org) (100% free) or [uptimerobot.com](https://uptimerobot.com).
2. Create a free monitor/job to ping `https://heart-check-backend-xxxx.onrender.com/health` every 10 minutes.
3. This keeps your backend 100% awake and responsive with 0ms cold starts throughout your presentation.

---

## Part 2: Deploy Next.js Frontend to Vercel (100% Free)

### 1. Create a Free Account on Vercel
1. Go to [vercel.com/signup](https://vercel.com/signup).
2. Click **Continue with GitHub** (sign in with your GitHub account).

### 2. Import Your Project
1. In your Vercel Dashboard, click **Add New...** -> **Project**.
2. Under "Import Git Repository", find `Heart_Check_PHC` and click **Import**.
3. Keep the default settings (**Framework Preset:** Next.js, **Root Directory:** `./`).

### 3. Add Environment Variables
Expand **Environment Variables** and add these 5 keys:

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `INTERNAL_API_URL` | `https://heart-check-backend-xxxx.onrender.com` | Your Render backend URL from Part 1 |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhb...` | Your Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhb...` | Your Supabase Service Role Key |
| `DEEPGRAM_API_KEY` | `ce6a59e681fce9f58c81a4955776e47ab2f6a44e` | Voice synthesis key for TV callouts |

4. Click **Deploy**.

In about 2 minutes, Vercel will give you your permanent live URL:
`https://heart-check-phc.vercel.app`

---

## Part 3: Pair the USB Thermal Receipt Printer via WebUSB

Because the site is deployed to the internet, physical printing is handled directly by Google Chrome on your presentation laptop using WebUSB:

1. Plug your USB thermal receipt printer into your presentation laptop and turn it on.
2. Open **Google Chrome** (or Edge) on the laptop.
3. Open your deployed site:
   `https://heart-check-phc.vercel.app/kiosk` (or `/superadmin`).
4. Click **Pair USB Printer** (or the printer status indicator).
5. A browser popup will appear:
   *"heart-check-phc.vercel.app wants to connect to a USB device"*
6. Select your thermal printer (`POS-58`, `POS-80`, `Epson`, or `USB Printing Support`) and click **Connect**.
7. Chrome permanently saves this pairing.
8. Click **Test Print** or generate a queue ticket to verify that physical receipt paper prints immediately!

---

## Part 4: Thesis Defense Presentation Day

1. **Panelist Access:** Give panel members the URL (`https://heart-check-phc.vercel.app`) or display a QR code on screen. They can access the site from their phones or laptops.
2. **Kiosk & Printer:** Keep the presenter laptop open to `/kiosk` with the USB printer connected. Tickets created on that screen print physically to the receipt printer.
3. **Queue TV Displays:** Open `/monitor/registration` or `/monitor/custom` on a second screen or projector.
4. **Analytics & Machine Learning:** Open `/dashboard/analytics`. Charts and forecasts load seamlessly from your Render backend.
