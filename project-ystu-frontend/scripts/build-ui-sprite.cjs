// Один ресурс: symbol для HTML и пространственный атлас для CSS без SVG-фрагментов.
const fs = require('node:fs'), path = require('node:path');
const directory = path.resolve(__dirname, '../src/images/svg');
const manifest = require('../src/data/ui-sprite.json');
const symbols = [], layers = [];
for (const icon of manifest.icons) {
    const svg = fs.readFileSync(path.join(directory, icon.name + '.svg'), 'utf8');
    const fill = svg.match(/<svg[^>]*\bfill="([^"]+)"/)?.[1] || 'black';
    const body = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
    const scoped = prefix => body.replace(/\bid="([^"]+)"/g, (_, id) => `id="${prefix}-${id}"`)
        .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${prefix}-${id})`)
        .replace(/(href|xlink:href)="#([^"]+)"/g, (_, attr, id) => `${attr}="#${prefix}-${id}"`);
    symbols.push(`<symbol id="${icon.name}" viewBox="${icon.viewBox}" fill="${fill}">${scoped(icon.name)}</symbol>`);
    const [minX, minY, viewWidth, viewHeight] = icon.viewBox.split(/\s+/).map(Number);
    const scaleX = icon.width / viewWidth, scaleY = icon.height / viewHeight;
    const x = icon.center - icon.width / 2 - minX * scaleX;
    const y = icon.centerY - icon.height / 2 - minY * scaleY;
    layers.push(`<g transform="translate(${x} ${y}) scale(${scaleX} ${scaleY})" fill="${fill}">${scoped(icon.name + '-css')}</g>`);
}
const output = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${manifest.width}" height="${manifest.height}" viewBox="0 0 ${manifest.width} ${manifest.height}" preserveAspectRatio="none"><defs>${symbols.join('')}</defs>${layers.join('')}</svg>\n`;
fs.writeFileSync(path.join(directory, 'sprite.svg'), output);
console.log(`UI sprite: ${manifest.icons.length} символов и CSS-ячеек`);
