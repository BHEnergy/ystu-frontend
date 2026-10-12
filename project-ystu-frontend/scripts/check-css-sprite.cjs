const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright-core');
const root = path.resolve(__dirname, '../..');
const manifest = require('../src/data/ui-sprite.json');
const blocks = css => [...css.matchAll(/([^{}]*)\{([^{}]*)\}/g)].map(match => ({ selector: match[1].trim(), body: match[2] }));
const referenceFile = path.resolve(__dirname, '../src/data/ui-css-reference.json');
const cases = [];
for (const file of (fs.existsSync(referenceFile) ? [] : fs.readdirSync(path.join(root, 'css/components'))).filter(name => name.endsWith('.css') && !/bootstrap|swiper|\.min\./.test(name))) {
    const current = fs.readFileSync(path.join(root, 'css/components', file), 'utf8');
    if (!current.includes('/* UI sprite:')) continue;
    assert(!/NaN|data:image|sprite\.svg#/.test(current));
    const previous = blocks(execFileSync('git', ['show', 'HEAD:css/components/' + file], { cwd: root, encoding: 'utf8' }));
    for (const block of blocks(current).filter(block => block.body.includes('/* UI sprite:'))) {
        const index = previous.findIndex(item => item.selector === block.selector && /url\(/.test(item.body));
        assert(index >= 0, block.selector);
        const before = previous.splice(index, 1)[0];
        const name = block.body.match(/UI sprite: ([\w-]+)/)[1];
        const icon = manifest.icons.find(icon => icon.name === name);
        const content = /content:\s*url\(/.test(before.body);
        // Проверяем именно фон, без текста, анимаций и родительской компоновки.
        const background = body => (body.match(/background(?:-[\w-]+)?\s*:[^;]+;/g) || []).join('\n');
        before.body = before.body.replace(/url\((?:"[^"]*"|'[^']*'|[^)]*)\)/g, `url('../../images/svg/${name}.svg')`);
        if (block.selector.includes('.campus-filter.is-selected')) before.body += 'background-size: 12px auto;';
        cases.push({ file, name, selector: block.selector, before: content ? `background: url('../../images/svg/${name}.svg') center no-repeat;` : background(before.body), after: background(block.body), width: content ? icon.width : Number(block.body.match(/(?:^|;)\s*(?:min-)?width\s*:\s*([\d.]+)px/)?.[1]) || 48, height: content ? icon.height : Number(block.body.match(/(?:^|;)\s*height\s*:\s*([\d.]+)px/)?.[1]) || 48 });
    }
}
if (process.argv.includes('--reference')) {
    process.stdout.write(JSON.stringify(cases, null, 2));
    process.exit(0);
}
if (fs.existsSync(referenceFile)) {
    const byFile = new Map();
    for (const item of JSON.parse(fs.readFileSync(referenceFile, 'utf8'))) {
        if (!byFile.has(item.file)) byFile.set(item.file, blocks(fs.readFileSync(path.join(root, 'css/components', item.file), 'utf8')));
        const candidates = byFile.get(item.file);
        const index = candidates.findIndex(block => block.selector === item.selector && block.body.includes(`UI sprite: ${item.name} */`));
        assert(index >= 0, item.selector);
        item.after = (candidates.splice(index, 1)[0].body.match(/background(?:-[\w-]+)?\s*:[^;]+;/g) || []).join('\n');
        assert(!/NaN|data:image|sprite\.svg#/.test(item.after));
        cases.push(item);
    }
}

(async () => {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
        await page.route('**/*', route => {
            const url = new URL(route.request().url());
            if (url.hostname !== 'ystu.test') return route.abort();
            if (url.pathname === '/css/components/probe.html') return route.fulfill({ contentType: 'text/html', body: '<html><body></body></html>' });
            const file = path.resolve(root, '.' + url.pathname);
            return fs.existsSync(file) ? route.fulfill({ body: fs.readFileSync(file), contentType: 'image/svg+xml' }) : route.abort();
        });
        await page.goto('http://ystu.test/css/components/probe.html');
        const result = await page.evaluate(async cases => {
            const render = async (css, width, height) => {
                const element = document.createElement('div');
                element.style.cssText = css;
                const url = element.style.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/)?.[1];
                if (!url) throw new Error('Missing image ' + css);
                const image = new Image(); image.src = url;
                try { await image.decode(); } catch (error) { throw new Error('Cannot decode ' + image.src.slice(0, 120)); }
                const size = element.style.backgroundSize.split(/\s+/);
                const length = (value, box, fallback) => !value || value === 'auto' ? fallback : value.endsWith('%') ? parseFloat(value) * box / 100 : parseFloat(value);
                let w = image.naturalWidth, h = image.naturalHeight;
                if (size[0] === 'contain') { const scale = Math.min(width / w, height / h); w *= scale; h *= scale; }
                else if (size[0] && size[0] !== 'initial') { w = length(size[0], width, w); h = !size[1] || size[1] === 'auto' ? image.naturalHeight * w / image.naturalWidth : length(size[1], height, h); }
                const position = element.style.backgroundPosition;
                const coordinates = position.match(/calc\([^)]*\)|[^\s]+/g) || ['0%', '0%'];
                const offset = (value, available) => {
                    if (value.startsWith('calc')) return available / 2 + Number((value.match(/([+-]\s*[\d.]+)px/)?.[1] || '0').replace(/\s/g, ''));
                    if (value === 'center') return available / 2;
                    return value.endsWith('%') ? parseFloat(value) * available / 100 : parseFloat(value) || 0;
                };
                const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
                const context = canvas.getContext('2d');
                context.drawImage(image, offset(coordinates[0], width - w), offset(coordinates[1] || '50%', height - h), w, h);
                const pixels = [...context.getImageData(0, 0, width, height).data];
                if (!pixels.some((n, i) => i % 4 === 3 && n > 0)) throw new Error(JSON.stringify({ url, size, w, h, position, coordinates, width, height }));
                return pixels;
            };
            const out = [];
            for (const item of cases) {
                const a = await render(item.before, item.width, item.height), b = await render(item.after, item.width, item.height);
                const alpha = pixels => pixels.filter((value, index) => index % 4 === 3).reduce((sum, value) => sum + value, 0);
                const aMass = alpha(a), bMass = alpha(b);
                out.push({ name: item.name, selector: item.selector, ratio: bMass / aMass, visible: bMass > 0, aMass, bMass, before: item.before });
            }
            return out;
        }, cases);
        for (const item of result) assert(item.visible && item.ratio > .8 && item.ratio < 1.2, JSON.stringify(item));
        console.log(`CSS sprite: ${result.length} подключений отрисованы, размеры/площадь иконок сохранены`);
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
