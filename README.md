# Manual vs AI-Assisted Coding

A colourful, fully **offline** mini-website that compares **manual coding** with **AI-assisted coding** in software development.

No server, no API keys, no internet needed - everything runs in your browser.

## What it contains

- **Hero** – animated counters (productivity gain, debugging time, code quality).
- **Section B – Comparison** – two side-by-side annotated Python programs
  (Manual vs AI-assisted) with live syntax highlighting.
- **Section C – Playground** – six simple Python tasks (even/odd, sign check,
  largest of two, sum of two, leap year, factorial). Switch between the
  "Manual" and "AI-Assisted" tabs, edit the inputs, run each example and read
  a short explanation of the AI suggestion.
- **Section D – Analysis Dashboard** – six comparison metrics (0-100) with live
  sliders, two Chart.js charts (bar + radar) and three productivity cards.
- **Section E – Pros & Cons** – advantages and limitations of each approach.
- **Section F – Final Result** – verdict, animated result bars, and a "View
  Summary" modal with a downloadable `.txt` recap.
- **About / Objectives / Scope / Future** – context, aims, boundaries and ideas
  for extending the project.

## How to run

Opening the file is enough:

1. Double-click `index.html` to open it in your preferred browser.
2. That's it. Everything (including Chart.js) is bundled locally.

Optional - serve it like a real static site:

```powershell
# Python
python -m http.server 8000
# then open http://localhost:8000

# Node (if you have npx)
npx serve .
```

## Project structure

```
manual-vs-ai-coding/
|-- assets/
|   `-- chart.umd.js        # Chart.js v4.4.1 (local, no CDN required)
|-- index.html              # all pages/sections in one file
|-- style.css               # theme, glassmorphism, responsive layout
|-- script.js               # interactions, playground, charts, sliders
`-- README.md
```

## Important honesty note

The whole project is an **educational demonstration**.

- The six playground tasks compare a hand-written solution with a **simulated**
  AI suggestion (written for this demo, clearly labelled in the UI).
- All numeric values in the dashboard ("Development time", "Productivity", …)
  are **illustrative example numbers**, not measurements from a real research
  experiment. Users can drag the sliders to explore how the charts change.
- The project deliberately uses **no paid API and no real AI model**, so it is
  free and works fully offline.

## Key conclusion presented

AI-assisted coding can speed up routine tasks, improve productivity, and support
debugging and learning. However, AI-generated code must always be **reviewed,
tested and validated** by a human developer. The most effective approach combines
AI assistance with strong programming fundamentals.

## Ideas for the future

- Add more playground tasks (sorting, string manipulation, file I/O).
- Replace the simulated AI with a real offline model (e.g. a local LLM).
- Export the comparison to PDF with charts embedded.