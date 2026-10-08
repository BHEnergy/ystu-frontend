const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require('playwright-core');
const project = path.resolve(__dirname, '..');
const normalized = file => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').replace(/[\t ]+$/gm, '').trim();
const styles = ['components/header-search.css', 'components/slider.css', 'layout/header.css', 'utilities/touch-targets.css'];
for (const file of styles) {
    assert.equal(normalized(path.join(project, 'src/styles', file)), normalized(path.join(project, 'dist/styles', file)), file);
    const legacyFile = path.join(project, '../css/components', path.basename(file));
    if (fs.existsSync(legacyFile)) assert.equal(normalized(path.join(project, 'src/styles', file)), normalized(legacyFile), file);
}
const bulletRules = css => [...css.matchAll(/[^{}]*swiper-pagination-bullet[^{}]*\{[^{}]*\}/g)].map(m => m[0].trim());
if (fs.existsSync(path.join(project, '../.git'))) {
    const baseline = require('node:child_process').execFileSync('git', ['show', 'HEAD:css/components/slider.css'], {cwd:project, encoding:'utf8'});
    assert.deepEqual(bulletRules(normalized(path.join(project, 'src/styles/components/slider.css'))), bulletRules(baseline.replace(/\r/g,'')));
    console.log('OK: правила bullets совпадают с базовой версией Git');
} else console.log('SKIP: сравнение bullets с Git недоступно в архиве без Git-истории');
console.log('OK: исправленные CSS совпадают в исходниках и доступных комплектах');
const crypto = require('node:crypto');
const snapshot = directory => Object.fromEntries(fs.readdirSync(directory, {recursive:true})
    .filter(file => fs.statSync(path.join(directory,file)).isFile())
    .map(file => [file,crypto.createHash('sha256').update(fs.readFileSync(path.join(directory,file))).digest('hex')]));
const beforeBuild = snapshot(path.join(project,'dist'));
require('./build.cjs')();
assert.deepEqual(snapshot(path.join(project,'dist')), beforeBuild);
console.log('OK: повторная сборка побайтно воспроизводит dist');

(async () => {
  for (const channel of ['chrome', 'msedge']) {
    let browser;
    try { browser = await chromium.launch({channel, headless:true}); }
    catch (error) { if (channel === 'chrome') throw error; console.log('SKIP: Edge не установлен'); continue; }
    console.log(channel, browser.version());
    try {
      const roots = [path.join(project, 'dist')];
      if (fs.existsSync(path.join(project, '../pages/index.html'))) roots.unshift(path.dirname(project));
      for (const root of roots) {
        const page = await browser.newPage({viewport:{width:390,height:844}});
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', async route => {
          const url = new URL(route.request().url());
          if (url.hostname !== 'ystu.test') return route.abort();
          if (url.pathname.endsWith('/header.js')) await new Promise(resolve => setTimeout(resolve, 700));
          const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
          if (!fs.existsSync(file)) return route.fulfill({status:404,body:''});
          const types = {'.html':'text/html','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png'};
          await route.fulfill({body:fs.readFileSync(file), contentType:types[path.extname(file)] || 'application/octet-stream'});
        });
        await page.goto('http://ystu.test/pages/index.html');
        await page.waitForFunction(() => window.HeaderSearch && document.querySelector('.header__mobile-tools a'));
        await page.getByRole('button', {name:'Открыть меню',exact:true}).click();
        await page.locator('.header__mobile-tools a').first().click();
        assert(await page.locator('.header-search').isVisible());
        assert(page.url().endsWith('/index.html'));
        assert.equal(await page.locator('.header-search').count(), 1);
        await page.getByRole('button', {name:'Закрыть меню',exact:true}).click({timeout:5000});
        assert(await page.locator('.header-search').isHidden());
        console.log('OK:', channel, path.basename(root), 'поиск при задержке header.js, крестик меню и закрытие поиска');

        await page.goto('http://ystu.test/pages/news-events.html?page=2');
        await page.waitForFunction(() => window.Pagination);
        const news = page.locator('.events__container[data-tab=news]');
        const events = page.locator('.events__container[data-tab=events]');
        assert.equal(await news.locator('.pagination [aria-current=page]').innerText(), '2');
        assert.equal(await news.locator('.news__card:visible').count(), 2);
        assert.match(await news.locator('.news__card:visible').first().innerText(), /научные проекты/);
        await news.locator('.pagination__button-prev').click();
        assert.equal(await news.locator('.news__card:visible').count(), 6);
        assert.equal(new URL(page.url()).searchParams.get('page'), '1');
        await page.goBack();
        assert.equal(await news.locator('.news__card:visible').count(), 2);
        await page.goForward();
        assert.equal(await news.locator('.news__card:visible').count(), 6);
        await news.locator('.pagination__button-next').press('Enter');
        assert.equal(await news.locator('.news__card:visible').count(), 2);
        await page.locator('.events__tag[data-filter="#наука"]').click();
        assert.equal(await news.locator('.news__card:visible').count(), 1);
        assert.equal(await news.locator('.pagination [aria-current=page]').innerText(), '1');
        await page.locator('.events__tag[data-filter=all]').click();
        assert.equal(await news.locator('.news__card:visible').count(), 6);
        await page.locator('.events__header .tab[data-tab=events]').click();
        await page.waitForTimeout(400);
        await events.locator('.pagination__button-next').click();
        assert.equal(await events.locator('.event__card:visible').count(), 2);
        assert.match(await events.locator('.event__card:visible').first().innerText(), /День открытых дверей/);
        await page.reload();
        await page.waitForFunction(() => window.Pagination);
        await page.waitForTimeout(400);
        assert.equal(await events.locator('.event__card:visible').count(), 2);
        assert.equal(await events.locator('.pagination [aria-current=page]').innerText(), '2');
        assert.equal(await events.locator('.pagination__button-next').getAttribute('aria-disabled'), 'true');
        assert.equal(await page.locator('link[rel=icon]').count(), 1);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        assert.deepEqual(errors, []);
        console.log('OK:', channel, path.basename(root), 'две страницы новостей/событий, URL, reload, Back/Forward, Enter, фильтры');
        await page.close();
      }
    } finally { await browser.close(); }
  }
})().catch(error => {console.error(error);process.exitCode=1;});
