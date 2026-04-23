# Monet Hand Gallery

An interactive, hand-controlled gallery of Claude Monet's paintings. Control the experience entirely through hand gestures — no mouse or keyboard needed.

Built with React, Vite, and MediaPipe Hands.

---

## Gestures

| Gesture | Hand | Action |
|---|---|---|
| Pinch (index + thumb together) | Left | Orbit & spin the carousel |
| Pinch — short tap | Right | Add a painting |
| Pinch — hold ≥ 0.6s | Right | Remove a painting |
| Both hands pinch simultaneously | Both | Zoom into the front painting |
| Index + thumb spread open, other fingers closed | Both | Expand the arc |
| All fingers open | Both | Switch to full-frame grid view |

---

## Tech Stack

- **React 19 + Vite**
- **MediaPipe Hands** — real-time hand landmark detection via webcam
- **CSS 3D transforms** — perspective carousel with physics-based spin
- **Paintings** — 19 public domain works from the Art Institute of Chicago

---

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Allow camera access when prompted.

---

## Deployment

Deployed via Vercel, connected to this GitHub repository. Pushes to `main` trigger automatic deploys.

---

## Paintings

All 19 paintings are served locally from `public/paintings/` and sourced from the [Art Institute of Chicago](https://www.artic.edu/) open-access collection. Works include Water Lilies, Stacks of Wheat, Cliff Walk at Pourville, and more — spanning Monet's career from 1867 to 1919.
