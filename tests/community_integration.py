"""Local preview only. Exercises anonymous confirmations and admin screening."""
import json,urllib.request,urllib.error,http.cookiejar,uuid
BASE='http://127.0.0.1:5173'
def client():return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
owner=client();visitor=client()
def req(path,data=None,method=None,who=visitor,ip='192.0.2.1',origin=BASE):
 r=urllib.request.Request(BASE+path,data=None if data is None else json.dumps(data).encode(),method=method,headers={'Content-Type':'application/json','Origin':origin,'cf-connecting-ip':ip,**({'Cookie':who.vote_cookie} if hasattr(who,'vote_cookie') else {})})
 try:
  with who.open(r) as res:
   if res.headers.get("Set-Cookie","").startswith("heady_voter="):who.vote_cookie=res.headers["Set-Cookie"].split(";",1)[0]
   return res.status,json.loads(res.read())
 except urllib.error.HTTPError as e:
  raw=e.read().decode()
  try:body=json.loads(raw)
  except ValueError:body={"error":raw}
  return e.code,body
owner.open(BASE+'/signin-with-chatgpt?return_to=/admin').read()
name='Community QA '+str(uuid.uuid4())
assert req('/api/sightings',{'song':name})[0]==201
row=next(r for r in req('/api/admin/entries',who=owner)[1] if r['song']==name);id=row['id']
assert all(r['id']!=id for r in req('/api/community')[1])
assert req('/api/community',{'id':id})[0]==404
payload={'id':id,'version':row['version'],'visible':True}
assert req('/api/admin/community',payload,'PATCH')[0]==403
assert req('/api/admin/community',payload,'PATCH',owner)[0]==200
public=next(r for r in req('/api/community')[1] if r['id']==id)
assert not public['corroborated'] and 'submission_key' not in public and 'count' not in public
assert req('/api/community',{'id':id},origin='https://evil.example')[0]==403
for n in range(1,6):
 c=client();code,data=req('/api/community',{'id':id},who=c,ip='192.0.2.'+str(n));assert code==200,(code,data)
 assert data['corroborated']==(n==5)
 # Same browser on another IP, then fresh browser on same IP: neither advances threshold.
 assert req('/api/community',{'id':id},who=c,ip='198.51.100.'+str(n))[1]['corroborated']==(n==5)
 assert req('/api/community',{'id':id},who=client(),ip='192.0.2.'+str(n))[1]['corroborated']==(n==5)
assert req('/api/community',{'id':id},who=client(),ip='203.0.113.10')[1]=={'corroborated':True,'confirmed':False}
assert all(r['id']!=id for r in req('/api/sightings')[1]),'Votes must not publish'
# Editing invalidates visibility and starts a new revision.
row=next(r for r in req('/api/admin/entries',who=owner)[1] if r['id']==id)
assert row['communityCorroborated']
row.update(notes='Edited local QA')
assert req('/api/admin/entries',row,'PATCH',owner)[0]==200
assert all(r['id']!=id for r in req('/api/community')[1])
row=next(r for r in req('/api/admin/entries',who=owner)[1] if r['id']==id)
assert not row['communityCorroborated']
assert req('/api/admin/community',{'id':id,'version':row['version'],'visible':True},'PATCH',owner)[0]==200
assert not next(r for r in req('/api/community')[1] if r['id']==id)['corroborated']
assert req('/api/admin/community',{'id':id,'version':row['version'],'visible':False},'PATCH',owner)[0]==200
print('PASS: screened visibility; anonymous voting; repeat browser/network denial; five-vote cap; hidden counts; no auto-publication; edit reset; admin access; cross-origin denial')
