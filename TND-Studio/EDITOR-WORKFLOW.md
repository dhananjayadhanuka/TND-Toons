# TNDToons editor — ස්ථාවර වැඩපිළිවෙළ

2026-11-17: Owner wants features added to existing categories; do not keep redesigning or moving the interface with each feature.

## එකම screen එකේ ප්‍රධාන තැන්

- වම: Characters / story duration / canvas format.
- මැද: Stage, Move / Edit pose, preview zoom.
- දකුණ: තෝරපු character එකේ Pose / Face / Actions / Move.
- පහළ: එකම story timeline; එක් character එකට වෙනම track.
- උඩ: Open / Save project / Export.

## Dhanuka views සඳහා එකම ක්‍රමය

1. Dhanuka තෝරන්න.
2. Pose → Character view: Front / ¾ / Side / Back තෝරන්න.
3. Edit pose → කොළ අත්, නිල් පාද, තැඹිලි හිස, දම් ඇඟ.
4. Face → හැඟීම තෝරලා controls වලින් සකස් කරන්න. Back view එකේ මුහුණ නොපෙනෙන නිසා ඒ controls අක්‍රියයි.
5. Actions → Walk වර්ගයක් හෝ වෙනත් action එකක් තෝරන්න.
6. Timeline එකෙන් වෙලාව තෝරලා pose keyframes හදන්න; Save project කරලා නැවත edit කරන්න.

View එකක් තෝරලා action එකක් දානකොට Front එකට නැවත මාරු නොවිය යුතුයි. Original reference artwork option remains a static historical reference; editing it selects the approved ¾ turnaround rig. View changes are discrete poses, not smooth 3D turns.

## Preview සහ cartoon scene එක වෙනස් වැඩ දෙකක්

දැනට owner ඉල්ලූ Walk-only preview ක්‍රමය: තෝරපු Dhanuka track එකේ පරණ poses/actions වෙනුවට මුළු timeline එකට Walk දාලා ඉබේ loop වෙනවා. Undo එකෙන් කලින් track එක ගන්න පුළුවන්. අනෙක් charactersගේ tracks වෙනස් කරන්නේ නැහැ.

අනෙක් motion clips තෝරපු timeline වෙලාවට එකතු වෙනවා. Pose / Face වෙනස්කම්ද ඒ වෙලාවේ keyframe එකට සුරැකෙනවා.

ඊළඟ cartoon scene-building පියවරේදී එකම Actions ප්‍රදේශයට පැහැදිලි Preview / Add to scene හැසිරීමක් සම්බන්ධ කළ යුතුයි: preview එකෙන් පරණ story work මැකිය නොයුතුයි; Add to scene එක තෝරපු වෙලාවට action එකක් පමණක් දාන්න ඕන. මේ සැලැස්ම සඳහා වෙනම අලුත් editor layout එකක් අවශ්‍ය නැහැ. මේ mode separation තවම implement කරලා නැහැ.

## වර්තමාන සීමා

Dhanuka views හතරට articulated rig drafts ඇත. Thilini/Nurashi තවම එම rig පහසුකම් ලබා නැත. Front එකට පෙර owner-approved controls රැකගත යුතුයි; අනෙක් viewsවල සන්ධි/පෙනුම owner review මගින් තව refine කරන්න. Back view එකට බොරුවට ඇස්/කට නොදමන්න.

Edit pose ඔබද්දී track එකේ Walk වගේ action එකක් තිබුණත් ඒ clip එක මැකෙන්නේ නැහැ. Edit කරන අතර procedural preview එක පමණක් නවතිනවා. Play ඔබද්දී action එක නැවත ධාවනය වෙනවා; export එකටද action එක ඇතුළත් වෙනවා.

## Manual animation — current primary workflow

Owner now wants manual pose authoring first. Manual animation button in timeline enables per-frame editing and mutes automatic clips without deleting them. Frame 1 is time zero. Copy/Paste pose and Copy → next avoid redrawing. Frame by frame holds poses; Smooth interpolates between authored poses. Current project duration is still the animation range. Only selected character track is shown in Manual, but other actors/data are preserved. Manual mode is currently available for Dhanuka's rig views.

Ctrl + mouse wheel over workspace zooms only the stage. Focus selected / F / double-click fits a character. Fit resets camera. Middle mouse or Shift-drag pans preview. These are camera/view changes, not changes to actor size/position or video export.

## Draw

Stage එක උඩ Draw හෝ දකුණේ Draw tab එකෙන් Pen / Line / Circle-oval / Box තෝරා stage එකේ ඇදලා අඳින්න. Shift තද කළොත් circle/square එකේ දිගපළල සමාන වෙනවා. Select එකෙන් ගෙනියන්න; selected drawing එකේ පාට, fill, width, layer වෙනස් කරන්න; Delete selected drawing හෝ Delete key එකෙන් මකන්න. Undo සහ Save project සාමාන්‍ය විදිහටම වැඩ කරනවා. Scene drawing ලෙස අඳින දේ static. Animate your drawing තුළ part එකකට අඳින strokes එහි position / rotation / scale keyframes අනුගමනය කරනවා. Existing character artwork වෙනස් කරන්නේ නැහැ. Video export එකට ඇතුළත් වෙනවා.

Choose Long video / Shorts before composing. Maximize above the stage enlarges the editing workspace; Restore or Esc returns. Fit shows the whole output frame; Ctrl+wheel zooms only the editing preview. Full HD export dimensions stay independent of preview size. Changing format fits authored poses/drawings together; review the result and use Undo if needed.


## Paint studio and drawing animation (2026-11-18)

Draw opens a two-row tool ribbon: Pencil, Brush, Marker, Airbrush, Eraser, Fill drawing, Pick color, Line, Curve, Oval, Rectangle, Triangle, Diamond, Star, Text and Select. Colors, stroke sizes and selection settings remain in the inspector. The character manual bar is hidden only during drawing so the stage has more room.

Curve: drag endpoints, release, then drag the bend. To edit again, select that curve and choose Curve. Fill drawing colors a drawn object or closed outline; it is not a raster flood-fill across arbitrary overlapping strokes. Eraser masks earlier ink on the chosen front/back drawing layer and preserves characters/background. It is not a source-character eraser. Text is editable in Text settings. Select supports move, size, flip and duplicate. Focus / F, Maximize, Ctrl+wheel and Shift/middle pan make large drawing practical without lowering export resolution.

Animate your drawing switches the inspector to part controls; Drawing tools / colors returns. New part creates a container; rename it Animal or Head / Leg / Tail. Newly drawn strokes join the selected part. Static scene objects remain separate; select an existing object and use Add selected to attach it. For a whole animal, parent its separately drawn head/legs to the Animal part. Set pivot by clicking its turning joint, preferably before animating at Frame 1. Choose a later frame, Select and drag the whole part, or change Turn/Size. Pose changes create keys automatically; Save pose records an unchanged hold. The part's diamonds appear in the shared timeline and in its pose list; click to return. Play uses shared scene time. Default is smooth interpolation; Frame by frame holds poses. Delete pose requires at least one pose to remain. Delete part & ink removes that part and descendants; Undo restores them.

This is transform animation of separately drawn parts, not automatic skeleton generation, mesh bending, character recognition or invented walk cycles. Keep overlaps at joints while drawing parts. Group parent transforms apply during editing, preview and export. Old projects without groups still load. Save stores original ink plus groups and keys.

## Separate clips (2026-11-18)

Use New clip in the top bar or above the stage (also visible in Maximize). Choose a name, format and duration for the new empty clip. Save & continue stores the current editable project as a separate My clips entry and downloads its .tnd.json backup before resetting. Don't save · continue discards the current unsaved draft; existing saved clips remain. Cancel / Esc keeps the current work.

Save clip / Ctrl+S updates the same clip's saved entry; starting a new clip gives a new identity. My clips is available in both normal and maximized layouts. It lists saved clips for Open or Download. Opening a gallery clip uses the same save/discard/cancel decision. Reopening a saved entry and saving edits updates that entry. The gallery is local browser storage, so keep downloaded project files as backups. Export video remains separate from saving the editable clip.

Draft autosave still recovers the active clip after a reload. It does not count as an explicit separate clip save. Unsaved changes trigger the browser's native leave/reload/close warning. Browsers control that dialog and do not allow an asynchronous custom Save/Don't save/Cancel dialog while closing; choose Cancel/Stay, then Save clip. Sudden power loss cannot display a prompt, but the latest completed autosave is recovered. New clips reset the preview camera and previous video download link.

### Save As destination (2026-11-18)

Save clip / Save & continue now invoke the native Save As picker immediately from the click in supporting local Chrome/Edge browsers. Choose any accessible folder and file name. The editable .tnd.json write and close finish before a new clip starts. Cancelling the picker keeps the current clip and decision dialog open; a failed write aborts its writable stream and also keeps the current clip. The dialog clarifies that it saves the CURRENT clip; New clip name names the next blank clip. My clips archival remains unchanged. Browsers without the picker retain the download fallback.

Validation: isolated save-as-browser.mjs tests mocked File System Access picker options and serialized data, waits for write completion, Cancel, failed write/abort and standalone Save clip. No other requested editing tools were changed in this increment.

## 2026-11-18 — Selection, editable library and 2D control workflow

The fixed layout remains: Characters / Items library at left, stage center, Paint / Edit / Animate settings at right, shared timeline below. New clip, gallery reopen and file open now reset both Undo and Redo; a prior clip cannot return through Undo. Explicit clipboard contents can still be pasted across clips.

- Draw → Select / V: click one item, Ctrl-click to add/remove items, drag an empty region to select enclosed items, Ctrl+A selects unlocked visible drawing ink. Ctrl+C/X/V/D and Delete operate on the current selection. Group/Ungroup uses Ctrl+G / Ctrl+Shift+G. Ungroup bakes the current pose; Undo restores the original animated hierarchy.
- Eight resize handles allow independent width/height; Shift preserves proportions, Alt holds the center. Yellow handle rotates; Shift snaps rotation to 15 degrees. Arrow keys nudge ink by 1 output pixel, Shift+arrows by 10. Middle mouse pans. Focus and Fit remain camera-only controls.
- Draw → Edit: point editing converts primitives into editable outlines where required. N toggles points; Alt-click adds a point, Delete removes a selected point (keeping at least two). Purple node handles reshape ink. Opacity is in Paint; [ / ] adjust pencil/eraser width, Shift changes by 10, digit 1–9 sets 10–90% opacity, 0 sets 100%.
- Draw → Edit → Add bend / Add pin: click the chosen position on selected ink. Orange controls deform nearby vector points, blue fixed anchors reduce deformation around themselves. Use the influence-radius slider. Choose a later frame in the ribbon and drag an orange control to create an animated offset. This is a 2D weighted vector deformation, not an automatic anatomical skeleton or 3D model. Original ink remains intact; controls, animated offsets and fixed pins are saved in project files and editable library items.
- Existing characters have corner scale handles preserving proportions and a yellow rotation handle. Character → Custom control handles places purple links at user-chosen locations. Move/rotate/scale are available on all characters; limb/head/body links call Dhanuka's existing Edit body pose fields. These links do not replace the original controls or create a new raster mesh. The original head/body/limb rig is preserved. Extreme enlargement still has the resolution limits of the original raster head art.
- Items library includes 27 editable vector examples in Body parts, Characters, Animals, Nature, Sky & sea and City. Click to insert an independent copy with named parts / parent joints. Original templates remain unchanged. Use Animate to select a part, set its joint pivot, parent it to the whole object and author position/rotation/scale poses. Edit individual ink in Select mode with the whole-part movement checkbox disabled when needed.
- Edit → Save selection to My items saves editable ink and its required hierarchy. Save pose/action stores an animated reusable copy under Poses & actions. Assets are local browser records separate from each clip. Search and categories filter the library. A reusable asset inserts as an independent instance, with regenerated object, group and deformation-control identities.
- Characters can now be duplicated as independent tracks (up to 50). Copy/Paste/Duplicate in Character mode copies the selected character or Ctrl+A character selection. The three source character designs are unchanged.
- Ctrl+S / Ctrl+Shift+S Save As, Ctrl+O Open, Ctrl+Alt+N New clip, Ctrl+E Export. The ? Shortcuts button lists supported keyboard controls. Number/arrow/drawing-tool shortcuts do not capture typing inside form fields.
- Export video retains Full HD output and its download action now opens Save As in supporting Chrome/Edge browsers. Cancel retains the rendered video. 3D models and 360-degree head/body turning remain deferred.

Validation: 60 unit tests; advanced-editor-browser.mjs verifies clipboard/cut/history/grouping, animated vector controls, selection opacity, custom library save, clean New clip history, editable animal insertion and independent duplication. editor-transforms-browser.mjs verifies character scale with unchanged arm/leg pose, a custom left-hand link with unchanged right hand, proportional and centered resize. All-view editor regression verifies front/threeQuarter/side/back native controls, actions and edit-with-walk. Drawing animation exports at 1920x1080 and the Save As video writer is tested with mocked native file handles (86377-byte WebM).

### 2026-11-18 — Side walk direction and size preservation

Side and ¾ walking now use separate swing and stance phases: raised feet swing from rear to front; planted feet move rearward relative to the body, with a flat stance ankle height. Each arm counter-swings against its own leg. The original editable limb rig and front gait coordinates are unchanged.

Character → Actions → Walk now includes Walk forward for Side / ¾. It translates in the facing direction (Flip reverses travel) with constant authored size. Root speed matches stance stride in both Long and Short output aspects. The endpoint is held after an ended forward clip. In place keeps its fixed position. The shared Loop option restarts the whole clip and therefore returns to its starting location; an actor may leave the output frame if its start position, size or clip length require it.

Per the owner's follow-up, Far / Near no longer scale the character automatically either: they preserve size and use their positional paths. Applying any walk uses the current sampled placement and scale rather than an older first key. Resizing an automatic walk scales its authored keys together without deleting/muting clips or creating an unintended scale animation. Forward placement is compensated so the character does not jump at the resize frame. Size sliders resume playback on release if playback was running before the edit. Manual animation retains per-frame scale authoring.

Validation: 63 unit tests pass. Side tests verify forward airborne swing, backward stance, ipsilateral arm counter-swing, flat IK stance and planted world-foot position for both aspects / Flip. side-forward-walk-browser.mjs visually inspected a six-pose strip, verifies saved UI selection and exports 1920x1080 video with 197px forward travel over two seconds (243067 bytes). walk-resize-browser.mjs verifies all four options preserve selected size, clips survive resize, playback resumes, and current forward position is preserved.

### 2026-11-18 — Continuous walking duration and speed

The walk panel now exposes Walk seconds, Speed (0.25x–3x) and Walk to clip end. Increasing Walk seconds beyond the scene end also extends the clip duration. Changing the story duration extends full-range looping walkers to the new end, including other full-range walking actors; deliberately shorter walks and manual animation keys stay untouched. Walk to clip end fills the current range and starts playback. Speed changes gait period and physical forward displacement together without changing authored character scale. Forward timeline clips are labelled Walk forward.

Playback still has a finite clip end (up to 180 seconds). Loop repeats the clip from its initial position; it does not create an unlimited moving world. Use a left-side starting placement for right-facing travel, or Flip for leftward travel. Characters can leave the frame when the selected walking distance exceeds the stage.

Validation: 65 unit tests pass. continuous-walk-browser.mjs confirms changing a 7-second clip to 20 seconds extends its walk, Walk seconds 30 extends the scene, 2x speed persists without altering scale, the actor continues moving after 7 seconds, and Walk to clip end starts playback.

### 2026-11-18 — Rain library effect

Items library → Weather → Rain / වැස්ස adds a full-scene animated rain effect without changing the background image, trees, other drawings or characters. Play animates it. Scene → Rain controls amount, falling speed, wind, opacity and background/foreground placement; Remove rain supports Undo. Adding Rain again reopens/resets the single scene effect rather than stacking duplicate simulations. The effect is stored with the editable clip and rendered in video exports, including rain-only scenes. Fresh clips have no weather.

weather.mjs generates deterministic timeline-based streaks, so scrubbing and exported frames are consistent. No external assets or services are required. Validation: 67 passing unit tests; browser checks library insertion, controls, scene preservation, saved settings, animation, remove/Undo and rain-only 1920x1080 export (30829 changing pixels, 16002-byte video).

### 2026-11-18 — Dhanuka appearance colors without animation edits

Character → Dhanuka · Colors / පාට provides Skin/body and Ink (hair + outlines) color pickers. These are per-actor appearance overrides; keys, clips, poses, size, timing and the original rig remain unchanged. Original colors removes the override and restores source rendering. Ink intentionally colors hair and the line art together, including facial linework; it is not a separate hair mask. No body-shape remodeling or 3D changes were introduced.

character-appearance.mjs recolors only a transparent render layer for that actor, with warm skin / dark ink classifiers and preserved alpha/shading. White eye/teeth pixels are excluded. Backgrounds, weather, other characters and source assets are not recolored. Pose control markers are protected. The override is serialized with the actor and appears in video export. Raster source resolution limits still apply when enlarging.

Validation: pixel/alpha and save-data unit tests; isolated character-appearance browser confirms changed render and saved colors, byte-identical keys/clips, animated playback, colored 1920x1080 video and reset to original colors. The blue/brown example was visually inspected. Export verification seeks into a decoded animation frame before sampling pixels.

### 2026-11-18 — Generated blue-sky/green-hills background

Generated an original raster background using the built-in image_gen tool and the user's sky/hills image as visual reference. Final asset: assets/backgrounds/blue-sky-green-hills-v1.png; full generation prompt and tool provenance are in the sibling .prompt.txt file. The supplied reference image was not overwritten.

Available in Items library → Backgrounds → Blue sky & green hills and Scene → backgrounds. Choosing it embeds the PNG as the existing custom-background data URL so saved clips remain portable, marks the library card selected, and leaves characters/actions/drawings unchanged. Undo/Redo work. Existing custom-background contain behavior preserves the full image in other aspect ratios.

Validation: isolated background-library browser confirms both entry points, selected card, portable PNG save/validation, unchanged scene subjects, rendered sky pixels and Undo/Redo.
