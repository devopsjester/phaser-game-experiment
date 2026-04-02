# PAC-DASH 🟡👻

A Pac-Man themed, Subway Surfers-style endless dodge game built with [Phaser 3](https://phaser.io/). All visuals are generated programmatically — no external image assets required.

You control Pac-Man from a third-person perspective as ghosts, wafers, and fruit rush toward you down a three-lane road. Dodge ghosts, collect wafers for points, and grab fruit to activate a power-up that lets you eat ghosts for bonus points.

## Rules

| Item | Effect |
|------|--------|
| 🔴🟣🔵🟠 **Ghosts** | Hitting a ghost costs one life. Four colour variants (red, pink, cyan, orange). |
| 🟡 **Wafers** | Pac-dot pellets worth **+10 points** each. |
| 🍒 **Fruit** | Activates a **10-second power-up**. Worth **+100 points** on pickup. |
| 👻 **Eating ghosts** | While powered up, collide with ghosts for **+200 points** instead of losing a life. |
| ⏱️ **Survival bonus** | **+5 points** awarded every second you stay alive. |
| ❤️ **Lives** | You start with **3 lives**. Game over when all lives are lost. |
| 📈 **Difficulty** | Ghosts spawn faster and move quicker the longer you survive. |

### Controls

Move your **mouse left and right** to steer Pac-Man across the three lanes. Click to start (or restart after game over).

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari)
- [Git](https://git-scm.com/) to clone the repository
- [Node.js](https://nodejs.org/) (optional — only needed if you want to use the built-in dev server)

### Clone the Repository

```bash
git clone https://github.com/devopsjester/phaser-game-experiment.git
cd phaser-game-experiment
```

### Run Locally

**Option 1 — Open directly in a browser**

Simply open `index.html` in your browser. No build step or server is required; Phaser 3.60 is included in the `lib/` directory.

**Option 2 — Use the built-in dev server**

```bash
npm start
```

This runs `npx serve . -p 8080` and serves the game at [http://localhost:8080](http://localhost:8080).

## Project Structure

```
├── index.html        # Entry point
├── lib/
│   └── phaser.min.js # Phaser 3.60 (committed for offline use)
├── src/
│   └── game.js       # All game logic and scenes
└── package.json
```

## License

This project is licensed under the MIT License.