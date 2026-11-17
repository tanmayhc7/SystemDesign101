# Product

## Platform
web (static single-file HTML, plain JS, deployed to GitHub Pages)

## Users and jobs
- Primary user: a software engineer (about 6 years as an SDE) preparing for senior-and-above system design interviews, studying in evening sessions.
- Secondary: peers and recruiters who may open the public GitHub Pages site.
- Job: learn every topic in the open-source awesome-system-design-resources list through animation and interaction, check understanding with quizzes, then practise senior-level interview questions.

## Mechanism
Each topic is a lesson with a live, interactive demo (consistent hashing ring, CAP partition, failover timeline, etc.), an in-depth explanation, a two-question quiz, and senior interview questions. Progress, XP and streak are saved in the browser. Built in phases; Phase 0 (Core Concepts) is complete, other phases are planned and listed.

## Constraints to preserve
- Single self-contained index.html, no build framework. Existing demos, quizzes, routing and progress storage keep working.
- Not affiliated with the source repo; links back to it.
- Accessibility: keyboard operable, visible focus, reduced-motion respected, light and dark themes.
- Videos are embedded only from IDs in the source repo, plus clearly labelled search-found suggestions.

## Voice
Plain, direct, no hype. Names the real mechanism and its trade-off.

## Open decisions
- Stack confirmed as plain static HTML/CSS/JS (existing).
- Visual world is being replaced (user asked for a new color scheme and a fancier look). The user wants it not childish or over-gamified, readable for long lessons, with decoration that never competes with the diagrams, and not a generic dark dashboard.
