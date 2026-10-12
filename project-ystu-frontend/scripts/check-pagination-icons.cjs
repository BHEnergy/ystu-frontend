const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const project=path.resolve(__dirname,'..');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});
try{for(const root of [path.dirname(project),path.join(project,'dist')]){
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='ystu.test')return r.abort();const f=path.resolve(root,'.'+u.pathname);return fs.existsSync(f)?r.fulfill({body:fs.readFileSync(f),contentType:({'.html':'text/html','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2'})[path.extname(f)]||'application/octet-stream'}):r.abort()});
 await page.goto('http://ystu.test/pages/news-events.html');await page.waitForFunction(()=>window.Pagination);
 const news=page.locator('.events__container[data-tab=news]');
 assert.deepEqual((await news.locator('.pagination__page:visible').allTextContents()).map(s=>s.trim()),['1','2','3','4','16']);
 assert.equal(await news.locator('.pagination__button-next:visible').count(),1);
 await news.locator('.pagination__page').last().click();assert.equal(await news.locator('.news__card:visible').count(),6);
 assert.match(await news.locator('.news__card:visible').first().innerText(),/91/);
 await page.locator('.events__title[data-tab=events]').click();await page.waitForTimeout(400);
 const backgrounds=await page.evaluate(()=>['.pagination__button-next','.event__date','.event__location'].map(s=>getComputedStyle(document.querySelector(s),s.startsWith('.event')?'::before':null).backgroundImage));
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Открыть меню',exact:true}).click();await page.waitForTimeout(400);
 backgrounds.push(await page.locator('.mega-menu__primary-link.has-submenu').first().evaluate(e=>getComputedStyle(e,'::after').backgroundImage));
 const pixels=await page.evaluate(async backgrounds=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=32;const ctx=canvas.getContext('2d');const out=[];
  for(const bg of backgrounds){const img=new Image();img.src=bg.slice(5,-2);await img.decode();ctx.clearRect(0,0,32,32);ctx.drawImage(img,0,0,32,32);const data=ctx.getImageData(0,0,32,32).data;out.push(data.some((n,i)=>i%4===3&&n>0))}return out;
 },backgrounds);
 assert(pixels.every(Boolean));console.log(path.basename(root)+': 16 страниц, смена карточек, стрелки пагинации/меню и SVG событий отрисованы');
 await page.close();
}}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
