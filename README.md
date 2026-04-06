# PAC-DASH 🟡👻

[![CI](https://github.com/devopsjester/phaser-game-experiment/actions/workflows/ci.yml/badge.svg)](https://github.com/devopsjester/phaser-game-experiment/actions/workflows/ci.yml)
[![Release](https://github.com/devopsjester/phaser-game-experiment/actions/workflows/release.yml/badge.svg)](https://github.com/devopsjester/phaser-game-experiment/actions/workflows/release.yml)

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

## Running Tests

The project uses [Jest](https://jestjs.io/) for automated testing. Tests cover the perspective math, game constants, collision logic, scoring, power-ups, difficulty ramping, and scene lifecycle.

```bash
# Install dependencies (includes Jest)
npm install

# Run the full test suite
npm test
```

Jest is configured via `package.json` to pick up every `*.test.js` file in the `tests/` directory. A small setup file (`tests/setup.js`) provides a minimal Phaser mock so that game logic can run in Node.js without a browser.

### What Is Tested

| Test file | Coverage |
|-----------|----------|
| `perspPos.test.js` | Perspective projection helper — horizon, player plane, linearity, spread |
| `constants.test.js` | Game constants — canvas, road/lane layout, depth, scoring, difficulty |
| `config.test.js` | Phaser configuration — dimensions, scenes, renderer |
| `gameScene.test.js` | Core gameplay — init state, wafer/fruit/ghost collisions, power-ups, difficulty ramp, game over, object lifecycle |
| `gameOverScene.test.js` | Game-over screen — score passing, scene restart |

## Project Structure

```
├── .github/
│   └── workflows/
│       ├── azure-static-web-apps.yml  # Azure Static Web Apps deploy
│       ├── ci.yml                     # CI workflow (build & test)
│       └── release.yml                # Release workflow (package & publish)
├── index.html                # Entry point
├── staticwebapp.config.json  # Azure Static Web Apps route config
├── lib/
│   └── phaser.min.js         # Phaser 3.60 (committed for offline use)
├── src/
│   └── game.js               # All game logic and scenes
├── tests/
│   ├── setup.js              # Phaser mock for Node.js / Jest
│   ├── perspPos.test.js      # Perspective helper tests
│   ├── constants.test.js     # Game constants tests
│   ├── config.test.js        # Phaser config tests
│   ├── gameScene.test.js     # Core gameplay logic tests
│   └── gameOverScene.test.js # Game-over scene tests
└── package.json
```

## CI/CD

This project uses [GitHub Actions](https://docs.github.com/en/actions) for continuous integration and releases.

### CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main`:

1. **Checkout** — clones the repository.
2. **Setup Node.js 20** — installs the runtime with npm caching.
3. **Install dependencies** — runs `npm ci`.
4. **Run tests** — executes the full Jest test suite (`npm test`).
5. **Package game** — copies `index.html`, `src/`, and `lib/` into a `dist/` directory.
6. **Upload artifact** — uploads the packaged game as a downloadable build artifact (retained for 14 days).

### Release Workflow (`.github/workflows/release.yml`)

Runs when a version tag (`v*`) is pushed:

1. **Checkout, setup, install, and test** — same as CI to ensure the release is healthy.
2. **Package** — bundles the game files plus `README.md` and `package.json` into a zip archive (`pac-dash-<tag>.zip`).
3. **Create GitHub Release** — publishes a new GitHub Release with auto-generated release notes and attaches the zip archive.

### Creating a Release

To publish a new release:

```bash
# Tag the current commit
git tag v1.0.0

# Push the tag to trigger the release workflow
git push origin v1.0.0
```

The release workflow will automatically create a GitHub Release with the packaged game attached as a `.zip` file. Users can download the zip, extract it, and open `index.html` in any modern browser to play — no server or build step required.

### Azure Static Web Apps Workflow (`.github/workflows/azure-static-web-apps.yml`)

Deploys the game to [Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/) on every push to `main`. Pull requests get automatic preview environments with unique URLs.

1. **Checkout, setup, install, and test** — same as CI to ensure the deploy is healthy.
2. **Deploy** — uploads the site to Azure Static Web Apps using the `Azure/static-web-apps-deploy@v1` action.
3. **Close PR** — tears down the preview environment when a pull request is closed.

## Deploying to Azure

PAC-DASH is deployed to [Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/) (Free tier).

### Prerequisites

- An [Azure account](https://azure.microsoft.com/free) (the free tier is sufficient)
- An Azure subscription (auto-created with a free account)

### Setup via Azure Portal

1. Go to [portal.azure.com](https://portal.azure.com) → **Create a resource** → search **Static Web App** → **Create**.
2. Fill in the form:
   - **Subscription**: your Azure subscription
   - **Resource Group**: create new, e.g. `pac-dash-rg`
   - **Name**: `pac-dash`
   - **Plan type**: Free
   - **Region**: choose one near your users
   - **Source**: GitHub
3. Sign in with GitHub and select:
   - **Organization**: `devopsjester`
   - **Repository**: `pac-dash-game`
   - **Branch**: `main`
4. Under **Build Details**:
   - **Build Preset**: Custom
   - **App location**: `/`
   - **Api location**: *(leave blank)*
   - **Output location**: *(leave blank)*
5. Click **Review + Create** → **Create**.

Azure will automatically add a deployment token as a GitHub repository secret named `AZURE_STATIC_WEB_APPS_API_TOKEN`. The workflow in `.github/workflows/azure-static-web-apps.yml` references this secret to authenticate deployments.

> **Note:** If Azure creates its own workflow file during setup, you can safely delete it — this repository already includes the workflow at `.github/workflows/azure-static-web-apps.yml`.

### Setup via Azure CLI

```bash
az login
az group create --name pac-dash-rg --location eastus2
az staticwebapp create \
  --name pac-dash \
  --resource-group pac-dash-rg \
  --source https://github.com/devopsjester/pac-dash-game \
  --location eastus2 \
  --branch main \
  --app-location "/" \
  --output-location "" \
  --login-with-github
```

### Accessing the Deployed Site

After deployment, find your URL in the Azure Portal under your Static Web App's **Overview** page:

```
https://<generated-name>.azurestaticapps.net
```

### Custom Domain (Optional)

1. In Azure Portal → your Static Web App → **Custom domains** → **Add**.
2. Create a CNAME record in your DNS provider pointing to `<generated-name>.azurestaticapps.net`.
3. Azure provisions a free SSL certificate automatically.

## License

This project is licensed under the MIT License.