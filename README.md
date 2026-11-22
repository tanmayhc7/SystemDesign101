<div align="center">

# sysDesign101

**Learn system design by riding the route: 15 lines, 148 stations, one interactive demo at every stop.**

[![Open the course](https://img.shields.io/badge/Open_the_course-FFD43B?style=for-the-badge)](https://tanmayhc7.github.io/SystemDesign101/)
[![Start Core Concepts](https://img.shields.io/badge/Start_Core_Concepts-1747C7?style=for-the-badge)](https://tanmayhc7.github.io/SystemDesign101/#/p/0)
[![Interview problems](https://img.shields.io/badge/52_interview_problems-C2255C?style=for-the-badge)](https://tanmayhc7.github.io/SystemDesign101/#/p/10)

![148 lessons](https://img.shields.io/badge/lessons-148-0E1B2E?style=flat-square)
![No sign-up](https://img.shields.io/badge/account-not_needed-0B7A5E?style=flat-square)
![Static site](https://img.shields.io/badge/build-one_HTML_file-1864AB?style=flat-square)
![License GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-862E9C?style=flat-square)

<a href="https://tanmayhc7.github.io/SystemDesign101/"><img src="docs/route-map.png" alt="The sysDesign101 transit map: 15 coloured lines from Core Concepts to AI interview problems, with a station for each lesson" width="820"></a>

</div>

## The route

| | Line | Stations | Highlights |
|:-:|---|:-:|---|
| ![0](https://img.shields.io/badge/0-D9381E?style=flat-square) | [Core Concepts](https://tanmayhc7.github.io/SystemDesign101/#/p/0) | 9 | Scalability, availability, CAP, consistent hashing |
| ![1](https://img.shields.io/badge/1-B45309?style=flat-square) | [Networking](https://tanmayhc7.github.io/SystemDesign101/#/p/1) | 8 | DNS, HTTP/HTTPS, TCP vs UDP, load balancing |
| ![2](https://img.shields.io/badge/2-8A6A00?style=flat-square) | [APIs](https://tanmayhc7.github.io/SystemDesign101/#/p/2) | 8 | Gateways, REST vs GraphQL, idempotency, rate limiting |
| ![3](https://img.shields.io/badge/3-4D7C0F?style=flat-square) | [Databases](https://tanmayhc7.github.io/SystemDesign101/#/p/3) | 9 | ACID, indexes, sharding, replication, Bloom filters |
| ![4](https://img.shields.io/badge/4-0B7A5E?style=flat-square) | [Caching](https://tanmayhc7.github.io/SystemDesign101/#/p/4) | 5 | Strategies, eviction, distributed caches, CDNs |
| ![5](https://img.shields.io/badge/5-0B7285?style=flat-square) | [Async Messaging](https://tanmayhc7.github.io/SystemDesign101/#/p/5) | 4 | Pub/sub, queues, Kafka-style logs, CDC and the outbox |
| ![6](https://img.shields.io/badge/6-1864AB?style=flat-square) | [Distributed Systems](https://tanmayhc7.github.io/SystemDesign101/#/p/6) | 8 | Consensus, locking, gossip, circuit breakers, tracing |
| ![7](https://img.shields.io/badge/7-3B5BDB?style=flat-square) | [Architecture Patterns](https://tanmayhc7.github.io/SystemDesign101/#/p/7) | 5 | Microservices, serverless, sagas, CQRS, P2P |
| ![8](https://img.shields.io/badge/8-862E9C?style=flat-square) | [Tradeoffs](https://tanmayhc7.github.io/SystemDesign101/#/p/8) | 12 | Strong vs eventual, push vs pull, batch vs stream |
| ![9](https://img.shields.io/badge/9-C2255C?style=flat-square) | [Interview Framework](https://tanmayhc7.github.io/SystemDesign101/#/p/9) | 4 | Six-step answer, estimation calculator, zero to millions |
| ![10](https://img.shields.io/badge/10-E64980?style=flat-square) | [Problems: Easy](https://tanmayhc7.github.io/SystemDesign101/#/p/10) | 12 | URL shortener, KV store, authentication, UPI |
| ![11](https://img.shields.io/badge/11-A61E4D?style=flat-square) | [Problems: Medium](https://tanmayhc7.github.io/SystemDesign101/#/p/11) | 26 | WhatsApp, Instagram, rate limiter, payments, Kafka |
| ![12](https://img.shields.io/badge/12-7A1538?style=flat-square) | [Problems: Hard](https://tanmayhc7.github.io/SystemDesign101/#/p/12) | 14 | Uber, Google Docs, Zoom, S3, a stock exchange |
| ![13](https://img.shields.io/badge/13-0E7490?style=flat-square) | [AI System Design](https://tanmayhc7.github.io/SystemDesign101/#/p/13) | 10 | LLM inference, batching, RAG, vector search, agents, guardrails, evals |
| ![14](https://img.shields.io/badge/14-5F3DC4?style=flat-square) | [AI Interview Problems](https://tanmayhc7.github.io/SystemDesign101/#/p/14) | 14 | Enterprise RAG, support and code review agents, inference serving, voice |

## At every station

- **Play with it.** An interactive demo: crash a replica, trigger a retry storm, shard a table, or build an architecture by picking components.
- **Go deeper.** A short lesson, an in-depth section, key terms, and prerequisites.
- **Check yourself.** A two-question quiz, plus a six-question quiz at the end of each line.
- **Prepare for interviews.** Questions at Mid, Senior, and Staff+ levels, with what a strong answer covers and the usual pitfalls.

Every interview problem follows the same route: **clarify** with question cards, **estimate** with sliders, **build** the architecture, then **deep dive** into the hard parts.

Progress, XP, and streaks stay in your browser. Export or import them from the [Progress page](https://tanmayhc7.github.io/SystemDesign101/#/about).

## Run locally

```sh
python3 -m http.server --bind 127.0.0.1 8000   # open http://127.0.0.1:8000
python3 build.py                               # rebuild index.html after editing src/
```

<details>
<summary><b>Project structure and adding a lesson</b></summary>

| Path | Purpose |
| --- | --- |
| [`src/`](src/) | Lesson data, demos, routing, quizzes, and styles |
| [`build.py`](build.py) | Combines the sources and topic data into one static page |
| [`index.html`](index.html) | The generated page served by GitHub Pages |
| [`repo.json`](repo.json), [`parse_repo.py`](parse_repo.py) | Topic catalog and the script that generates it |

Register a demo in `src/demosN.js`, then call `lesson(phaseIndex, definition)` in the course data. Match the lesson `key` to the upstream topic title so its source link and video are found. Use `ctx.every` for recurring timers so they stop when the learner leaves. Rebuild `index.html` afterwards.

</details>

## Credits

An independent companion to [Awesome System Design Resources](https://github.com/ashishps1/awesome-system-design-resources). Demo numbers are illustrative. Licensed under the [GNU GPL v3](LICENSE).
