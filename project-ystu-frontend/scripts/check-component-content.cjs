const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { parse } = require('parse5');
const project = path.resolve(__dirname, '..');
const output = path.join(project, 'test-results-components');
const baseline = path.join(output, 'content-before.json');
function snapshot() {
    const result = {};
    for (const [label, root] of [['legacy', path.dirname(project)], ['dist', path.join(project, 'dist')]]) {
        for (const name of fs.readdirSync(path.join(root, 'pages')).filter(file => file.endsWith('.html'))) {
            const text = [], links = [], controls = [];
            function visit(node) {
                const attrs = Object.fromEntries((node.attrs || []).map(attr => [attr.name, attr.value]));
                if (node.nodeName === '#text' && node.value.trim()) text.push(node.value.replace(/\s+/g, ' ').trim());
                if (node.tagName === 'a') links.push(attrs.href || '');
                if (['input', 'select', 'textarea', 'button'].includes(node.tagName)) controls.push([node.tagName, attrs.type || '', attrs.name || '', attrs.value || '', attrs['data-ui'] || '']);
                for (const child of node.childNodes || []) visit(child);
            }
            visit(parse(fs.readFileSync(path.join(root, 'pages', name), 'utf8')));
            result[label + '/' + name] = { text, links, controls };
        }
    }
    return result;
}
if (process.argv.includes('--record')) {
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(baseline, JSON.stringify(snapshot(), null, 2));
    console.log('Content baseline recorded');
} else {
    const before = JSON.parse(fs.readFileSync(baseline, 'utf8'));
    // В UI-kit обновлены только технические подписи классов.
    const migration = JSON.parse(fs.readFileSync(path.join(project, 'src/data/component-contracts.json'), 'utf8')).migration;
    for (const value of Object.values(before)) value.text = value.text.map(text => {
        for (const [old, name] of Object.entries(migration)) text = text.replace(new RegExp('\\.' + old + '(?=__|--|[^\\w-]|$)', 'g'), '.' + name);
        return text;
    });
    const after = snapshot();
    for (const file of Object.keys(before)) assert.deepEqual(after[file], before[file], 'Content changed: ' + file);
    console.log('OK: all page texts, links and form contracts preserved');
}
