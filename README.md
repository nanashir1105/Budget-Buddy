# Budget Buddy

A lightweight personal expense tracker built with vanilla HTML, CSS and JavaScript. No framework, no backend, no database: everything is stored in the browser with `localStorage`.

## Features
- Add income and expenses with category, date and note
- Monthly balance, income and spending summary
- Spending breakdown by category (stacked bar)
- Monthly spending limit with progress meter
- Search and filter transactions
- Export the current view to CSV
- Currency selector using `Intl.NumberFormat`
- Responsive layout, dark mode, keyboard-friendly

## Run locally
Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Deploy
Push to GitHub, then enable **Settings → Pages → Deploy from branch (main, root)**.

## What I practised
- DOM rendering and state management without a library
- Persisting data with `localStorage` and handling corrupt data safely
- Escaping user input to prevent XSS
- Accessible forms, focus states, `prefers-color-scheme` and `prefers-reduced-motion`

## Ideas to extend
- Recurring transactions
- Import from CSV
- Charts with Chart.js
- Convert to React or Vue
