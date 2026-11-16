import asyncio, json, sys
from playwright.async_api import async_playwright
BASE="http://localhost:3000"
START=["/","/carte","/commander","/connexion","/admin/connexion","/commander/emporter","/commander/table?t=7","/mot-de-passe","/admin/mot-de-passe","/compte","/facture/00000000-0000-0000-0000-000000000000","/payer/00000000-0000-0000-0000-000000000000","/page-inexistante"]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(channel="chrome", args=["--no-sandbox"])
        seen={}; links=set()
        for w,h,tag in [(390,844,"m"),(1280,800,"d")]:
            ctx=await b.new_context(viewport={"width":w,"height":h}, locale="fr-FR")
            for path in START:
                pg=await ctx.new_page(); errs=[]
                pg.on("console", lambda m, e=errs: e.append(m.text) if m.type=="error" else None)
                pg.on("pageerror", lambda x, e=errs: e.append("PAGEERR "+str(x)))
                r=await pg.goto(BASE+path, wait_until="networkidle")
                over=await pg.evaluate("document.documentElement.scrollWidth > window.innerWidth+1")
                for a in await pg.eval_on_selector_all("a[href]","els=>els.map(e=>e.getAttribute('href'))"):
                    if a.startswith("/") and not a.startswith("//"): links.add(a.split("#")[0] or "/")
                name=path.strip("/").replace("/","_").replace("?","_") or "home"
                await pg.screenshot(path=f"shots/{tag}_{name}.png", full_page=True)
                print(tag, path, "->", r.status, pg.url.replace(BASE,""), "| overflow-x" if over else "", "| errors:", errs[:3] if errs else "")
                await pg.close()
            await ctx.close()
        print("LINKS", sorted(links))
        ctx=await b.new_context()
        for l in sorted(links):
            r=await ctx.request.get(BASE+l, max_redirects=0)
            if r.status>=400: print("BROKEN", l, r.status)
        await b.close()
asyncio.run(main())
