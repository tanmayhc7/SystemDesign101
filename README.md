# sysDesign101

An interactive introduction to system design. Explore how systems scale, stay available, and handle failures through browser-based demos, short explanations, and quizzes.

**[Open the course](https://tanmayhc7.github.io/SystemDesign101/)** · [Start Core Concepts](https://tanmayhc7.github.io/SystemDesign101/#/p/0) · [Check prerequisites](https://tanmayhc7.github.io/SystemDesign101/#/prereq)

## What you can learn today

**Core Concepts** (nine lessons) covers scalability, availability, reliability, single points of failure, latency and throughput, consistent hashing, the CAP theorem, failover, and fault tolerance.

**Networking Fundamentals** (eight lessons) covers the OSI model, IP addresses and CIDR, DNS, proxies and reverse proxies, HTTP and HTTPS, TCP and UDP, load balancing, and checksums. Each lesson has an interactive demo, an in-depth section, quiz questions, and senior-level interview questions.

**API Fundamentals** (eight lessons) covers APIs and HTTP methods, API gateways, REST vs GraphQL, WebSockets, webhooks, idempotency, rate limiting, and API design. The demos let you send a request twice and watch what happens, compare round trips with and without a gateway, count the cost of polling against WebSockets, replay a payment whose reply was lost, and run three rate limiting algorithms on the same traffic.

**Database Fundamentals** (nine lessons) covers database types, ACID transactions, SQL vs NoSQL, scaling, indexes, partitioning, sharding, replication, and Bloom filters. The demos let you crash a transfer mid-way, see lost updates, compare scan and index cost as a table grows, watch how many keys move when a shard is added, and lose acknowledged writes to asynchronous replication.

**Caching Fundamentals** (five lessons) covers caching basics, caching strategies, eviction policies, distributed caching, and CDNs. The demos let you size a cache against skewed traffic, lose a write-back buffer in a crash, replay one trace against FIFO, LRU and LFU, knock out a cache node and watch the database overload, and compare page latency from four regions with and without a CDN.

**Asynchronous Communication** (four lessons) covers pub/sub, message queues, message brokers, and change data capture, plus load leveling, competing consumers, dead letter queues, and the transactional outbox. The demos let you take a subscriber down with and without a topic, push a traffic spike through a queue and inject a poison message, compare a queue with a replayable log, see at-most-once versus at-least-once delivery, and crash between a database write and an event publish.

**Distributed Systems and Microservices** (eight lessons) covers heartbeats, service discovery, consensus, distributed locking, gossip, circuit breakers (with timeouts, retries, bulkheads and fallbacks), disaster recovery, and distributed tracing. The demos let you trade detection speed for false alarms, crash an instance behind a stale client cache, partition a Raft leader away from the majority, watch a paused lock holder corrupt a file without a fencing token, spread a rumour through a cluster, trigger a retry storm, pick a DR strategy from RPO and RTO targets, and read a trace waterfall.

Every built phase ends with a six-question end-of-line quiz, and its interview questions come at three levels: mid, senior, and Staff+.

The course map shows 6 more planned phases, from databases through distributed systems and interview problems. The [resource library](https://tanmayhc7.github.io/SystemDesign101/#/library) is already available and collects books, courses, engineering articles, and papers.

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

To add a lesson, register its demo in the matching `src/demosN.js` file and use `lesson(phaseIndex, definition)` in the course data. Match the lesson’s `key` to the upstream topic title so the app can find its source link and any linked video. Use `ctx.every` for recurring demo timers so they stop when the learner leaves the page. Rebuild `index.html` after editing the sources.

## Credits and license

sysDesign101 is an independent companion to [Awesome System Design Resources](https://github.com/ashishps1/awesome-system-design-resources). Demo numbers are illustrative. This repository includes the [GNU GPL v3 license](LICENSE).
