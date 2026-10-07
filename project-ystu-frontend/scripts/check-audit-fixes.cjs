const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const project = path.resolve(__dirname, '..');
const mime = { '.html':'text/html', '.css':'text/css', '.js':'application/javascript', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.png':'image/png', '.jpg':'image/jpeg' };
(async () => {
 const browser = await chromium.launch({ channel: 'chrome', headless: true });
 try {
 for (const root of [path.dirname(project), path.join(project, 'dist')]) {
  const page = await browser.newPage();
  await page.route('**/*', route => {
   const url = new URL(route.request().url());
   if (url.hostname !== 'ystu.test') return route.abort();
   const file = path.resolve(root, '.' + url.pathname);
   if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return route.fulfill({status:404,body:''});
   return route.fulfill({body:fs.readFileSync(file),contentType:mime[path.extname(file)]||'application/octet-stream'});
  });
  const visit = async (file,width,height=900) => {
   await page.setViewportSize({width,height});
   await page.goto('http://ystu.test/pages/'+file+'.html');
   await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(350);
  };
  for (const width of [1101,1102,1366,1440,1920]) {
   await visit('detail-sotrudnik',width);
   const offset = await page.evaluate(()=>{
    const a=document.querySelector('.main-nav a').getBoundingClientRect();
    const b=document.querySelector('.header__menu--collapsed').getBoundingClientRect();
    return Math.abs(a.y+a.height/2-b.y-b.height/2);
   });
   assert(offset<2,'Header alignment '+width+': '+offset);
   assert.equal(await page.locator('.main-nav br').count(),0);
  }
  console.log(root,'BUG-01 OK');
  for (const file of ['index','ui-kit']) {
   await visit(file,360);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Statistics overflow '+file);
  }
  console.log(root,'BUG-02 OK');
  for (const width of [1100,1101,1102,1440,390]) {
   for (const file of ['404','detail-vacancy','map','nauka','news-events','search','structure','vacancies']) {
    await visit(file,width);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Footer overflow '+file+' '+width);
   }
  }
  console.log(root,'BUG-03 OK');
  for (const width of [390,1440]) {
   await visit('index',width,844);
   const trigger=page.locator('.button-modal:not([data-modal-state])').first();
   await trigger.scrollIntoViewIfNeeded();await page.waitForTimeout(350);
   const saved=await page.evaluate(()=>scrollY);
   await trigger.click();await page.waitForTimeout(400);
   assert.equal(await page.evaluate(()=>document.body.style.position),'fixed');
   const top=await page.evaluate(()=>document.body.getBoundingClientRect().top);
   await page.mouse.move(2,200);await page.mouse.wheel(0,400);await page.waitForTimeout(300);
   assert.equal(await page.evaluate(()=>document.body.getBoundingClientRect().top),top);
   await page.keyboard.press('Escape');await page.waitForTimeout(400);
   assert.equal(await page.evaluate(()=>document.body.style.position),'');
   assert(Math.abs((await page.evaluate(()=>scrollY))-saved)<2,'Scroll position not restored');
   await trigger.click();await page.waitForTimeout(400);
   await page.locator('.modal--active .modal-close').click();await page.waitForTimeout(400);
   assert.equal(await page.locator('.modal--active').count(),0);
   assert.equal(await page.evaluate(()=>document.body.style.position),'');
  }
  console.log(root,'BUG-04 OK');
  const html=fs.readFileSync(path.join(root,'pages/map-test.html'),'utf8');
  assert(html.includes('id="map" role="region" aria-label='));
  console.log(root,'BUG-05 role OK');
  await page.close();
 }
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
