const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright-core');
(async()=>{
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
const results=[];
for(const file of ['detail-vacancy','index']){
await page.goto('http://localhost:8000/pages/'+file+'.html');await page.waitForTimeout(600);
const trigger=page.locator('.button-modal:not([data-modal-state])').first();await trigger.click();await page.waitForTimeout(500);
const modal=page.locator('.modal--active');
await modal.locator('input[type="checkbox"]').evaluateAll(es=>es.forEach(e=>{e.checked=true;e.dispatchEvent(new Event('change',{bubbles:true}));}));
const phone=modal.locator('[data-validate="phone"]');if(await phone.count()) await phone.first().fill('123');
const form=modal.locator('form').first();
const valid=await form.evaluate(e=>e.checkValidity());
await form.evaluate(e=>e.requestSubmit());await page.waitForTimeout(400);
results.push({file,emptyNameAndEmailIncompletePhoneValid:valid,success:await modal.evaluate(e=>e.classList.contains('modal--success'))});
await page.keyboard.press('Escape');await page.waitForTimeout(300);await trigger.click();await page.waitForTimeout(300);
await page.evaluate(()=>scrollTo(0,300));
const before=await page.evaluate(()=>scrollY);await page.mouse.move(2,200);await page.mouse.wheel(0,300);await page.waitForTimeout(400);
results.push({file,backgroundScrollBefore:before,backgroundScrollAfter:await page.evaluate(()=>scrollY)});
await page.screenshot({path:path.resolve(__dirname,'../test-results/production-audit/modal-'+file+'.png')});
}
await page.goto('http://localhost:8000/pages/ui-kit.html');await page.waitForTimeout(500);
results.push({table:await page.locator('.wyswig table thead').evaluateAll(es=>es.map(e=>({position:getComputedStyle(e).position,top:getComputedStyle(e).top})))});
fs.writeFileSync(path.resolve(__dirname,'../test-results/production-audit/form-submit.json'),JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
