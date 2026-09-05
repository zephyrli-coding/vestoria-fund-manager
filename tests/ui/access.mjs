import {assert,connect,api,ready,tap,login,state,screenshotRoot} from './helpers.mjs';

const fixture=state(),checks=[];
for(const [name,index] of [['viewer',1],['admin',3],['unverified',2],['ungranted',4]]) {
  const b=await connect(name);
  try {
    await login(b,index);
    if(name==='unverified'||name==='ungranted') {
      await b.wait("document.querySelector('.auth-card h1')?.textContent==='暂时无法进入 Fund'");
      const page=await b.snapshot();
      assert.ok(page.text.includes('邮箱')&&page.text.includes('验证'));
      assert.ok(page.controls.some(c=>c.href==='http://localhost:20263/auth/profile'));
      assert.equal((await api(b,'/api/v1/funds')).status,401);
      await b.screenshot(screenshotRoot+name+'-access.png',1100,800);
      checks.push(name+' account denied with email/permission guidance');
      continue;
    }
    await ready(b,'基金总览');
    const me=await api(b,'/api/v1/auth/me');
    assert.equal(me.status,200);
    assert.equal(me.data.data.can_edit,name==='admin');
    const cookies=(await b.send('Network.getCookies',{urls:['http://localhost:20260']})).cookies;
    assert.ok(cookies.some(c=>c.name.includes('fund')&&c.httpOnly));
    if(name==='viewer') {
      await b.navigate('http://localhost:20260/funds/'+fixture.fundId);
      await ready(b,fixture.name);
      const page=await b.snapshot();
      for(const label of ['添加投资者','更新净值','编辑基金'])assert.ok(page.controls.some(c=>c.text===label&&c.disabled));
      assert.equal((await api(b,'/api/v1/funds',{method:'POST',body:JSON.stringify({name:'must-not-write',currency:'CNY',start_date:'2026-09-01'})})).status,403);
      assert.equal((await api(b,'/api/v1/funds/'+fixture.fundId+'/operations/export')).status,200);
      await b.navigate('http://localhost:20260/funds/'+fixture.fundId+'/edit');
      await ready(b,'基金列表');
      assert.equal(await b.evaluate('location.pathname'),'/funds');
      checks.push('viewer real read/export, disabled writes, direct API 403, edit deep-link guard');
      await tap(b,'退出统一账号');
      await b.wait("location.port==='20260' && location.pathname==='/login' && Boolean(document.querySelector('.auth-card'))");
      assert.equal((await api(b,'/api/v1/auth/me')).status,401);
      checks.push('global logout returns to login and invalidates local session');
    } else {
      assert.ok((await b.snapshot()).controls.some(c=>c.href==='/funds/create'));
      checks.push('global admin inherits edit access; BFF session is HttpOnly');
    }
  } catch(error) {
    await b.screenshot(screenshotRoot+'failure-'+name+'.png',1440,1000);
    console.error(name+': '+error.stack);
    console.log(JSON.stringify(await b.snapshot()));
    process.exitCode=1;
  } finally {b.close();}
}
const p=await connect('prefix','http://localhost:21260/fund/');
try {
  await login(p,1,'http://localhost:21260/fund/');
  await ready(p,'基金总览');
  for(const route of ['/funds/'+fixture.fundId,'/funds/'+fixture.fundId+'/investors/'+fixture.investorB,'/operations','/data']) {
    await p.navigate('http://localhost:21260/fund'+route);
    await p.wait("Boolean(document.querySelector('.fund-app h1')) && !document.body.innerText.includes('正在加载真实数据')");
    assert.equal(await p.evaluate('location.pathname'),'/fund'+route);
    assert.equal(await p.evaluate("document.querySelectorAll('.error-state').length"),0);
  }
  assert.equal((await api(p,'/fund/api/v1/funds/'+fixture.fundId)).status,200);
  const paths=(await p.send('Network.getCookies',{urls:['http://localhost:21260/fund/']})).cookies.filter(c=>c.name.includes('fund')&&c.httpOnly).map(c=>c.path);
  assert.ok(paths.includes('/fund'));
  checks.push('/fund real OAuth, scoped HttpOnly session, API, detail/investor/history/import deep links');
} catch(error) {
  await p.screenshot(screenshotRoot+'failure-prefix.png',1440,1000);
  console.error('prefix: '+error.stack);
  console.log(JSON.stringify(await p.snapshot()));
  process.exitCode=1;
} finally {p.close();}
console.log(JSON.stringify({passed:checks.length,checks}));
