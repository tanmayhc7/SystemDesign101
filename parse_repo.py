import re, json, sys
txt = open('/home/claude/src/sd/README.md', encoding='utf-8').read()
sections = []
cur = None; sub = None
for line in txt.splitlines():
    m = re.match(r'^## (.+)$', line)
    if m:
        name = re.sub(r'^[^\w\[]+', '', m.group(1)).strip()
        link = re.match(r'\[(.+)\]\((.+)\)', name)
        cur = {'name': name, 'items': [], 'groups': {}}
        if link:
            cur['name'] = link.group(1); cur['url'] = link.group(2)
        sections.append(cur); sub = None; continue
    m = re.match(r'^### (.+)$', line)
    if m: sub = m.group(1).strip(); cur['groups'][sub] = []; continue
    m = re.match(r'^- \[(.+?)\]\((.+?)\)', line)
    if m and cur:
        item = {'t': m.group(1), 'u': m.group(2)}
        (cur['groups'][sub] if sub else cur['items']).append(item)
json.dump(sections, open('repo.json', 'w'), indent=1, ensure_ascii=False)
for s in sections:
    n = len(s['items']) + sum(len(v) for v in s['groups'].values())
    print(n, s['name'])
