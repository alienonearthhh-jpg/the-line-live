# The Line

Mobile-first emotional journaling prototype (Russell's Circumplex, dial 1–9).
Live: https://the-line-live.vercel.app · No build step, no API keys, no backend. Plain HTML/CSS/JS.

## Run it locally
```
python3 -m http.server 8000      # then open http://localhost:8000 (on a phone: http://<your-laptop-ip>:8000)
```
Sound needs a tap first (browser rule). Fonts need internet (falls back to system-ui offline).

## Who edits what (so we don't collide)
| File | What's in it |
|---|---|
| `index.html` | Markup for all screens + support sheet |
| `styles.css` | All styling (phone fit is the `/* phone fit */` block) |
| `mood-engine.js` | Offline words → dial + colour. Add vocabulary in `GROUPS`: `[dial, valence, arousal, ...words]` |
| `data.js` | Dial colours/words (`LD`), demo memos, memo saving (localStorage) |
| `audio.js` | Soundscapes (Web Audio synthesis) |
| `dial.js` | Screen 1 — the rotating dial |
| `journal.js` | Screen 2 — live orb, keyword colour tint, sound bars |
| `screens.js` | Navigation, Screen 3 result, receipt download |
| `echo.js` | Echo — orbs for every saved moment, tap to listen. `EchoStore` is the data layer |
| `memo.js` | Memo list + turntable player |
| `app.js` | Button wiring, support sheet |

## Working in parallel
```
git pull
git checkout -b your-name-what-you-do        # e.g. elva-echo-pairing
# edit, test locally
git add . && git commit -m "what changed" && git push -u origin your-name-what-you-do
```
Then open a Pull Request on GitHub. Vercel makes a preview link for every branch; merging into `main` updates the live site (and the QR code stays the same).

## Making Echo shared across phones (next step)
Echo currently shows this device's saved moments plus a seeded crowd. To share between visitors, set `EchoStore.remote` in `echo.js` to an object with `list()` and `add()` backed by a database (e.g. Supabase). Send only `{n, hex, word, ts}` — never the written text.
