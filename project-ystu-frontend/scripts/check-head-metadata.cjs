const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const parse5 = require('parse5');
const sharp = require('sharp');
const project = path.resolve(__dirname, '..');
const repo = path.dirname(project);
const seo = JSON.parse(fs.readFileSync(path.join(project, 'src/data/seo.json'), 'utf8'));
const walk = (n, fn) => { fn(n); (n.childNodes || []).forEach(c => walk(c, fn)); };

(async () => {
    let count = 0;
    for (const root of [repo, path.join(project, 'dist')]) {
        const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
        for (const icon of manifest.icons) assert(fs.existsSync(path.resolve(root, icon.src)), icon.src);
        for (const file of fs.readdirSync(path.join(root, 'pages')).filter(f => f.endsWith('.html'))) {
            const full = path.join(root, 'pages', file);
            const html = fs.readFileSync(full, 'utf8');
            const expected = seo.pages[file.replace('.html', '')];
            const metas = new Map();
            let title, scope;
            walk(parse5.parse(html), node => {
                const a = Object.fromEntries((node.attrs || []).map(a => [a.name, a.value]));
                if (node.tagName === 'html') scope = a.itemtype;
                if (node.tagName === 'title') title = node.childNodes.map(n => n.value || '').join('');
                if (node.tagName === 'meta') {
                    const key = a.property || a.name || (a.itemprop && 'item:' + a.itemprop);
                    if (key) { assert(!metas.has(key), file + ': duplicate ' + key); metas.set(key, a.content); }
                }
                if (node.tagName === 'link' && ['icon', 'shortcut icon', 'apple-touch-icon', 'mask-icon', 'manifest'].includes(a.rel)) {
                    assert(fs.existsSync(path.resolve(path.dirname(full), a.href.split(/[?#]/)[0])), file + ': ' + a.href);
                }
            });
            assert.equal(scope, 'https://schema.org/WebPage');
            assert.equal(title, expected.title);
            for (const key of ['og:title', 'twitter:title', 'item:name']) assert.equal(metas.get(key), title);
            for (const key of ['description', 'og:description', 'twitter:description', 'item:description']) assert.equal(metas.get(key), expected.description);
            for (const key of ['og:url', 'twitter:url', 'item:url']) assert.equal(metas.get(key), new URL('pages/' + file, seo.siteUrl).href);
            for (const key of ['og:image', 'twitter:image', 'item:image']) assert.equal(metas.get(key), new URL(expected.image || seo.image, seo.siteUrl).href);
            assert(fs.existsSync(path.resolve(root, expected.image || seo.image)));
            assert(!html.slice(0, html.indexOf('</head>')).includes('[%'));
            assert(fs.existsSync(path.resolve(path.dirname(full), metas.get('msapplication-config'))));
            count++;
        }
        const xml = fs.readFileSync(path.join(root, 'browserconfig.xml'), 'utf8');
        for (const [, src] of xml.matchAll(/src="([^"]+)"/g)) assert(fs.existsSync(path.resolve(root, src)), src);
    }
    let icons = 0;
    for (const file of fs.readdirSync(path.join(repo, 'favicon')).filter(f => f.endsWith('.png'))) {
        const size = file.match(/(\d+)x(\d+)/);
        const info = await sharp(path.join(repo, 'favicon', file)).metadata();
        const expected = size ? [Number(size[1]), Number(size[2])] : [180, 180];
        assert.deepEqual([info.width, info.height], expected, file);
        for (const dir of ['src', 'dist']) assert(fs.readFileSync(path.join(repo, 'favicon', file)).equals(fs.readFileSync(path.join(project, dir, 'favicon', file))), dir + ': ' + file);
        icons++;
    }
    console.log(`Head metadata OK: ${count} pages; ${icons} PNG icons, manifest and Windows tiles checked.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
