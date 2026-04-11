# PPT Directory Working Agreement

## Scope

This file applies to work under `expr/ppt/`.

## Primary Rule

For each deck, the corresponding `*_ppt_script_*.md` file is the primary specification.

- `generate_*_ppt.js` must implement the markdown script, not reinterpret it freely.
- When the generated PPT and the markdown script disagree, fix the JS first.
- Do not simplify, omit, or replace teaching content just because it is easier to code.

## Source Of Truth

For a deck pair such as:

- `day1_ppt_script_morning.md`
- `generate_day1_morning_ppt.js`

the markdown file defines:

- page order
- page title
- required content
- whether a page uses images or not
- whether a page should be PPT-native shapes/text vs external image assets
- teaching emphasis and page intent

The JS file is an implementation artifact only.

## Implementation Constraints

1. Match the markdown page-by-page.
2. Preserve the intended teaching rhythm and emphasis of each page.
3. If the markdown says `无需图片`, the slide must not add decorative or preview images.
4. If the markdown says a page should use PPT-native layout, prefer shapes/text over image substitution.
5. Do not add extra agenda items, diagrams, summaries, or visual metaphors unless the markdown explicitly supports them.
6. Keep the visual theme consistent across the deck, but theme must not override content fidelity.
7. Reuse helpers in `ppt_common.js` when useful, but do not let helper convenience change slide semantics.

## Allowed Markdown Improvements

It is acceptable to strengthen a markdown script when needed, but only in this direction:

- add missing hard constraints
- clarify ambiguous layout requirements
- add explicit prohibitions such as `禁止插入图片`
- make acceptance criteria more testable

It is not acceptable to weaken the script merely to match an existing implementation.

## Acceptance Checklist

Before considering a PPT update complete, verify:

1. Slide count matches the markdown script.
2. Each slide title matches the intended page topic.
3. Pages marked as image-free remain image-free.
4. Pages marked as PPT-native are implemented primarily with PPT-native text/shapes.
5. No major visual element appears on a slide without support from the markdown script.
6. Generated `.pptx` builds successfully.
7. If PDF is produced, spot-check the first page and any changed pages for fidelity.

## Review Standard

Review should optimize for teaching quality and fidelity to the script, not implementation convenience.
