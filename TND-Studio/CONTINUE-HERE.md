# TND Studio — continuation notes

## Latest state (continued 2026-11-16)

Work resumed after the pause below. See DHANUKA-ACTION-SET.md, UPPER-BODY-LAUGH.md and BELLY-LAUGH-MILESTONE.md. Dhanuka has six facial presets across Front/3-quarter/Side; owner approved their overall appearance but requested upper-body-only Laugh, now implemented. Owner wants natural distinct laugh variants and prioritizes quality over time. First Front Belly Laugh rig draft is implemented and awaiting motion/likeness review at /belly-preview.html. It has independent IK arms, hand reach/contact/release, cached torso/face layers, planted feet and upper-body deformation. 18 tests passed; dedicated editor Belly project export passed (759898-byte WebM). Existing presets preserved. Do not claim rolling/kneeling/stamping variants or all-view articulated rigs are finished. Original pause notes below are historical.

Saved 2026-11-15. User asked to pause and continue tomorrow. Do not restart this project or regenerate the characters by default.

## User's intended product

Simple personal cartoon editor, online or offline; current implementation is an offline local browser app with a Node static server. TND means Thilini, Nurashi, Dhanuka, three siblings. Target primarily USA, all ages, meaningful humorous stories. Characters never speak; faces and body actions tell the story, with a separate narrator audio track. Character identity must be protected rigorously. User cannot draw/rig characters and expects us to create the character library.

User wants: select one/all siblings; click a character at any timeline time; independently assign expressions/actions at the same moment; reusable character-specific emotions/actions; backgrounds; outfits; position and scale interpolation for approaching the camera; a simple interface; project save/load and video export. They have authorized building it.

## Files already made

- `index.html`, `style.css`, `app.mjs`: dependency-free editor UI and canvas renderer.
- `core.mjs`: project model, independent actor tracks, keyframe interpolation, whole-sprite motion presets, project validator.
- `server.mjs`: loopback static server at http://127.0.0.1:47831.
- `Start TND Studio.cmd`: launches browser and server (launcher startup sequencing needs improvement).
- `assets/original-reference.png`: copy of supplied source, never overwritten. Original remains one directory above.
- `assets/drafts/{dhanuka,thilini,nurashi}-expressions.png`: three AI-generated 1536×1024 RGBA sheets, 3 columns × 2 rows, happy/sad/surprised then angry/scared/crying. All are DRAFTS, not owner-approved. Keep separate from original.
- `library/characters.json`: sheet metadata.
- `library/generation-prompts.json`: exact prompts, tool and provenance.
- `tests/core.test.mjs`: six tests, all passed.
- `tests/browser-check.mjs`: isolated Brave headless CDP QA harness; first run failed with `Target crashed`, so browser verification has NOT passed.

## What is implemented, not fully verified

Character selection/add/remove, original sprites rendered from source crops with edge-connected white background hidden at runtime, independent tracks, expression pose switching, draft status and project-level approval controls, drag positioning, keyframes, scale/rotation/flip, motion clips, four canvas backgrounds, background upload, narrator audio import, landscape/portrait/square, undo/redo, IndexedDB autosave, downloadable JSON project, import validation, MediaRecorder export with narrator track.

Only JS syntax checks and core data tests have passed. Server returned HTTP 200. Do NOT present the app or video export as browser-tested or production-ready.

## Important limitations and next work

1. Get isolated browser QA working. In-app CUA timed out twice. Windows helper discovery worked after one timeout. Automatic approval rejected capturing user's unrelated Chrome window (YouTube title); do NOT inspect that unrelated window. Use only our isolated profile/own preview. Headless Brave started but Target crashed. Could try disabling GPU in dedicated test browser or launching our own distinct preview window; don't weaken browser security.
2. Inspect all three AI sheets visually on a light/checker background and evaluate alpha. Dhanuka sheet visually seemed to have golden glow/halo around characters; its background transparency quality is unverified. Sheet cell bounds and full hair must be verified. Do not claim exact identity fidelity. Iterate with image_gen if needed; retain versions and label drafts.
3. Current animation is WHOLE-CHARACTER sprite motion and static expression poses. It is NOT an independent limb rig or true walking cycle. User's original goal needs actual articulated assets/rigs, dedicated walk/run/fall animations and approved additional views. Do not substitute whole-sprite bounce for a finished rig.
4. Only original outfits exist. Additional outfit assets and selection still need implementation.
5. Test same-time expressions on two tracks, interpolation, drag transforms, audio, save/open, undo, persistent reload, mobile layout, video export and cancellation. Fix failures before claiming readiness.
6. Export code needs reliability review: initial media loading timeout cleanup; recording cancellation on hidden tab; ensure no unhandled promise on errors. Runtime UI error reporting could improve. Duration shortening retains hidden keys, which may be surprising.
7. Finish Sinhala user guide and easy launcher. Current UI is English; guide has Sinhala short instructions. No API key or paid service required for existing editor functionality. AI narration generation is NOT included; audio import is.
8. Preserve original `.png` and `.mp4` in parent folder. No source control repo existed at start.

## Tests completed

`node --check app.mjs`, `node --check core.mjs`, `node --check server.mjs`: passed.

`node --test tests/core.test.mjs`: 6/6 passed: independent sibling expression keys; interpolation + discrete expression boundaries; replacing same-time keys; motion duration isolation; project round trip; rejecting malformed imports.

Python Pillow is not installed. Do not assume it exists. Node and npm exist. Blender and ffmpeg were not found on PATH. Brave is at `C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe`.

## Resume

Read this file, inspect existing files, then continue verification and character library development. No need for the user to repeat the project explanation. Never promise uninterrupted completion or call draft art approved without user review.

## Mouse controls continuation — 2026-11-17
Owner confirmed controls must live inside TNDToons. See MOUSE-POSE-MILESTONE.md for first integrated Front arm pose editor, exact limits and remaining full-body/continuous-turn work.

## All-view controls and stable interface — 2026-11-17
Owner explicitly requested Front features for Dhanuka ¾, Side, Back and asked us to stop moving the interface each iteration. Read EDITOR-WORKFLOW.md for stable layout contract and current Walk-preview vs future Add-to-scene distinction. See MOUSE-POSE-MILESTONE.md latest section for view rigs. Keep all new tools inside existing Pose / Face / Actions / Move areas.

## Manual frames priority — 2026-11-17
Owner rejected more automatic Walk guessing; manual authoring is now the priority. See latest MOUSE-POSE-MILESTONE.md and EDITOR-WORKFLOW.md. Manual timeline and independent preview camera are implemented and browser-tested. Do not replace authored manual poses with new automatic actions unless user asks. Keep interface locations stable.
