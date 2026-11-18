# Dhanuka Side Laugh draft

Preview: /dhanuka-preview.html → Side → Action: Laugh → Play.
Editor: select Dhanuka → Character view: Side → expression: Original → Movement: Laugh · draft. Motion length controls clip duration. Export and project save/load use the existing workflow.

Sample project: library/dhanuka-side-laugh.tnd.json. Face pose generated via built-in image_gen; exact prompt and provenance in library/dhanuka-laugh.json. New laugh face is not owner-approved. Blink was previously approved and is retained.

Action blends into laughing face, applies small whole-character bounce/tilt, then eases back to the selected starting mouth. Hair, ears and body artwork are sourced from approved turnaround, while only face-region artwork is composited. No independent shoulder or limb motion yet; face animation currently uses pose blending.

Validation: all 12 core/blink/view/action tests passed. Browser regression test loaded the saved Laugh sample, selected views/mouths, rendered a decodable 1280×720 WebM (60410 bytes), and displayed Laugh at 0.60s. Screenshot dhanuka-side-preview.png inspected. Narration and seek-duration metadata limitations remain as previously documented.
