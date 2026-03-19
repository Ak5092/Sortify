# Sortify — Spotify Liked Songs Organizer

Sort your Spotify Liked Songs into existing playlists — manually or with Auto-Sort.

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your GitHub repo
3. No build settings needed — click **Deploy**

## Setup After Deploy

1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Create a free app
3. Add your Vercel deployment URL as a **Redirect URI** (e.g. `https://your-app.vercel.app`)
4. Paste your Client ID into Sortify when prompted

## Features

- 🎵 Browse all your Liked Songs
- ✅ Select songs manually and add to any playlist
- ✦ Auto-Sort: matches songs to playlists by name/artist keywords
- 🔍 Search & filter liked songs
- 🔐 Secure PKCE OAuth — no backend, no server, no secrets stored
