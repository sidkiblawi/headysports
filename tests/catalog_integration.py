"""Run against local preview only: python3 tests/catalog_integration.py.
Creates one disposable local appearance and leaves it rejected, with backups retained.
"""
import http.cookiejar,json,urllib.request,urllib.error,uuid
BASE='http://127.0.0.1:5173'
owner=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
anon=urllib.request.build_opener()
def req(path,data=None,method=None,client=anon,origin=BASE):
 request=urllib.request.Request(BASE+path,data=json.dumps(data).encode() if data is not None else None,headers={'Content-Type':'application/json','Origin':origin},method=method)
 try:
  with client.open(request,timeout=40) as r:return r.status,r.read().decode()
 except urllib.error.HTTPError as e:return e.code,e.read().decode()
def get(path,client=anon):
 code,body=req(path,client=client);assert code==200,(path,code,body[:200]);return json.loads(body)
for path in ['/api/admin/entries','/api/admin/export','/api/admin/backups']:
 assert req(path)[0]==403,path
assert req('/api/admin/entries',{},'POST')[0]==403
owner.open(BASE+'/signin-with-chatgpt?return_to=/admin',timeout=40).read()
code,body=req('/api/admin/initialize',{},'POST',owner);assert code==200,(code,body)
initial=get('/api/sightings');assert len(initial)>=19
assert all(r['songSlug'] and r['eventSlug'] and r['sources'] for r in initial)
code,body=req('/api/admin/initialize',{},'POST',owner);assert code==200
assert len(get('/api/sightings'))==len(initial),'Non-idempotent seed'
first=initial[0]
for path in ['/', '/songs','/games','/songs/'+first['songSlug'],'/games/'+first['eventSlug'],'/sightings/'+str(first['id']),'/sitemap.xml','/robots.txt']:
 code,body=req(path);assert code==200,(path,code,body[:300])
assert req('/songs/not-a-real-song')[0]==404
assert req('/games/not-a-real-game')[0]==404
suffix=str(uuid.uuid4())[:8]
payload=dict(song='QA catalog '+suffix,artist='QA Test Artist',game='Local QA event',sport='NFL',network='FOX',date='2020-02',notes='Disposable catalog integration test',evidence='reporting',cueType='Commercial outro',moderationStatus='pending',sources=[dict(label='Published report',url='https://example.com/report',kind='reporting')])
invalid=dict(payload,evidence='clip');assert req('/api/admin/entries',invalid,'POST',owner)[0]==400
invalid=dict(payload,date='2020-02-31');assert req('/api/admin/entries',invalid,'POST',owner)[0]==400
invalid=dict(payload,sources=[dict(label='Bad link',url='javascript:alert(1)',kind='reporting')]);assert req('/api/admin/entries',invalid,'POST',owner)[0]==400
code,body=req('/api/admin/entries',payload,'POST',owner);assert code==201,(code,body)
allrows=get('/api/admin/entries',owner);entry=next(r for r in allrows if r['song']==payload['song'])
assert not any(r['id']==entry['id'] for r in get('/api/sightings'))
assert req('/sightings/'+str(entry['id']))[0]==404
assert req('/songs/'+entry['songSlug'])[0]==404
assert req('/games/'+entry['eventSlug'])[0]==404
edit=dict(entry,moderationStatus='approved',notes='First owner correction')
code,body=req('/api/admin/entries',edit,'PATCH',owner);assert code==200,(code,body)
assert any(r['id']==entry['id'] for r in get('/api/sightings'))
assert req('/sightings/'+str(entry['id']))[0]==200
assert req('/api/admin/entries',edit,'PATCH',owner)[0]==409,'Stale edits accepted'
export=get('/api/admin/export',owner);assert export['format']=='headysports-archive'
old=next(r for r in export['entries'] if r['id']==entry['id'])
assert old['notes']=='First owner correction'
code,body=req('/api/admin/entries',dict(old,notes='Second correction'),'PATCH',owner);assert code==200,(code,body)
one=dict(export,entries=[old])
code,body=req('/api/admin/import',dict(mode='preview',backup=one),'POST',owner);assert code==200,(code,body);assert json.loads(body)['updated']==1
assert req('/api/admin/import',dict(mode='restore',backup=one),'POST',owner)[0]==400
code,body=req('/api/admin/import',dict(mode='restore',backup=one,confirm=True),'POST',owner);assert code==200,(code,body)
restored=next(r for r in get('/api/admin/entries',owner) if r['id']==entry['id']);assert restored['notes']=='First owner correction'
assert len(get('/api/sightings'))==len(initial)+1,'Restore changed unrelated entries'
code,body=req('/api/admin/export?format=csv',client=owner);assert code==200 and 'sources' in body
cloud=get('/api/admin/backups',owner);assert cloud['items']
backup=get('/api/admin/backups?key='+urllib.parse.quote(cloud['items'][0]['key']),owner);assert backup['format']=='headysports-archive'
code,body=req('/api/admin/entries',dict(restored,moderationStatus='rejected'),'PATCH',owner);assert code==200,(code,body)
assert len(get('/api/sightings'))==len(initial)
# Anonymous submissions never trust caller-supplied publication or evidence.
submission=dict(payload,song='Public '+suffix,source='https://example.com/fan',moderationStatus='approved',evidence='clip')
code,body=req('/api/sightings',submission,'POST');assert code==201,(code,body)
pending=next(r for r in get('/api/admin/entries',owner) if r['song']==submission['song']);assert pending['moderationStatus']=='pending' and pending['evidence']=='fan'
assert not any(r['id']==pending['id'] for r in get('/api/sightings'))
assert req('/api/admin/export')[0]==403
print('PASS: seed idempotency; all public pages; private draft isolation; owner edits; evidence/date/URL validation; stale edit protection; JSON/CSV exports; cloud snapshots; restore preview/confirmation; non-destructive restore; anonymous submission isolation')
