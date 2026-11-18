# TND Studio — first development version

This is a work in progress. Full browser verification and articulated character rigs are still pending.

## Open

Double-click **Start TND Studio.cmd**. Keep its server window open. If the browser initially says it cannot connect, refresh once the terminal prints the local address.

Alternatively, in this folder run `node server.mjs`, then open http://127.0.0.1:47831 in a modern Chromium browser. Node.js must be installed (it is available on this computer).

## Basic workflow

Select a character, click a time on the timeline, then choose an expression or move/resize the character. Each sibling has an independent track. Changes at later times create keyframes. Position and size interpolate; expressions switch at their saved time. Add motion clips for whole-character effects. Use Scene for backgrounds and narrator audio.

Use **Save project** for a portable `.tnd.json` file. Browser autosave is local to this browser and address. Imported background/audio files are embedded in the project; they are not uploaded. Export records in real time as MP4 or WebM depending on browser support. Export has not yet passed end-to-end browser QA.

මුල් රූපය වෙනස් කරලා නැහැ. අලුත් හැඟීම් artwork සියල්ල Draft ලෙස තබලා තියෙනවා. සම්පූර්ණ අත් පා rig සහ ඇවිදින චලන තවම සූදානම් නැහැ. ඉදිරියට කළ යුතු වැඩ `CONTINUE-HERE.md` ගොනුවේ සටහන් කරලා තියෙනවා.

## Character artwork

Original reference: `assets/original-reference.png`.

Generated expression drafts: `assets/drafts/`. Generated using built-in image_gen; exact prompts are saved in `library/generation-prompts.json`. Six expressions per character: happy, sad, surprised, angry, scared, crying. These require likeness and transparency review before approval.

## Development

No npm dependencies required. Start: `npm start`. Core tests: `npm test`. Isolated browser QA harness: `node tests/browser-check.mjs` (currently failing at browser target startup).
