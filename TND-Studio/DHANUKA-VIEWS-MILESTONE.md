# Dhanuka views and Side Blink

Review at /dhanuka-preview.html. Editor now has Dhanuka-only Character view selector: Original 3/4, Front, 3/4 turnaround, Side, Back. Side supports approved closed-mouth v6 and open-mouth v4. View and mouth selections are discrete per-keyframe properties and persist in projects; old projects default to original reference view.

Side Blink uses a new draft eye patch generated with built-in image_gen (prompt and provenance: library/dhanuka-side-blink-provenance.json). Only eye-region pixels from that generation are composited over approved mouth/body artwork. Front and back animations are not implemented; Blink button reports that only Original and Side are supported. Expression draft buttons switch back to original view to avoid applying incompatible face geometry. View changes are pose switches, not a smooth turn-around animation.

Sample project: library/dhanuka-side-blink.tnd.json. It can be opened in existing editor. Download link appears in preview. Blink uses existing motion clip track and pose blending, not an articulated rig; body and facial clips currently share the track.

Validation: core/blink tests (8) and view persistence/validation tests (2) passed. Isolated browser test loaded sample project, selected all four views, changed side mouth, exported a decodable 1280x720 WebM, and opened preview at fully closed eye time 0.50s. Last export size 61052 bytes. Screenshot dhanuka-side-preview.png inspected. Metadata duration/seek reliability and narration remain separately pending. Existing earlier export intermittency remains a known risk.

Original references and approved sheets were not overwritten. Front/side/back assets are rendered as native canvas crops and edge-background masks at load time. No generated replacement body is used for blinking.
