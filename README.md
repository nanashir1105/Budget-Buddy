# Budget Buddy

A personal expense tracker built with vanilla HTML, CSS and JavaScript. No framework, no backend, no database: everything is stored in the browser with `localStorage`.

## Features
- Add income and expenses with category, date and note, with inline validation
- Summary cards: balance, income, spent and savings rate
- Plain-language insights: biggest category, daily average, change vs last month, month-end projection
- Spending breakdown by category with percentages
- 6-month income vs spending chart
- Monthly spending limit with progress meter
- Undo after deleting a transaction
- Search, filter and CSV export
- First-visit guide and one-click sample data
- Currency selector (`Intl.NumberFormat`), dark mode, responsive, keyboard-friendly

## Run locally
Open `index.html` in a browser, or run `npx serve .`

## Deploy
Push to GitHub, then Settings → Pages → Deploy from branch (`main`, root).

## What I practised
- DOM rendering and state management without a library
- Deriving insights from data (aggregation, month-over-month comparison, projection)
- Safe `localStorage` use and escaping user input to prevent XSS
- Accessible forms, focus states, `prefers-color-scheme`, `prefers-reduced-motion`

## Known limits
Data lives in one browser only. A next step would be an API or cloud sync.
