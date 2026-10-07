const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright-core');
const out=path.resolve(__dirname,'../test-results/production-audit');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage();
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 const results=[];
 const record=(name,data)=>{results.push({name,...data});console.log(name,JSON.stringify(data));};
 const visit=async(name,width=390,height=844)=>{await page.setViewportSize({width,height});await page.goto('http://localhost:8000/pages/'+name+'.html');await page.waitForTimeout(700);};
 try{
 for(const width of [390,1440]){
 await visit('detail-vacancy',width);
 const trigger=page.locator('.button-modal:not([data-modal-state])').first();
 await trigger.click();await page.waitForTimeout(500);
 const modal=page.locator('.modal--active');
 record('modal-open-'+width,{count:await modal.count(),bodyOverflow:await page.evaluate(()=>getComputedStyle(document.body).overflow)});
 await page.keyboard.press('Shift+Tab');
 record('modal-focus-trap-'+width,{inside:await page.evaluate(()=>!!document.activeElement.closest('.modal--active'))});
 const fields=await modal.locator('input').evaluateAll(es=>es.map(e=>({type:e.type,required:e.required,validate:e.dataset.validate,name:e.name})));
 record('form-fields-'+width,{fields});
 const phone=modal.locator('[data-validate="phone"]').first();
 if(await phone.count()){await phone.fill('123');await phone.blur();record('phone-incomplete-'+width,{value:await phone.inputValue(),valid:await phone.evaluate(e=>e.checkValidity()),ariaInvalid:await phone.getAttribute('aria-invalid')});}
 await page.keyboard.press('Escape');await page.waitForTimeout(300);
 record('modal-close-'+width,{remaining:await page.locator('.modal--active').count(),focusReturned:await trigger.evaluate(e=>document.activeElement===e)});
 }
 await visit('index');
 await page.evaluate(()=>scrollTo(0,800));await page.waitForTimeout(500);
 const initial=await page.evaluate(()=>scrollY);
 await page.locator('.btn__menu').click();await page.waitForTimeout(500);
 const section=page.locator('.mega-menu__primary-link.has-submenu').first();
 await section.click({position:{x:20,y:15}});await page.waitForTimeout(700);
 record('mobile-section-open',{expanded:await section.getAttribute('aria-expanded')});
 const box=await section.boundingBox();await section.click({position:{x:box.width-10,y:15}});await page.waitForTimeout(400);
 record('mobile-section-arrow-close',{expanded:await section.getAttribute('aria-expanded')});
 await page.locator('.btn__menu').click();await page.waitForTimeout(500);
 record('mobile-menu-scroll-restore',{before:initial,after:await page.evaluate(()=>scrollY)});
 for(const width of [390,1440]){
 await visit('index',width);
 record('banner-links-'+width,await page.locator('.banner__body').evaluateAll(es=>({count:es.length,allLinks:es.every(e=>e.tagName==='A'&&e.getAttribute('href')==='#')})));
 await visit('vacancies',width);
 const input=page.locator('.catalog-search__input:visible').first();await input.fill('zzzz9999');await input.press('Enter');
 record('vacancies-empty-'+width,{visibleCards:await page.locator('.vacancy-card:visible').count()});
 await input.fill('');await input.press('Enter');record('vacancies-reset-'+width,{visibleCards:await page.locator('.vacancy-card:visible').count(),statusVisible:await page.locator('.catalog-search-status').isVisible()});
 await visit('ui-kit',width);
 record('tables-'+width,await page.locator('.wyswig table').evaluateAll(es=>es.map(e=>({width:e.getBoundingClientRect().width,parentWidth:e.parentElement.getBoundingClientRect().width,parentOverflow:getComputedStyle(e.parentElement).overflowX,headerPosition:e.querySelector('th')?getComputedStyle(e.querySelector('th')).position:null}))));
 }
 }catch(e){record('interrupted',{error:e.message});await page.screenshot({path:path.join(out,'interaction-failure.png')});}
 finally{fs.writeFileSync(path.join(out,'interactions.json'),JSON.stringify(results,null,2));await browser.close();}
})();
