const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium, webkit } = require('playwright-core');
const parse5 = require('parse5');

const repo = path.resolve(__dirname, '../..');
const pages = fs.readdirSync(path.join(repo, 'project-ystu-frontend/dist/pages')).filter(f => f.endsWith('.html'));
const walk = (node, fn) => { fn(node); (node.childNodes || []).forEach(child => walk(child, fn)); };
const output = { pages, static: [], browser: [] };
for (const [name, root] of [['root', repo], ['dist', path.join(repo, 'project-ystu-frontend/dist')]]) {
    for (const page of pages) {
        const file = path.join(root, 'pages', page);
        if (!fs.existsSync(file)) {
            output.static.push({ base: name, page, notProvided: true, duplicateIds: [], missing: [], brokenFragments: [], brokenAria: [] });
            continue;
        }
        const html = fs.readFileSync(file, 'utf8');
        const ids = new Map();
        const references = [];
        const duplicateIds = [], missing = [], brokenFragments = [], brokenAria = [];
        walk(parse5.parse(html), node => {
            const attrs = Object.fromEntries((node.attrs || []).map(attr => [attr.name, attr.value]));
            if (attrs.id) { if (ids.has(attrs.id)) duplicateIds.push(attrs.id); ids.set(attrs.id, node); }
            references.push(attrs);
        });
        for (const attrs of references) {
            for (const attr of ['src', 'href', 'srcset']) {
                const values = attr === 'srcset' ? (attrs[attr] || '').split(',').map(s => s.trim().split(/\s/)[0]) : [attrs[attr]];
                for (const value of values.filter(Boolean)) {
                    if (/^(?:[a-z]+:|\/\/)/i.test(value) || value === '#') continue;
                    const [resource, hash] = value.split('#');
                    const target = resource ? path.resolve(path.dirname(file), decodeURIComponent(resource.split('?')[0])) : file;
                    if (!fs.existsSync(target)) missing.push(value);
                    else if (hash && target.endsWith('.html')) {
                        const targetHtml = target === file ? html : fs.readFileSync(target, 'utf8');
                        const fragment = decodeURIComponent(hash).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        if (!new RegExp(`\\bid\\s*=\\s*["']${fragment}["']`).test(targetHtml)) brokenFragments.push(value);
                    }
                }
            }
            for (const attr of ['aria-labelledby', 'aria-describedby', 'aria-controls', 'for']) {
                for (const id of (attrs[attr] || '').split(/\s+/).filter(Boolean)) {
                    if (!ids.has(id)) brokenAria.push({ attr, id });
                }
            }
        }
        output.static.push({ base: name, page, ids: ids.size, duplicateIds, missing, brokenFragments, brokenAria, unrendered: html.includes('{%') });
    }
}

(async () => {
    for (const engine of [chromium, webkit]) {
        const browser = await engine.launch(engine === chromium ? { channel: 'chrome' } : {});
        try {
            for (const base of ['http://127.0.0.1:5500', 'http://localhost:8000']) {
                const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
                let entry;
                page.on('pageerror', error => entry?.errors.push(error.message));
                page.on('response', response => {
                    if (response.status() >= 400) entry?.httpErrors.push({ url: response.url(), status: response.status() });
                });
                page.on('requestfailed', request => {
                    if (!request.failure()?.errorText.includes('ERR_ABORTED')) entry?.failed.push({ url: request.url(), failure: request.failure()?.errorText });
                });
                page.on('console', message => { if (message.type() === 'error') entry?.console.push(message.text()); });
                for (const name of pages) {
                    if (base.includes('5500') && !fs.existsSync(path.join(repo, 'pages', name))) continue;
                    entry = { engine: engine.name(), base, page: name, errors: [], httpErrors: [], failed: [], console: [] };
                    try {
                        entry.status = (await page.goto(base + '/pages/' + name)).status();
                        await page.evaluate(() => window.SiteUI?.ready);
                        await page.evaluate(() => document.fonts.ready);
                        await page.evaluate(async () => {
                            for (const image of document.images) image.loading = 'eager';
                            await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
                        });
                        entry.dom = await page.evaluate(() => ({
                            title: document.title,
                            brokenImages: [...document.images].filter(image => image.currentSrc && !image.naturalWidth).map(image => image.currentSrc),
                            uninitializedSliders: [...document.querySelectorAll('.swiper')].filter(slider => !slider.swiper).map(slider => slider.className),
                            duplicateIds: [...document.querySelectorAll('[id]')].map(el => el.id).filter((id, i, all) => all.indexOf(id) !== i)
                        }));
                    } catch (error) { entry.exception = error.message; }
                    output.browser.push(entry);
                    console.log(engine.name(), base, name, entry.exception ? 'FAILED' : 'checked');
                }
                await page.close();
            }
        } finally { await browser.close(); }
    }
    const target = path.join(os.tmpdir(), 'ystu-site-health-2026-10-27.json');
    fs.writeFileSync(target, JSON.stringify(output, null, 2));
    console.log('REPORT', target);
    console.log('SUMMARY', JSON.stringify({ static: output.static.filter(row => row.missing.length || row.duplicateIds.length || row.brokenFragments.length || row.brokenAria.length || row.unrendered), browser: output.browser.filter(row => row.exception || row.errors.length || row.httpErrors.length || row.failed.length || row.console.length || row.dom?.brokenImages.length || row.dom?.uninitializedSliders.length || row.dom?.duplicateIds.length) }));
})().catch(error => { console.error(error); process.exitCode = 1; });
