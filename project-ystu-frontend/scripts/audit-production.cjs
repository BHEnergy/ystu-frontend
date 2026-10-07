// Read-only audit of the existing production build. No rebuild or source edits.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const out = path.join(root, 'test-results', 'production-audit');
const sizes = [[1920,1080],[1440,900],[1366,768],[1024,768],[768,1024],[390,844],[360,800],[430,932],[844,390],[575,900],[576,900],[577,900],[767,900],[769,900],[990,900],[991,900],[992,900],[1100,900],[1101,900],[1102,900]];
const mime = {'.html':'text/html','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg'};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage();
 const report={date:new Date().toISOString(),target:dist,browser:browser.version(),results:[],errors:[],missing:[]};
 page.on('pageerror',e=>report.errors.push({url:page.url(),error:e.message}));
 await page.route('**/*',route=>{
  const u=new URL(route.request().url());
  if(u.hostname!=='ystu.test') return route.abort();
  const file=path.resolve(dist,'.'+decodeURIComponent(u.pathname));
  if(!file.startsWith(dist+path.sep)||!fs.existsSync(file)){report.missing.push(u.pathname);return route.fulfill({status:404,body:''});}
  return route.fulfill({body:fs.readFileSync(file),contentType:mime[path.extname(file)]||'application/octet-stream'});
 });
 try {
 for(const [width,height] of sizes){
  await page.setViewportSize({width,height});
  for(const file of fs.readdirSync(path.join(dist,'pages')).filter(f=>f.endsWith('.html')&&f!=='map-test.html')){
   await page.goto('http://ystu.test/pages/'+file);
   await page.evaluate(()=>document.fonts.ready);
   await page.waitForTimeout(150);
   const data=await page.evaluate(()=>{
    const visible=e=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
    const center=e=>{const r=e.getBoundingClientRect();return r.y+r.height/2;};
    const header=document.querySelector('.header__menu--collapsed');
    const nav=document.querySelector('.main-nav a');
    const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
    return {overflow:document.documentElement.scrollWidth-innerWidth,
     headerOffset:header&&nav&&visible(nav)?Math.round((center(nav)-center(header))*100)/100:null,
     headerBreaks:document.querySelectorAll('.main-nav br').length,
     duplicateIds:[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))],
     placeholderLinks:document.querySelectorAll('a[href="#"]').length,
     missingAlt:document.querySelectorAll('img:not([alt])').length,
     nestedLinks:document.querySelectorAll('a a').length,
     overflowElements:[...document.querySelectorAll('main > *, header')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+1||r.left< -1;}).map(e=>e.className)};
   });
   report.results.push({file,width,height,...data});
   if([1920,390].includes(width)){
    await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=innerHeight){scrollTo(0,y);await new Promise(r=>setTimeout(r,25));}scrollTo(0,0);});
    await page.waitForTimeout(300);
    await page.screenshot({path:path.join(out,file+'-'+width+'.png'),fullPage:true});
   }
  }
  console.log('Checked',width,height);
  fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify(report,null,2));
 }
 } finally {await browser.close();}
 console.log('Completed',report.results.length,'page/viewport combinations');
})().catch(e=>{console.error(e);process.exitCode=1;});
