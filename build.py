import json,re
r=lambda p:open(p,encoding='utf-8').read()
repo=json.load(open('repo.json',encoding='utf-8'))
js=r('src/engine.js')+'\n'+r('src/demos0.js')+'\n'+r('src/data0.js')+'\n'
html=f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>System Design From Scratch</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100,800..900&family=Atkinson+Hyperlegible+Next:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap">
<style>{r('src/theme.css')}
{r('src/styles.css')}</style></head>
<body><main id="app"></main>
<script>
const REPO={json.dumps(repo,ensure_ascii=False)};
{r('src/engine.js')}
{r('src/demos0.js')}
{r('src/data0.js')}
{r('src/data0b.js')}
window.addEventListener('hashchange',route);route();
</script></body></html>'''
open('index.html','w',encoding='utf-8').write(html)
print(len(html))
