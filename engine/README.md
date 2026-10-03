# engine/

Reusable building blocks on top of Remotion (components, scenes, transitions, caption renderers, themes).
Code here may import `remotion` and `@remotion/*`, never `kernel/` or a specific video.

Promotion rule: a component starts life inside `videos/<id>/components/`. When a **second** video needs it,
move it here and import it from both. One user = keep it local; don't abstract ahead of need.
