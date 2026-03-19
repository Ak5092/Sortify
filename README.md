# 🎵 Sortify — Vercel Deployment Guide

## Deploy in 2 minutes

### Option A — Vercel CLI (fastest)

```bash
# Install Vercel CLI if you don't have it
npm i -g vercel

# Unzip and deploy
unzip sortify-vercel.zip
cd sortify-vercel
vercel

# Follow the prompts:
#  ? Set up and deploy? → Y
#  ? Which scope? → (your account)
#  ? Link to existing project? → N
#  ? Project name → sortify
#  ? Directory → ./
# Done! You'll get a URL like: https://sortify-abc123.vercel.app
```

### Option B — Vercel Dashboard (no CLI)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"** — or drag & drop the unzipped folder
3. No build settings needed — it's a static site
4. Click **Deploy**
5. Copy your deployment URL (e.g. `https://sortify-abc123.vercel.app`)

---

## ⚠️ Required: Add Redirect URI to Spotify

After deploying, you **must** register your Vercel URL with Spotify or login will fail.

1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Open your app → click **Edit Settings**
3. Under **Redirect URIs**, add **both**:
   ```
   https://sortify-abc123.vercel.app
   https://sortify-abc123.vercel.app/index.html
   ```
   *(Replace `sortify-abc123.vercel.app` with your actual Vercel URL)*

4. If you set a custom domain (e.g. `sortify.yourdomain.com`), add that too:
   ```
   https://sortify.yourdomain.com
   ```
5. Click **Save** — takes ~30 seconds to propagate

> The redirect URI in the code is **auto-detected** from `window.location.origin`, so no code changes are needed — just register the URL.

---

## 🖼️ App Icons (before deploying)

1. Open `generate-icons.html` in any browser
2. Click each Download button → save `icon-180.png`, `icon-192.png`, `icon-512.png`
3. Place all 3 files inside the `icons/` folder
4. Then deploy

---

## 📁 Project Structure

```
sortify-vercel/
├── index.html           ← Entire app
├── sw.js                ← Service Worker
├── manifest.json        ← PWA manifest
├── vercel.json          ← Vercel config (headers, rewrites, caching)
├── generate-icons.html  ← Run once to create PNG icons
└── icons/
    ├── icon-180.png     ← (generate before deploying)
    ├── icon-192.png
    └── icon-512.png
```

---

## 📱 Add to iPhone Home Screen

1. Open your Vercel URL in **Safari** on iPhone
2. Tap the **Share** icon (↑)
3. Tap **"Add to Home Screen"**
4. Tap **Add** — Sortify now behaves like a native app

---

## 🔁 Redeploying / Updates

```bash
# From your project folder
vercel --prod
```

Or push to GitHub and connect the repo to Vercel for automatic deploys on every push.
