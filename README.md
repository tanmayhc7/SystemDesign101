# sysDesign101

An interactive introduction to system design. Explore how systems scale, stay available, and handle failures through browser-based demos, short explanations, and quizzes.

**[Open the course](https://tanmayhc7.github.io/SystemDesign101/)** · [Start Core Concepts](https://tanmayhc7.github.io/SystemDesign101/#/p/0) · [Check prerequisites](https://tanmayhc7.github.io/SystemDesign101/#/prereq)

## What you can learn today

**Core Concepts** is available now and contains nine lessons. It covers scalability, availability, reliability, single points of failure, latency and throughput, consistent hashing, the CAP theorem, failover, and fault tolerance. It also includes interview questions with answer outlines.

The course map shows 12 planned phases, from networking and APIs through distributed systems and interview problems. The [resource library](https://tanmayhc7.github.io/SystemDesign101/#/library) is already available and collects books, courses, engineering articles, and papers.

Your quiz progress is saved in your browser. You can export or import it from the [Progress page](https://tanmayhc7.github.io/SystemDesign101/#/about).

## Run locally

Start a local server with Python 3 from the repository root.

```sh
python3 -m http.server --bind 127.0.0.1 8000
```

Open [localhost:8000](http://127.0.0.1:8000/). The repository includes the generated page, so you can preview it immediately. Run the build again after editing the sources.

```sh
python3 build.py
```

## Project structure

| Path | Purpose |
| --- | --- |
| [`src/`](src/) | Course data, demos, routing, quizzes, and styles |
| [`build.py`](build.py) | Combines the sources and topic data into the static site |
| [`index.html`](index.html) | Generated page served by GitHub Pages |
| [`repo.json`](repo.json) and [`parse_repo.py`](parse_repo.py) | Topic catalog and the script that generates it |

To add a lesson, register its demo in [`src/demos0.js`](src/demos0.js) and use `lesson(phaseIndex, definition)` in the course data. Match the lesson’s `key` to the upstream topic title so the app can find its source link and any linked video. Use `ctx.every` for recurring demo timers so they stop when the learner leaves the page. Rebuild `index.html` after editing the sources.

## Credits and license

sysDesign101 is an independent companion to [Awesome System Design Resources](https://github.com/ashishps1/awesome-system-design-resources). Demo numbers are illustrative. This repository includes the [GNU GPL v3 license](LICENSE).
