# Exploration record

These are the working sheets that produced the three directions. They are kept as design history, not
as deliverables — nothing here ships.

Method: every concept was drawn as a small parametric system and rendered at 300 / 96 / 48 / 24 / 16 px
in colour and in a single ink, then judged silhouette-first. Anything that failed at 48 px or in one ink
was cut regardless of how it looked at 512 px.

| Sheet | Round | What it tested | Survived |
|---|---|---|---|
| `round-1-broad-divergence.png` | 1 | eight strategy families: claw, comet, groundmass, tag, rotational blades, split arena, open zone, trail | open zone, groundmass |
| `round-2-second-families.png` | 2 | converging fangs, hide/peek, canyon, loop, swoosh, contact bracket, cradle | loop, swoosh (rejected later) |
| `round-3-purpose-built.png` | 3 | blade-sweep pursuit, block-with-bite, wall corner, rotational hooks | block rejected, hooks kept as a reference |
| `round-4-open-zone-variants.png` | 4 | the unclosed-ring family: gap 60–76°, dot inside / outside the break, rotations | **01 · Open Zone** |
| `round-5-corner-and-tag.png` | 5 | corner refinements (open vertex, tucked dot, rotations) and the tag-instant candidates | **02 · The Corner** candidates, **03 · The Tag** candidate |
| `round-6-final-geometry.png` | 6 | final geometry comparison for the corner and tag (stroke weight, dot size, gap, rotation) | the shipped parameters |

Rejected early, with reasons:

- **claw / comet / swoosh**: readable, but they read as motion graphics rather than a chase; also close to
  generic sport-swoosh territory.
- **groundmass / block-with-bite**: the ice-coloured mass read as a moon-and-dot; the cyan version read as
  an app icon inside an app icon.
- **converging fangs / split arena**: at 48 px the two fangs merged into a flower or propeller.
- **two kits (curved)**: looked like a feather, not two teams.

All geometry is original, generated from `tools/concepts.mjs` and rendered with headless Chrome; no
third-party or stock material was referenced at any point.
