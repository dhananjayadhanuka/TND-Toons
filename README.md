# TND Toons

A local 2D cartoon animation editor featuring Dhanuka, Thilini and Nurashi.

## Start

Install Node.js, then double-click `TND-Studio/Start TND Studio.cmd`, or run:

```powershell
cd TND-Studio
npm start
```

Open http://127.0.0.1:47831 in Chrome or Edge. No npm packages are required.

## Features

- Dhanuka pose controls and walking actions; independent character tracks.
- Manual animation, drawing tools, editable vector items and reusable parts.
- Clip Save As, local clip gallery, per-clip Undo/Redo and Full HD video export.
- Background library, animated rain and Dhanuka appearance colors.

Browser autosave, My clips and My items are local to the browser and are not included in a Git push. Keep downloaded `.tnd.json` project files to transfer editable clips.

See `TND-Studio/EDITOR-WORKFLOW.md` for the current workflow, keyboard shortcuts, supported controls and limitations. Three-dimensional models/360-degree turning are not implemented.

## Tests

```powershell
cd TND-Studio
npm test
```

The `tests/*-browser.mjs` scripts launch isolated Chromium QA sessions; their default browser paths may need adjustment on another computer. Generated review screenshots are excluded from Git. Source artwork and generated assets remain under `TND-Studio/assets` and `Approved Character Views`.
