import json, re, urllib.request, asyncio
BASE="http://localhost:3000"
MAIL="http://127.0.0.1:1080"
ADMIN_PW=open('tests/.local/admin_pw').read().strip()
def mails():
    return json.load(urllib.request.urlopen(MAIL+"/email"))
def clear_mails():
    urllib.request.urlopen(urllib.request.Request(MAIL+"/email/all",method="DELETE"))
def last_mail(to, subject_part=""):
    for m in reversed(mails()):
        if any(t["address"]==to for t in m["to"]) and subject_part.lower() in m["subject"].lower(): return m
def link_in(m, pattern):
    for l in re.findall(r'href="([^"]+)"', m["html"]):
        l=l.replace("&amp;","&")
        if pattern in l: return l
class Log:
    def __init__(s): s.items=[]
    def ok(s,msg): s.items.append(("OK",msg)); print("  OK ",msg)
    def bad(s,msg): s.items.append(("BUG",msg)); print("  BUG",msg)
    def check(s,cond,msg): (s.ok if cond else s.bad)(msg); return cond
async def new_page(ctx, errs):
    pg=await ctx.new_page()
    pg.on("console", lambda m: errs.append(f"{pg.url} :: {m.text}") if m.type=="error" and "Failed to load resource" not in m.text else None)
    pg.on("pageerror", lambda x: errs.append(f"PAGEERR {pg.url} :: {x}"))
    return pg
