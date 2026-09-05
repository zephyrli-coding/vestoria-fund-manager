import fs from 'node:fs';

const stateFile = '/private/tmp/fund-ui-browser-contexts.json';

export async function connect(name = 'editor', url = 'http://localhost:20260') {
  const version = await fetch('http://127.0.0.1:9223/json/version').then(r => r.json());
  const socket = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let sequence = 0;
  const pending = new Map();
  const events = [];
  socket.onmessage = message => {
    const data = JSON.parse(message.data);
    if (data.id && pending.has(data.id)) {
      const {resolve, reject, timer} = pending.get(data.id);
      pending.delete(data.id); clearTimeout(timer);
      if (data.error) reject(new Error(data.error.message)); else resolve(data.result);
    } else if (data.method) events.push(data);
  };
  const call = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('CDP timeout: ' + method)); }, 15000);
    pending.set(id, {resolve, reject, timer});
    socket.send(JSON.stringify({id, method, params, ...(sessionId ? {sessionId} : {})}));
  });
  const state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : {};
  if (!state[name]) {
    const {browserContextId} = await call('Target.createBrowserContext');
    const {targetId} = await call('Target.createTarget', {url: 'about:blank', browserContextId});
    state[name] = {targetId, browserContextId};
    fs.writeFileSync(stateFile, JSON.stringify(state), {mode: 0o600});
  }
  const {sessionId} = await call('Target.attachToTarget', {targetId: state[name].targetId, flatten: true});
  const send = (method, params = {}) => call(method, params, sessionId);
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.bringToFront');
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Browser evaluation failed');
    return result.result.value;
  };
  const wait = async (expression, timeout = 25000) => {
    const until = Date.now() + timeout;
    while (Date.now() < until) {
      try { const result = await evaluate(expression); if (result) return result; } catch {}
      await new Promise(resolve => setTimeout(resolve, 120));
    }
    throw new Error('Browser condition timed out: ' + expression.slice(0, 180));
  };
  const click = async selector => {
    await evaluate(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:'center'})`);
    await wait(`(() => {const el=document.querySelector(${JSON.stringify(selector)});if(!el||el.disabled)return false;const r=el.getBoundingClientRect();const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return r.width>0&&r.height>0&&Boolean(hit)&&(hit===el||el.contains(hit));})()`);
    const point = await evaluate(`(() => { const el=document.querySelector(${JSON.stringify(selector)}); if(!el)throw new Error('Control not found'); el.scrollIntoView({block:'center'}); const r=el.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; })()`);
    await send('Input.dispatchMouseEvent', {type:'mouseMoved', ...point});
    await send('Input.dispatchMouseEvent', {type:'mousePressed',button:'left',clickCount:1,...point});
    await send('Input.dispatchMouseEvent', {type:'mouseReleased',button:'left',clickCount:1,...point});
  };
  const fill = async (selector, value) => {
    await evaluate(`(() => {const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw new Error('Input not found');el.focus();el.select?.();})()`);
    await send('Input.insertText', {text: String(value)});
  };
  const snapshot = () => evaluate(`({path:location.origin+location.pathname,title:document.title,text:document.body.innerText.slice(0,8500),controls:[...document.querySelectorAll('button,a,input,select,textarea')].map(el=>({tag:el.tagName,text:el.textContent?.trim().slice(0,90),name:el.name,type:el.type,disabled:el.disabled,href:el.tagName==='A'?el.getAttribute('href')?.split('?')[0]:undefined}))})`);
  const navigate = async target => { await send('Page.navigate', {url: target}); };
  const screenshot = async (filename, width = 1440, height = 1080) => {
    await send('Page.bringToFront');
    await send('Emulation.setDeviceMetricsOverride', {width,height,deviceScaleFactor:1,mobile:width<600});
    await wait('document.readyState === "complete"');
    await evaluate(`Promise.race([(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));for(const animation of document.getAnimations()){if(animation.playState==='running'&&animation.effect?.getComputedTiming().iterations!==Infinity)await animation.finished.catch(()=>{});}})(),new Promise(resolve=>setTimeout(resolve,2500))])`);
    const {data} = await send('Page.captureScreenshot', {format:'png',captureBeyondViewport:false});
    fs.mkdirSync(filename.slice(0, filename.lastIndexOf('/')), {recursive:true});
    fs.writeFileSync(filename, Buffer.from(data,'base64'));
  };
  return {send, call, sessionId, contextId:state[name].browserContextId, events, evaluate, wait, click, fill, snapshot, navigate, screenshot, close:() => socket.close(), url};
}
