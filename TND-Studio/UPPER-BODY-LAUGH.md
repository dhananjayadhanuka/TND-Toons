# Upper-body-only Laugh correction

User approved other actions but rejected whole-character shaking during Laugh. Removed all Laugh root translation and rotation. Preview and editor/export now share upper-body.mjs: a small continuous horizontal bend above the waist, smoothly reduced to zero at the waist. Lower section is drawn at its original coordinates. No new generated artwork or changes to other action presets.

This is a lightweight sprite deformation, not separate articulated shoulder or arm bones. Strength is 0.35% of rendered character height; no vertical bouncing. Action timing envelope fades the deformation in/out. Approved expression artwork remains the same.

Validation: 15 tests passed, including fixed waist/leg/foot offsets and smooth waist boundary. Isolated browser regression passed 42 pose variants and six actions across three views, project loading, preview and 1280×720 video recording. Preview screenshot visually inspected. Main review link remains /dhanuka-preview.html; refresh with Ctrl+F5.
