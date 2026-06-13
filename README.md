# Catch My Love 💕

A cute romantic browser game. Control a basket at the bottom of the screen and catch sweet items falling from the top, while avoiding bad ones!

## Install & Run Locally

```bash
npm install
npm start
```

Then open **http://localhost:3000** in your browser.

## How to Play

| Control | Action |
|---------|--------|
| Mouse move | Basket follows cursor |
| Touch / drag | Basket follows finger (mobile) |
| Arrow keys ← → | Move basket left / right |
| M key | Toggle sound on/off |
| Space / Enter | Start game from title/game over screen |

**Catch** ❤️ 🌸 ✈️ 🍕 🍫 🧸 🌮 🤗 💋 💐 🍓 🎀 💍 to earn points.

**Avoid** 🕷️ ⏰ 💩 **MON** — these cost a life.

You have **3 lives** ❤️❤️❤️. Lose them all and it's Game Over.

Score ≥ 80 unlocks confetti on the game over screen! 🎉

## Customize

Open `game.js` and edit the arrays at the very top of the file:

- **`COMPLIMENTS`** — messages shown when catching a good item (in Romanian by default)
- **`GOOD_ITEMS`** — items that give points (add any emoji + point value)
- **`BAD_ITEMS`** — items that cost a life

## Deploy to Railway

1. Push this project to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-url>
   git push -u origin main
   ```

2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**

3. Select your repository. Railway auto-detects the `Procfile` and runs `node server.js`.

4. Your game is live at the Railway-provided URL in ~1 minute. No extra config needed!

## Project Structure

```
catch-my-love/
├── index.html    ← Game HTML (just a canvas + script tags)
├── style.css     ← Pastel gradient styling, fullscreen canvas
├── game.js       ← All game logic (Canvas 2D)
├── server.js     ← Express static file server
├── package.json  ← npm config + start script
├── Procfile      ← Railway/Heroku process declaration
└── .gitignore
```
