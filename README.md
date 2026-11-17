# System Design From Scratch

An interactive course page, built as a single self-contained `index.html`, covering every topic in [awesome-system-design-resources](https://github.com/ashishps1/awesome-system-design-resources) (not affiliated).

**Live site: https://tanmayhc7.github.io/SystemDesign101/**

Status: Phase 0 (Core Concepts, 9 lessons) is built. Phases 1 to 12 and the Library are listed on the home page as planned.

## Files
- `index.html` is the whole page (built output). Open it in a browser. Fonts load from Google Fonts, nothing else is fetched except YouTube videos, which load only when you press play.
- `src/` has the sources: `engine.js` (router, views, quiz, generic demos), `demos0.js` (Phase 0 demos), `data0.js` (phases and lessons), `styles.css`.
- `repo.json` is the topic list parsed from the source README. `parse_repo.py` makes it, `build.py` assembles `index.html`.

## Adding a lesson
Register a demo with `DEMOS.myDemo=function(host,opts,ctx){...}`, then `lesson(phaseIndex,{key,short,tag,lead,demo,takeaway,pre,quiz,terms})`. `key` must match the topic title in the source README exactly, because the source link and (for problems) the YouTube video are looked up by it. Use `ctx.every` for timers so they stop when you leave the page.

Numbers inside demos are made up to teach an idea, not benchmarks.
