const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const project=path.resolve(__dirname,'..');
const names=[...fs.readFileSync(path.join(project,'src/images/svg/sprite.svg'),'utf8').matchAll(/<symbol\b[^>]*id="([^"]+)"/g)].map(m=>m[1]);
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});
try{for(const root of [path.dirname(project),path.join(project,'dist')]){
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='ystu.test')return r.abort();const f=path.resolve(root,'.'+u.pathname);return fs.existsSync(f)?r.fulfill({body:fs.readFileSync(f),contentType:({'.svg':'image/svg+xml','.html':'text/html','.js':'application/javascript','.css':'text/css'})[path.extname(f)]||'application/octet-stream'}):r.abort()});
 await page.goto('http://ystu.test/pages/index.html');
 const results=await page.evaluate(async names=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=32;const ctx=canvas.getContext('2d');
  const results=[];
  for(const name of names){const img=new Image();img.src='../images/svg/sprite.svg#'+name+'-view';await img.decode();ctx.clearRect(0,0,32,32);ctx.drawImage(img,0,0,32,32);const pixels=ctx.getImageData(0,0,32,32).data;let count=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>0)count++;results.push({name,pixels:count})}
  return results;
 },names);
 assert(results.every(r=>r.pixels>0),JSON.stringify(results.filter(r=>!r.pixels)));
 assert(await page.locator('.information-banner__body .btn').evaluate(e=>getComputedStyle(e,'::after').backgroundImage.includes('data:image/svg+xml')));
 await page.locator('.footer').scrollIntoViewIfNeeded();await page.waitForTimeout(150);
 const visible=await page.locator('.footer__contacts use').evaluateAll(es=>es.every(e=>e.getBBox().width>0));assert(visible);
 console.log(path.basename(root)+': все '+results.length+' CSS-иконки отрисованы; стрелка баннера и иконки футера подключены');
 await page.close();
}}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
