# Borrowed Field — an algorithmic philosophy

**Movement:** Borrowed Field
**Status:** generative layer for the ManHunt motion piece. Implemented deterministically in `src/map.js` (block map + dot grid, seed 20261101) and `src/field.js` (field motion, seed 1409); explorable in `algorithmic-art/borrowed-field.html`.

---

A pickup pitch is never a blank plane. It is a grid that was already there: blocks, kerbs, crossings, the lines somebody painted years ago. This movement begins from that observation. Instead of drawing a place, the algorithm declares a street grid and then lets blocks, edges and survey dots emerge from a seeded process — each seed producing a different neighbourhood, each neighbourhood obeying the same grammar. The point is not to depict a real street; the point is that the field feels *found*, not designed. The viewer should believe someone borrowed it, and that belief comes from the grammar being consistent while every seed is different.

The second layer is the dot grid. It is generated as a strict lattice with a sparse major rhythm, and it is never decorative: it is the coordinate system the whole film measures against. Chalk geometry is laid over it, and the geometry is always coarse — a touchline, two corner arcs, a halfway line, a centre circle. These are drawn by animating their own path length, so they are literally written over the map rather than composited on top of it. A field marking is a stroke, and a stroke is a duration; the animation treats geometry as time.

The third layer is motion: the traces of people on the field. A few hundred entities drift under layered sinusoidal fields, each with its own phase and persistence, drawn as short fading segments rather than points, because what you remember of a chase is the trail, not the position. They never form a pattern you can name, but they never become noise either; density, stroke length and opacity are calibrated so that at any freeze-frame the layer reads as *activity*, not texture. This is the part that must look painstakingly built — every parameter is a decision, and the difference between "living" and "busy" is a few percent of alpha.

Determinism is non-negotiable. The animation is a pure function of virtual time: the map generator is seeded, the field layer is analytic, and a frame requested at 7.42 seconds is byte-identical every time. Nothing accumulates, nothing depends on frame rate, nothing is random at render time. This is what makes the film re-renderable after a brand change: the system can be asked for the same thirteen pictures at any resolution, on any machine, and the result is the same picture. A generative system you cannot reproduce is a screenshot with extra steps.

The final system is deliberately small: a few hundred lines, no textures, no imported art, no external data. It exists to make one flat surface feel like a place with rules. When it works, the viewer does not notice the algorithm at all — they notice that the map looks like somewhere they have been, and that somebody has just run across it.

---

## Implementation map (for the next designer)

- `src/map.js` — seeded block/street/dot-grid generator. Change `seed` for a new neighbourhood; change the `cols`/`rows` arrays to change the street grammar.
- `src/field.js` — closed-form two-octave drift with optional weighted attractors (`converge`) so the traces can be pulled toward the Prey marker during the chase; `intensity` and `speed` are the two master dials.
- `algorithmic-art/borrowed-field.html` — interactive seed explorer (p5.js) with the same four-layer grammar, parameter sliders, seed navigation and PNG export, for exploring a new block map before committing a render.
