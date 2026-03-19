const CLIENT_ID = 'fcce7972e4c14b569c80597bff984858';
const REDIRECT_URI = window.location.origin;
const SCOPES = 'user-library-read playlist-read-private playlist-modify-private playlist-modify-public';

const cta = document.getElementById('cta');
const log = document.getElementById('log');
const statusText = document.getElementById('status');

// Handle Auth Token
const hash = new URLSearchParams(window.location.hash.replace('#','?'));
let token = hash.get('access_token');

if (token) {
    cta.innerText = "Execute Autonomous Sync";
    cta.onclick = runGapEngine;
    window.history.pushState("", document.title, window.location.pathname);
} else {
    cta.onclick = () => {
        window.location = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}&response_type=token&show_dialog=true`;
    };
}

async function runGapEngine() {
    cta.disabled = true;
    log.innerText = "SCANNING LIBRARY...";

    try {
        // 1. Get Liked Songs
        const likedData = await spotifyFetch('/me/tracks?limit=10');
        const songIds = likedData.items.map(i => i.track.id);
        
        // 2. Get Your Playlists
        const playlistData = await spotifyFetch('/me/playlists?limit=10');
        const playlists = playlistData.items.filter(p => p.owner.id !== 'spotify');

        log.innerText = "CALCULATING VIBE VECTORS...";
        
        for (let songId of songIds) {
            const features = await spotifyFetch(`/audio-features/${songId}`);
            
            // Simplified "Vibe" = Energy + Danceability
            let bestPlaylist = null;
            let minDiff = 2.0;

            for (let p of playlists) {
                // We'll simulate vibe checking by looking at the first 5 tracks of each playlist
                const pTracks = await spotifyFetch(`/playlists/${p.id}/tracks?limit=5`);
                const pIds = pTracks.items.map(t => t.track.id).join(',');
                const pFeatures = await spotifyFetch(`/audio-features?ids=${pIds}`);
                
                const avgEnergy = pFeatures.audio_features.reduce((a, b) => a + b.energy, 0) / pFeatures.audio_features.length;
                const diff = Math.abs(features.energy - avgEnergy);

                if (diff < minDiff) {
                    minDiff = diff;
                    bestPlaylist = p;
                }
            }

            if (bestPlaylist) {
                log.innerText = `MATCH FOUND: ${bestPlaylist.name}`;
                await fetch(`https://api.spotify.com/v1/playlists/${bestPlaylist.id}/tracks`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ uris: [`spotify:track:${songId}`] })
                });
            }
        }

        log.innerText = "ENGINE CYCLE COMPLETE.";
        statusText.innerText = "All gaps filled based on acoustic similarity.";
    } catch (err) {
        log.innerText = "ERROR: CHECK CONSOLE";
        console.error(err);
    }
}

async function spotifyFetch(endpoint) {
    const res = await fetch(`https://api.spotify.com/v1${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
}
