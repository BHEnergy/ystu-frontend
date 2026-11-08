const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright-core');
(async () => {
    for (const engine of [chromium, webkit]) {
        const browser = await engine.launch({});
        try {
            for (const base of ['http://127.0.0.1:5500', 'http://localhost:8000']) {
                const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
                await page.goto(base + '/pages/map.html');
                await page.evaluate(() => SiteUI.ready);
                const result = await page.evaluate(async () => {
                    const original = document.querySelector('[data-campus-map-component]');
                    const host = original.cloneNode(true);
                    host.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
                    const map = host.querySelector('[data-campus-map]');
                    map.dataset.mapProvider = 'static';
                    map.dataset.campusObjects = JSON.stringify([{ ...CampusMap.campusObjects[0], id: 'custom-object', title: 'Другой компонент' }]);
                    document.body.append(host);
                    await SiteUI.init(host);
                    const first = CampusMap.get(map);
                    await SiteUI.init(host);
                    const same = first === CampusMap.get(map);
                    const originalFilter = original.querySelector('[data-campus-filter="category"]');
                    const cloneFilter = host.querySelector('[data-campus-filter="category"]');
                    originalFilter.querySelector('[data-filter-value="education"]').click();
                    cloneFilter.querySelector('[data-filter-value="laboratory"]').click();
                    return {
                        same,
                        count: map.querySelectorAll('[data-campus-marker]').length,
                        object: first.campusObjects[0].id,
                        originalValue: originalFilter.querySelector('.is-selected')?.dataset.filterValue,
                        cloneValue: cloneFilter.querySelector('.is-selected')?.dataset.filterValue,
                        originalCount: original.querySelectorAll('[data-campus-marker]').length,
                    };
                });
                assert(result.same);
                assert.equal(result.count, 1);
                assert.equal(result.object, 'custom-object');
                assert.equal(result.originalCount, 6);
                assert.equal(result.originalValue, 'education');
                assert.equal(result.cloneValue, 'laboratory');
                console.log('OK independent maps: ' + engine.name() + '/' + base);
                await page.close();
            }
        } finally { await browser.close(); }
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
