# Dhanuka initial facial action set

Review: http://127.0.0.1:47831/dhanuka-preview.html. Choose Front, 3/4 or Side; select Blink, Smile, Laugh, Angry, Look left or Look right; press Play. Open/Closed mouth is available on these views. Back is static and has no facial actions.

Editor supports the same presets through Movement. Choose Dhanuka, a supported view and Original expression first. Presets are saved in project clips. All-actions sample: library/dhanuka-all-actions.tnd.json (38 seconds, six actions sequentially per view, then Back). Download is linked on preview page.

New expressions remain drafts requiring owner likeness review. Generative AI was used to prepare pose artwork, not to generate the video each time. Runtime combines approved original body/hair/ear art with limited face/eye/mouth patches, uses pose blending, and returns to the selected base at the end. Look directions refer to image left/right. No head turning or independent limb rig is implied. Facial actions currently share the existing motion clip lane; simultaneous layering of separate actions remains pending.

Exact built-in image_gen prompts/assets: library/dhanuka-action-set.json. Earlier approved sheets retained. Thilini/Nurashi have not yet received these view-specific actions.

Validation: 13 model/action tests passed. Isolated browser verified 42 pose variants across three views, previewed all six presets per view, tested existing editor regression flow and recorded a decodable 1280x720 WebM. Screenshot inspected. Export now gives encoder 250ms to flush final frames before stopping; an earlier intermittent empty-export failure motivated this change. One successful run does not establish all-hardware reliability. Duration metadata/seeking, narration, custom action editing, articulated walk/run assets and extra outfits remain future work.
