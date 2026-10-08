const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const project=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{for(const root of [path.dirname(project),path.join(project,'dist')]){
  const page=await browser.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='ystu.test')return r.abort();const f=path.resolve(root,'.'+decodeURIComponent(u.pathname));return fs.existsSync(f)?r.fulfill({body:fs.readFileSync(f),contentType:({'.html':'text/html','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.woff2':'font/woff2','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream'}):r.fulfill({status:404,body:''});});
  const visit=async(name,width=390)=>{await page.setViewportSize({width,height:844});await page.goto('http://ystu.test/pages/'+name+'.html');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);};
  await visit('detail-vacancy');await page.locator('.button-modal:not([data-modal-state])').first().click();
  const modal=page.locator('.modal--active');
  assert.equal(await modal.locator('.error-text:visible').count(),0);
  assert.equal(await modal.locator('input[name="name"]').getAttribute('required'),'');
  const phone=modal.locator('[data-validate="phone"]');await phone.fill('123');assert.equal(await phone.evaluate(e=>e.checkValidity()),false);
  await phone.fill('+7 (999) 123-45-67');assert.equal(await phone.evaluate(e=>e.checkValidity()),true);
  const file=modal.locator('input[type="file"]');await file.focus();assert(await file.evaluate(e=>document.activeElement===e));
  await file.setInputFiles({name:'resume.txt',mimeType:'text/plain',buffer:Buffer.from('Test resume')});assert.match(await modal.locator('.modal-form__file-label').innerText(),/resume.txt/);
  await page.keyboard.press('Escape');await page.waitForTimeout(300);
  console.log(root,'forms OK');
  await visit('programs',1440);const cards=page.locator('.program-card:visible');const count=await cards.count();
  const form=page.locator('.listing-page__sidebar form');await form.locator('[value="master"]').check();await form.locator('button[type="submit"]').last().click();assert((await cards.count())>0&&(await cards.count())<count);
  await form.locator('[type="reset"]').click();assert.equal(await cards.count(),count);assert.equal(await form.locator('input:checked').count(),0);
  console.log(root,'filters OK');
  await visit('ui-kit');await page.evaluate(()=>{const d=document.createElement('div');d.className='wyswig';d.style.width='320px';d.innerHTML='<p>'+('long'.repeat(300))+'</p><iframe width="1200" title="Test" src="about:blank"></iframe><table><tr><td>Test</td></tr></table>';document.querySelector('main').append(d);});await page.waitForTimeout(150);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert(await page.locator('.wyswig').last().locator('.wyswig__table-scroll').count());
  console.log(root,'CMS container OK');
  await visit('index',1440);const img=page.locator('.slide__photo').first();assert.match(await img.evaluate(e=>e.currentSrc),/main-slide.webp/);
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);assert.match(await img.evaluate(e=>e.currentSrc),/main-slide-mobile.webp/);
  await page.setViewportSize({width:1440,height:844});await page.waitForTimeout(400);assert.match(await img.evaluate(e=>e.currentSrc),/main-slide.webp/);
  await page.locator('.navbar__panel a[href="search.html"]').click();assert(await page.locator('.header-search').isVisible());await page.keyboard.press('Escape');assert(!(await page.locator('.header-search').isVisible()));
  const emptyPage=await browser.newPage();
  emptyPage.on('pageerror',e=>errors.push(e.message));
  await emptyPage.setContent('<!doctype html><html><body></body></html>');
  await emptyPage.addScriptTag({content:fs.readFileSync(path.join(root,'js/components/cookie.js'),'utf8')});
  await emptyPage.close();
  assert.deepEqual(errors,[]);console.log(root,'images/search OK');await page.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
