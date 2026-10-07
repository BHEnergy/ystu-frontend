const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const parse5 = require('parse5');
const { execFileSync } = require('node:child_process');
const build = require('./build.cjs');
const root = path.resolve(__dirname, '..');
const walk = (node, fn) => { fn(node); (node.childNodes || []).forEach(n => walk(n, fn)); };
build();
let references = 0;
const files = fs.readdirSync(path.join(root, 'dist/pages')).filter(f => f.endsWith('.html'));
for (const name of fs.readdirSync(path.join(root, 'src/pages'))) {
    const template = fs.readFileSync(path.join(root, 'src/pages', name), 'utf8');
    assert(!/<header\s+class\s*=\s*["']header["']/.test(template), name + ': inline shared header');
    assert(!/<footer\s+class\s*=\s*["']footer["']/.test(template), name + ': inline shared footer');
}
for (const file of files) {
    const full = path.join(root, 'dist/pages', file);
    const html = fs.readFileSync(full, 'utf8');
    assert(!html.includes('{%'), 'Unrendered template: ' + file);
    let headers = 0, footers = 0;
    walk(parse5.parse(html), n => {
        const attrs = Object.fromEntries((n.attrs || []).map(a => [a.name, a.value]));
        if (n.tagName === 'header' && attrs.class?.split(/\s+/).includes('header')) headers++;
        if (n.tagName === 'footer' && attrs.class?.split(/\s+/).includes('footer')) footers++;
        for (const key of ['src', 'href']) {
            const link = attrs[key];
            if (!link || /^(?:[a-z]+:|\/\/|#)/i.test(link)) continue;
            const target = decodeURIComponent(link.split(/[?#]/)[0]);
            if (!target) continue;
            assert(fs.existsSync(path.resolve(path.dirname(full), target)), `${file}: missing ${link}`);
            references++;
        }
    });
    if (file !== 'map-test.html') {
        assert.equal(headers, 1, file + ': header count');
        assert.equal(footers, 1, file + ': footer count');
    }
}
function checkAssets(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) { checkAssets(file); continue; }
        if (file.endsWith('.js')) execFileSync(process.execPath, ['--check', file]);
        if (!file.endsWith('.css')) continue;
        const css = fs.readFileSync(file, 'utf8');
        const links = [...css.matchAll(/url\(\s*["']?([^\s)"']+)["']?\s*\)/g), ...css.matchAll(/@import\s+["']([^"']+)["']/g)];
        for (const match of links) {
            const link = match[1];
            if (/^(?:[a-z]+:|\/\/|#)/i.test(link)) continue;
            const target = decodeURIComponent(link.split(/[?#]/)[0]);
            assert(fs.existsSync(path.resolve(path.dirname(file), target)), `${file}: missing ${link}`);
            references++;
        }
    }
}
checkAssets(path.join(root, 'dist/styles'));
checkAssets(path.join(root, 'dist/js'));
console.log(`Проверено ${files.length} страниц, ${references} локальных ссылок.`);
