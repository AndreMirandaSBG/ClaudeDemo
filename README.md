# Calculator App

A demonstration calculator web application built with React, TypeScript, and Vite. Deployable to Firebase Hosting.

## Stack

- **React 19** + **TypeScript** — UI and type safety
- **Vite** — fast dev server and production builds
- **Firebase Hosting** — static site deployment

## Project Structure

```
src/
├── components/
│   ├── Calculator.tsx   # Main calculator layout
│   ├── Display.tsx      # Result display panel
│   └── Button.tsx       # Reusable button with variants
├── hooks/
│   └── useCalculator.ts # Calculator state and logic
├── types/
│   └── calculator.ts    # Shared TypeScript types
├── App.tsx
└── index.css
```

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Deploy to Firebase Hosting

### First-time setup

1. Create a Firebase project at https://console.firebase.google.com
2. Update `.firebaserc` with your project ID:
   ```json
   { "projects": { "default": "your-firebase-project-id" } }
   ```
3. Log in to Firebase:
   ```bash
   npx firebase login
   ```

### Deploy

```bash
npm run deploy
```

This runs `npm run build` then `firebase deploy --only hosting`.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run deploy` | Build and deploy to Firebase Hosting |
