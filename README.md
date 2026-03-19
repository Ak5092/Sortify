# 🎵 Sortify v2 — Spotify Liked Songs Organizer

> Lacuna brand design · All 403 Forbidden causes fixed · Icons generated in-code

---

## 🚨 Why You Got 403 Forbidden — Complete Diagnosis

There are **5 distinct root causes** for Spotify API 403 errors. Sortify v2 fixes all of them:

### Cause 1 — `user-library-modify` scope was missing ✅ Fixed
The original app was missing this critical scope, which is required for
`DELETE /v1/me/tracks` (Move mode — removing songs from Liked Songs).
Without it, every Move sync returned 403.

**Fix:** Added `user-library-modify` to the OAuth scope list.

---

### Cause 2 — Stale token with wrong scopes ✅ Fixed
If you authorized the app before this fix, your stored access token was
granted *without* `user-library-modify`. Even after the code is updated,
the old token doesn't auto-update — it still lacks the scope.

**Fix:** On every load, Sortify checks a "scope signature" stored alongside
the token. If the required scopes have changed since you last authorized,
it wipes the old tokens and forces re-authentication with the correct scopes.
You'll see a yellow "Permissions updated — please reconnect" message.

---

### Cause 3 — Development Mode user not allowlisted ✅ Handled gracefully
Spotify apps in Development Mode can only be used by up to **5 accounts**
that are manually added in the Spotify Developer Dashboard.
If *anyone else* tries to log in, every API call returns 403.

**Fix:** Sortify now detects the "User not registered" error message and
shows a clear banner with a direct link to the Spotify Dashboard to add users.

**How to add users:**
1. Go to https://developer.spotify.com/dashboard
2. Click your app
3. Click **Settings**
4. Scroll to **User Management**
5. Click **Add new user** → enter their Spotify account email
6. Save

---

### Cause 4 — Only one of the two playlist-modify scopes requested ✅ Fixed
Spotify has a known platform bug where adding tracks to *any* playlist
(even public ones) can fail with "Insufficient client scope" unless
**both** `playlist-modify-public` AND `playlist-modify-private` are requested.
Many threads on the Spotify Community forum confirm this.

**Fix:** Always request both scopes regardless of playlist visibility.

---

### Cause 5 — Generic 403 / empty error body ✅ Handled
Some 403s come back with no message body. These are usually also the
Development Mode allowlist issue. Sortify now shows a diagnostic banner
with both the allowlist fix and a re-connect button.

---

## 🚀 Deploy to Vercel

```bash
# 1. Unzip
unzip sortify-v2.zip && cd sortify-v2

# 2. Deploy
npx vercel

# 3. Copy your URL (e.g. https://sortify-v2-abc.vercel.app)
```

Then immediately:
1. Go to https://developer.spotify.com/dashboard
2. Open your app → Settings → Redirect URIs
3. Add: `https://sortify-v2-abc.vercel.app` (your exact URL)
4. Save

---

## 🎨 Design

Built on the **Lacuna Labs Brand Kit v4**:
- Colors: `#000508` · `#0D1525` · `#3B82F6` · `#06B6D4`
- Font: Inter 200/300/400
- Aura orb backgrounds (radial gradient glows)
- Glassmorphism cards with backdrop-blur
- Dot matrix decoration (blues/cyans fading)
- Wave ribbon sync animation
- Lacuna mark (dashed concentric circles) as app logo

---

## 🖼️ App Icons — Fully In-Code

**No PNG files needed.**

Icons are generated in two places:

1. **Service Worker** (`sw.js`): intercepts requests to `/icons/icon-192.png`
   and `/icons/icon-512.png`, draws them live using `OffscreenCanvas`, and
   returns the PNG response. The icon design lives entirely in the `drawIcon()`
   function in `sw.js`.

2. **Main page** (`index.html`): on load, draws the icon to a hidden `<canvas>`
   and injects the data URL as the `<link rel="apple-touch-icon">` — so iOS
   will use the correct icon when adding to the home screen.

To change the icon design, edit the `drawIcon()` function in `sw.js`.
The same visual is used for all sizes (scaled by the `size` parameter).

---

## 📁 File Structure

```
sortify-v2/
├── index.html    ← App (HTML + CSS + JS, single file)
├── sw.js         ← Service Worker + OffscreenCanvas icon generator
├── manifest.json ← PWA manifest (icons served by SW)
├── vercel.json   ← Vercel headers + rewrites
└── README.md
```

No `icons/` folder needed — the service worker generates them on-demand.

---

## 📱 iOS Home Screen Install

1. Open your Vercel URL in **Safari**
2. Tap **Share** (↑) → **Add to Home Screen**
3. Tap **Add**

The app icon is the Lacuna-style dashed circle mark, rendered from code.

---

## 🔐 Scopes Requested

| Scope | Why |
|-------|-----|
| `user-library-read` | Read your Liked Songs |
| `user-library-modify` | Remove songs from Liked Songs (Move mode) |
| `playlist-read-private` | Read your playlists |
| `playlist-read-collaborative` | Read shared playlists |
| `playlist-modify-public` | Add songs to public playlists |
| `playlist-modify-private` | Add songs to private playlists |
| `user-read-private` | Read your display name + avatar |
| `user-read-email` | Required by Spotify for all user-facing apps |
