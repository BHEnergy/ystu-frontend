const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright-core');
(async()=>{
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();
await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
const results=[];
for(const [file,width] of [['index',360],['vacancies',1101],['detail-sotrudnik',1440]]){
await page.setViewportSize({width,height:900});await page.goto('http://localhost:8000/pages/'+file+'.html');await page.waitForTimeout(800);
results.push({file,width,overflow:await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+1&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('.swiper,.mega-menu,.modal');}).slice(0,20).map(e=>({tag:e.tagName,cls:e.className,right:e.getBoundingClientRect().right,text:e.textContent.trim().slice(0,80)})))});
await page.screenshot({path:path.resolve(__dirname,'../test-results/production-audit/layout-'+file+'-'+width+'.png')});
}
await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:8000/pages/map.html');await page.waitForTimeout(1000);
const map=page.locator('.campus-map-page__canvas');const before=await map.boundingBox();await page.locator('.campus-filter summary').first().click();await page.waitForTimeout(300);const after=await map.boundingBox();
results.push({mapCanvas:before,mapAfterFilter:after,markers:await page.locator('.campus-marker__trigger').count()});
if(await page.locator('.campus-marker__trigger').count()){
 await page.locator('.campus-filter summary').first().click();
 await page.waitForTimeout(300);
 await page.locator('.campus-marker__label').first().click();await page.waitForTimeout(200);
 results.push({popupVisible:await page.locator('.campus-popup-layer').isVisible()});
 await page.locator('.campus-marker__close').click();results.push({popupClosed:!(await page.locator('.campus-popup-layer').isVisible())});
}
await page.screenshot({path:path.resolve(__dirname,'../test-results/production-audit/map-filter.png')});
fs.writeFileSync(path.resolve(__dirname,'../test-results/production-audit/layout-details.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
