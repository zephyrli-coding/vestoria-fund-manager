import {assert,connect,api,ready,tap,setValue,state,screenshotRoot} from './helpers.mjs';

const b=await connect('editor'),s=state(),checks=[];
let paginationId;
try {
  await b.navigate('http://localhost:20260/funds/'+s.fundId);
  await ready(b,s.name);
  await b.send('Network.enable');
  const before=(await api(b,'/api/v1/funds/'+s.fundId)).data.data;
  await tap(b,'更新净值');
  await b.fill('input[name="amount"]',String(before.balance));
  await b.send('Fetch.enable',{patterns:[{urlPattern:'*api/v1/*',requestStage:'Request'}]});
  await tap(b,'确认更新','dialog');
  let paused;
  const until=Date.now()+5000;
  while(!(paused=b.events.find(e=>e.method==='Fetch.requestPaused'))) {
    if(Date.now()>until)throw new Error('Request interception timed out');
    await new Promise(resolve=>setTimeout(resolve,50));
  }
  assert.ok((await b.snapshot()).controls.some(c=>c.text==='正在提交…'&&c.disabled));
  await b.send('Fetch.fulfillRequest',{requestId:paused.params.requestId,responseCode:500,responseHeaders:[{name:'Content-Type',value:'text/plain'}],body:Buffer.from('Internal Server Error').toString('base64')});
  await b.send('Fetch.disable');
  await b.wait("Boolean(document.querySelector('dialog [role=alert]'))");
  const failure=await b.snapshot();
  assert.ok(!failure.text.includes('Unexpected token'));
  assert.equal(await b.evaluate("document.querySelector('input[name=amount]').value"),String(before.balance));
  assert.ok(failure.controls.some(c=>c.text==='确认更新'&&!c.disabled));
  await b.screenshot(screenshotRoot+'operation-error-desktop.png',1440,1000);
  await tap(b,'取消','dialog');
  assert.equal((await api(b,'/api/v1/funds/'+s.fundId)).data.data.balance,before.balance);
  checks.push('plain-text HTTP 500 becomes readable error; input retained, duplicate submit disabled, no false success');
  const rows=[{_type:'fund_meta',name:'UI 分页回归临时',start_date:'2026-09-01',currency:'CNY'}];
  for(let i=1;i<=105;i++)rows.push({_type:'operation',operation_type:'add_investor',operation_date:'2026-09-01',creation_date:'2026-09-01',investor_name:'分页投资者 '+String(i).padStart(3,'0')});
  const seeded=await api(b,'/api/v1/funds/import',{method:'POST',body:JSON.stringify({content:rows.map(r=>JSON.stringify(r)).join('\n')})});
  assert.equal(seeded.status,200);
  paginationId=seeded.data.data.fund_id;
  await b.navigate('http://localhost:20260/funds/'+paginationId+'/investors');
  await b.wait("Boolean(document.querySelector('input[aria-label=搜索投资者]')) && document.body.innerText.includes('共 105 条')");
  assert.equal(await b.evaluate("document.querySelectorAll('tbody tr').length"),20);
  await tap(b,'下一页');
  assert.ok((await b.snapshot()).text.includes('21–40'));
  await b.fill('input[aria-label="搜索投资者"]','分页投资者 105');
  await b.wait("document.querySelectorAll('tbody tr').length===1 && document.body.innerText.includes('共 1 条')");
  const href=await b.evaluate("document.querySelector('a.table-title').getAttribute('href')");
  await b.navigate('http://localhost:20260'+href);
  await ready(b,'分页投资者 105');
  checks.push('105 investors load across backend pages; UI pagination/search and last investor deep link work');
  await b.navigate('http://localhost:20260/funds/'+paginationId+'?view=history');
  await ready(b,'UI 分页回归临时');
  await b.wait("document.body.innerText.includes('共 105 条')");
  await tap(b,'下一页');
  await b.wait("document.body.innerText.includes('21–40')");
  await setValue(b,'select[aria-label="操作类型"]','add_investor');
  await b.wait("document.body.innerText.includes('共 105 条') && document.body.innerText.includes('1–20')");
  await setValue(b,'input[aria-label="历史开始日期"]','2026-10-01');
  await b.wait("document.body.innerText.includes('所选条件下没有操作记录')");
  checks.push('server-paginated history and type/date filters preserve correct totals');
  assert.equal((await api(b,'/api/v1/funds/'+paginationId,{method:'DELETE'})).status,200);
  paginationId=undefined;
  const pages=[['/','基金总览'],['/funds','基金列表'],['/funds/'+s.fundId,s.name],['/investors','投资者'],['/funds/'+s.fundId+'/investors/'+s.investorB,'回归投资者乙'],['/operations','操作记录'],['/data','导入与导出']];
  for(const width of [1440,390,320]) {
    await b.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    for(const [path,title] of pages) {
      await b.navigate('http://localhost:20260'+path);
      await ready(b,title);
      const metrics=await b.evaluate("({width:innerWidth,scroll:document.documentElement.scrollWidth,errors:document.querySelectorAll('.error-state').length})");
      assert.ok(metrics.scroll<=metrics.width+1,`Horizontal overflow: ${width} ${path} ${metrics.scroll}`);
      assert.equal(metrics.errors,0,`Page error: ${path}`);
    }
  }
  checks.push('seven real pages at 1440/390/320 px have no page-level horizontal overflow or data errors');
  await b.navigate('http://localhost:20260/');
  await ready(b,'基金总览');
  await b.screenshot(screenshotRoot+'overview-desktop.png',1440,1100);
  await b.screenshot(screenshotRoot+'overview-mobile.png',390,844);
  await b.click('button[aria-label="打开导航"]');
  await b.wait("Boolean(document.querySelector('.sidebar.is-open'))");
  await b.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await b.wait("!document.querySelector('.sidebar.is-open')");
  assert.equal(await b.evaluate("document.activeElement.getAttribute('aria-label')"),'打开导航');
  await b.navigate('http://localhost:20260/funds/'+s.fundId);
  await ready(b,s.name);
  await b.screenshot(screenshotRoot+'fund-detail-desktop.png',1440,1100);
  await b.screenshot(screenshotRoot+'fund-detail-mobile.png',390,844);
  await tap(b,'更新净值');
  await b.fill('input[name="amount"]',String(before.balance));
  const bounds=await b.evaluate("(()=>{const r=document.querySelector('dialog').getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:innerWidth,height:innerHeight}})()");
  assert.ok(bounds.left>=0&&bounds.right<=bounds.width&&bounds.top>=0&&bounds.bottom<=bounds.height);
  await b.screenshot(screenshotRoot+'trade-preview-mobile.png',390,844);
  await b.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await b.wait("!document.querySelector('dialog[open]')");
  checks.push('mobile drawer Escape restores focus; native trade dialog fits screen and Escape cancels');
  assert.deepEqual(b.events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails.text),[]);
  console.log(JSON.stringify({passed:checks.length,checks,runtimeErrors:0}));
}catch(error){
  await b.send('Fetch.disable').catch(()=>{});
  await b.screenshot(screenshotRoot+'failure-resilience.png',1440,1100);
  console.error(error.stack);
  console.log(JSON.stringify(await b.snapshot()));
  process.exitCode=1;
}finally{b.close();}
