import fs from 'node:fs';
import assert from 'node:assert/strict';
import { connect } from './cdp.mjs';

export { assert, connect };
export const statePath = '/private/tmp/fund-ui-regression-state.json';
export const screenshotRoot = new URL('../../docs/iterations/screenshots/unified-ui/', import.meta.url).pathname;
export function user(index) {
  return JSON.parse(fs.readFileSync('/private/tmp/fund-ui-credentials.json', 'utf8')).users[index];
}
export function saveState(state) { fs.writeFileSync(statePath, JSON.stringify(state, null, 2), { mode: 0o600 }); }
export function state() { return JSON.parse(fs.readFileSync(statePath, 'utf8')); }
export async function setValue(b, selector, value) {
  await b.evaluate(`(() => { const element=document.querySelector(${JSON.stringify(selector)}); if(!element)throw new Error('Input missing'); const prototype=element.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype,'value').set.call(element,${JSON.stringify(String(value))}); element.dispatchEvent(new Event('input',{bubbles:true}));element.dispatchEvent(new Event('change',{bubbles:true})); })()`);
}
export async function tap(b, text, scope = 'body') {
  await b.evaluate(`(() => {document.querySelectorAll('[data-fund-ui-target]').forEach(e=>e.removeAttribute('data-fund-ui-target')); const element=Array.from(document.querySelectorAll(${JSON.stringify(scope + ' button')})).find(e=>e.textContent.trim()===${JSON.stringify(text)}&&!e.disabled&&e.getBoundingClientRect().width); if(!element)throw new Error('Button unavailable: '+${JSON.stringify(text)});element.setAttribute('data-fund-ui-target','true');})()`);
  await b.click('[data-fund-ui-target]');
}
export async function ready(b, title) {
  await b.wait(`document.querySelector('h1')?.textContent===${JSON.stringify(title)} && !document.body.innerText.includes('正在加载真实数据')`);
}
export async function api(b, endpoint, options = {}) {
  return b.evaluate(`(async()=>{const options=${JSON.stringify(options)};const headers=new Headers(options.headers);const token=document.cookie.split('; ').find(x=>x.startsWith('vestoria_fund_csrf='));if(options.method&&options.method!=='GET'&&token)headers.set('X-CSRF-Token',decodeURIComponent(token.slice(token.indexOf('=')+1)));if(options.body)headers.set('Content-Type','application/json');const response=await fetch(${JSON.stringify(endpoint)},{...options,headers,credentials:'include'});const text=await response.text();let data;try{data=JSON.parse(text)}catch{data={text:text.slice(0,150)}}return {status:response.status,data};})()`);
}
export async function login(b, index, origin = 'http://localhost:20260') {
  await b.navigate(origin);
  await b.wait("location.port==='20263' && Boolean(document.querySelector('input[name=email]')) || Boolean(document.querySelector('.fund-app')) || document.querySelector('.auth-card h1')?.textContent==='暂时无法进入 Fund'");
  if(await b.evaluate("Boolean(document.querySelector('input[name=email]'))")) {
    const fixture=user(index);
    await b.fill('input[name="email"]',fixture.email);
    await b.fill('input[name="password"]',fixture.password);
    await b.click('button[type="submit"]');
  }
}
export async function chooseTrade(b, person, label) {
  await b.evaluate(`(() => {const row=Array.from(document.querySelectorAll('tbody tr')).find(r=>r.querySelector('a.table-title')?.textContent===${JSON.stringify(person)});if(!row)throw new Error('Investor row missing');document.querySelectorAll('[data-fund-ui-row]').forEach(e=>e.removeAttribute('data-fund-ui-row'));row.setAttribute('data-fund-ui-row','true');})()`);
  await tap(b,label,'[data-fund-ui-row]');
  await b.wait("Boolean(document.querySelector('dialog[open]'))");
}
export async function finishTrade(b, label, date) {
  if(date)await setValue(b,'input[name="operation-date"]',date);
  await tap(b,label,'dialog');
  await b.wait("!document.querySelector('dialog[open]') && !document.body.innerText.includes('正在加载真实数据')");
}
