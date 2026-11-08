const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('parse5');
const repo = path.resolve(__dirname, '../..');
const inventory = new Map();
for (const file of fs.readdirSync(path.join(repo, 'pages')).filter(file => file.endsWith('.html'))) {
    function visit(node, ancestors = []) {
        const attrs = Object.fromEntries((node.attrs || []).map(attr => [attr.name, attr.value]));
        if (['a', 'button', 'summary'].includes(node.tagName)) {
            const key = node.tagName + '.' + (attrs.class || '(no class)') + (attrs.class ? '' : ' in ' + ancestors.slice(-2).join(' > '));
            if (!inventory.has(key)) inventory.set(key, new Set());
            inventory.get(key).add(file);
        }
        for (const child of node.childNodes || []) visit(child, node.tagName ? [...ancestors, node.tagName + (attrs.class ? '.' + attrs.class : '')] : ancestors);
    }
    visit(parse(fs.readFileSync(path.join(repo, 'pages', file), 'utf8')));
}
for (const [element, pages] of inventory) console.log(element + ' | ' + [...pages].join(', '));
