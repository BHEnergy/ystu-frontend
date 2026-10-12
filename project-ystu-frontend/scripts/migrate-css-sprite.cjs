// Одноразовая миграция авторских CSS. Выводит patch; файлы не перезаписывает.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const svgDir = path.join(root, 'images/svg');
const normalize = value => value.replace(/\s+/g, '');
const assets = new Map(fs.readdirSync(svgDir).filter(name => name.endsWith('.svg') && name !== 'sprite.svg')
    .map(name => [name.slice(0, -4), fs.readFileSync(path.join(svgDir, name), 'utf8')]));
const excluded = /^(?:adv-|sd-|line-|ficher-line|ystu|big-ystu|preparatory-|modal-vector|event-modal-line|modal-success-line)/;
const resolveIcon = url => {
    if (url.startsWith('data:image/svg+xml,')) {
        const decoded = normalize(decodeURIComponent(url.slice('data:image/svg+xml,'.length)));
        const match = [...assets].find(([, svg]) => normalize(svg) === decoded);
        if (!match) throw new Error('Не найден исходник встроенной CSS-иконки');
        return match[0];
    }
    const name = path.basename(url, '.svg');
    return url.endsWith('.svg') && assets.has(name) && !excluded.test(name) ? name : null;
};
const roots = ['css/components', 'project-ystu-frontend/src/styles/components', 'project-ystu-frontend/src/styles/pages', 'project-ystu-frontend/src/styles/layout'];
const files = roots.flatMap(dir => fs.readdirSync(path.join(root, dir)).filter(name => name.endsWith('.css') && !/bootstrap|swiper|\.min\./.test(name)).map(name => path.join(dir, name)));
const existing = fs.readFileSync(path.join(svgDir, 'sprite.svg'), 'utf8');
const names = new Set([...existing.matchAll(/<symbol\b[^>]*\bid="([^"]+)"/g)].map(match => match[1]));
const urlPattern = /url\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/g;
for (const file of files) {
    for (const match of fs.readFileSync(path.join(root, file), 'utf8').matchAll(urlPattern)) {
        const name = resolveIcon(match[1] || match[2] || match[3]);
        if (name) names.add(name);
    }
}
const icons = [...names].sort();
const cell = 128;
const width = 512;
const height = Math.ceil(icons.length / 4) * cell;
const manifest = icons.map((name, index) => {
    const svg = assets.get(name);
    const tag = svg.match(/<svg\b[^>]*>/)[0];
    const viewBox = tag.match(/viewBox="([^"]+)"/)[1];
    const values = viewBox.split(/\s+/).map(Number);
    const w = Number(tag.match(/\bwidth="([\d.]+)"/)?.[1]) || values[2];
    const h = Number(tag.match(/\bheight="([\d.]+)"/)?.[1]) || values[3];
    return { name, width: w, height: h, center: index % 4 * cell + cell / 2, centerY: Math.floor(index / 4) * cell + cell / 2, viewBox };
});
const patchFile = (file, old, text) => {
    if (old === text) return '';
    if (old == null) return `*** Add File: ${file}\n${text.trimEnd().split(/\r?\n/).map(line => '+' + line).join('\n')}\n`;
    return `*** Update File: ${file}\n@@\n${old.trimEnd().split(/\r?\n/).map(line => '-' + line).join('\n')}\n${text.trimEnd().split(/\r?\n/).map(line => '+' + line).join('\n')}\n`;
};
const round = n => Number(n.toFixed(6));
let patch = '*** Begin Patch\n';
for (const file of files) {
    if (process.argv[2] && process.argv[2] !== file.replace(/\\/g, '/')) continue;
    const old = fs.readFileSync(path.join(root, file), 'utf8');
    const source = process.argv.includes('--baseline')
        ? require('node:child_process').execFileSync('git', ['show', 'HEAD:' + file.replace(/\\/g, '/')], { cwd: root, encoding: 'utf8' })
        : old;
    const text = source.replace(/([^{}]*)\{([^{}]*)\}/g, (block, selector, declarations) => {
        const found = [...declarations.matchAll(urlPattern)].map(match => ({ match, name: resolveIcon(match[1] || match[2] || match[3]) })).filter(item => item.name);
        if (!found.length) return block;
        if (found.length !== 1) throw new Error(`Несколько иконок в одном правиле: ${file} ${selector}`);
        const { name } = found[0];
        const icon = manifest.find(item => item.name === name);
        const declaration = declarations.match(/(?:^|;)\s*(background(?:-image)?|content)\s*:\s*([^;]*url\([^;]*);/);
        if (!declaration) throw new Error(`Неподдерживаемое подключение: ${file} ${selector}`);
        const property = declaration[1];
        const sizing = declaration[2].replace(urlPattern, '').match(/\/\s*([^;]+?)(?:\s+no-repeat)?$/)?.[1]
            || declarations.match(/background-size\s*:\s*([^;]+)/)?.[1];
        const boxW = Number(declarations.match(/(?:^|;)\s*(?:min-)?width\s*:\s*([\d.]+)px/)?.[1]) || icon.width;
        const boxH = Number(declarations.match(/(?:^|;)\s*height\s*:\s*([\d.]+)px/)?.[1]) || icon.height;
        let sx = 1, sy = 1;
        if (sizing?.trim() === 'contain') sx = sy = Math.min(boxW / icon.width, boxH / icon.height);
        else if (sizing) {
            const values = sizing.trim().split(/\s+/);
            const length = (value, box, natural) => value.endsWith('%') ? box * parseFloat(value) / 100 : value === 'auto' ? natural : parseFloat(value);
            sx = length(values[0], boxW, icon.width) / icon.width;
            sy = values[1] && values[1] !== 'auto' ? length(values[1], boxH, icon.height) / icon.height : sx;
        }
        // Этот override прежде наследовал от стрелки background-size:12px.
        if (selector.includes('.campus-filter.is-selected')) sx = sy = 12 / icon.width;
        if (!Number.isFinite(sx) || !Number.isFinite(sy)) throw new Error(`Некорректный размер: ${file} ${selector}`);
        const offset = round((width / 2 - icon.center) * sx);
        let next = declarations.replace(declaration[0], (whole) => {
            const prefix = whole.startsWith(';') ? ';' : '';
            const content = property === 'content' ? `content: ''; display: inline-block; width: ${icon.width}px; height: ${icon.height}px;` : '';
            return `${prefix}\n    ${content}\n    /* UI sprite: ${name} */\n    background-image: url('../../images/svg/sprite.svg');\n    background-size: ${round(width * sx)}px ${round(height * sy)}px;\n    background-position: calc(50% + ${offset}px) calc(50% + ${round((height / 2 - icon.centerY) * sy)}px);\n    background-repeat: no-repeat;`;
        });
        // Старые longhand не должны перезаписывать координаты атласа.
        const marker = next.indexOf('/* UI sprite:');
        const before = next.slice(0, marker).replace(/background-(?:position|repeat|size)\s*:[^;]*;/g, '');
        const after = next.slice(marker).replace(/(background-(?:position|repeat|size)\s*:[^;]*;)([\s\S]*)/, '$1$2');
        const parts = after.split('background-repeat: no-repeat;');
        next = before + parts[0] + 'background-repeat: no-repeat;' + parts.slice(1).join('background-repeat: no-repeat;').replace(/background-(?:position|repeat|size)\s*:[^;]*;/g, '');
        return `${selector}{${next}}`;
    });
    if (!process.argv[2] || process.argv[2] === file.replace(/\\/g, '/')) patch += patchFile(file.replace(/\\/g, '/'), old, text);
}
const dataFile = 'project-ystu-frontend/src/data/ui-sprite.json';
if (!process.argv[2] || process.argv[2] === '--manifest') patch += patchFile(dataFile, fs.existsSync(path.join(root, dataFile)) ? fs.readFileSync(path.join(root, dataFile), 'utf8') : null, JSON.stringify({ cell, width, height, icons: manifest }, null, 2) + '\n');
patch += '*** End Patch';
process.stdout.write(patch);
