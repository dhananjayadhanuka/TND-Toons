# Belly Laugh Front rig draft

2026-11-17 correction: owner reported unbalanced arm heights/paths. Both shoulders, hand paths, belly contact targets and IK elbow bends now mirror around source X=260. Hands meet at the same Y=562 with equal timing; removed earlier staggered reach and stacked contact. Right palm artwork is mirrored. A 101-position symmetry regression test passed, along with five related tests. Browser preview checked at 0, 1.2 and 3 seconds. Full regression run hit the known intermittent empty-video issue before reaching preview, so preview-only verification was added; do not claim export reliability was fixed by this arm change.

User prioritizes natural movement over speed and wants distinct laugh variants. Implemented the first belly-laugh rig study, not all laugh variants. Review at /belly-preview.html. Preview scrubs a 6-second reach/contact/laugh/return sequence. Main editor: Dhanuka → Front → Original expression → Belly laugh · draft. Sample project is library/dhanuka-belly-laugh.tnd.json.

New arm subsystem uses two-bone inverse kinematics with fixed 70/65 segment lengths, stable elbow bend directions, eased hand paths, slight hand timing asymmetry, hands settling on belly before laughter, delayed release, and planted feet. Arms are code-native 2D vector limbs/mitten hands. This is an initial stylized rig; hand drawing, shoulder joins, depth, and action timing may need owner-led refinement. It is not a claim of final human-natural motion.

Head/hair/ears/legs remain sourced from approved Front sheet. Only torso arm-removal patch was AI-created; face uses existing Front laugh. Runtime upper-body bend/compression affects the assembled torso/head/arms together while the lower quarter stays fixed. Original simpler Laugh and other presets remain unchanged.

Generated pose study and torso preparation prompts are in library/belly-laugh-draft.json; images are under assets/actions/belly-laugh/. Source sheets and approved assets retained. Shared deterministic sprite extraction moved to sprites.mjs with trimOffset metadata so limb coordinates align with raster layers.

Tests: 18 core/action/arm/timing tests passed. Browser regression passed old presets/view assets; rig preview inspected at 0, 1.2 and 3 seconds. Saved Belly action import and actual editor export were tested separately. Preview is a draft requiring review before expanding to other views/characters. Rolling, kneeling and foot-stamping laugh actions remain unimplemented.
