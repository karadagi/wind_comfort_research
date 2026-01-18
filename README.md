# Wind Comfort Research - Visualization App

**Live Demo:** [https://karadagi.github.io/wind_comfort_research/](https://karadagi.github.io/wind_comfort_research/)

A React-based interactive 3D visualization tool for exploring wind comfort and microclimate analysis. This project uses Three.js for 3D rendering and Framer Motion for smooth narrative transitions.

## Features

- **Interactive 3D Viewer**: Explore the site model with orbit controls (rotate, pan, zoom).
- **Narrative Scroll**: Step-by-step storytelling interface that guides you through the analysis.
- **Microclimate Data**: Visualizations for wind roses, log profiles, and comfort zones.
- **Monochrome Styling**: Clean, blueprint-style aesthetic with outline edges.

## Deployment

This project handles deployment automatically using **GitHub Actions**.

### How it works
Every time you push changes to the `main` branch, a workflow builds the site and deploys it to the `gh-pages` branch.

### GitHub Pages Settings
To ensure your site works correctly, please configure your repository settings:

1. Go to **Settings** > **Pages**
2. Under "Build and deployment":
   - **Source**: Select `Deploy from a branch`
   - **Branch**: Select `gh-pages` and `/ (root)`
3. Click **Save**

> **Note**: Even though we use GitHub Actions for the build process, the final artifacts are pushed to a branch (`gh-pages`), so the "Deploy from branch" setting is the correct one to use.

## Run Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the dev server**:
   ```bash
   npm run dev
   ```

3. **Open**: [http://localhost:3000](http://localhost:3000)
