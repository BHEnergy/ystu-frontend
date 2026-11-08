const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { parse } = require('parse5');
const { execFileSync } = require('node:child_process');
const project = path.resolve(__dirname, '..'), repo = path.dirname(project), source = path.join(project, 'src');
const registry = JSON.parse(fs.readFileSync(path.join(source, 'data/component-contracts.json'), 'utf8'));
for (const file of ['css/components/footer.css', 'project-ystu-frontend/src/styles/layout/footer.css', 'project-ystu-frontend/src/templates/components/footer.njk']) {
    const before = execFileSync('git', ['show', 'HEAD:' + file], { cwd: repo, encoding: 'utf8' });
    assert.equal(fs.readFileSync(path.join(repo, file), 'utf8').replaceAll('\r', ''), before.replaceAll('\r', ''), 'Protected footer changed');
}
function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]); }
function checkCss(file) {
    const css = fs.readFileSync(file, 'utf8');
    let level = 0, quote = '', comment = false;
    for (let i = 0; i < css.length; i++) {
        const c = css[i], next = css[i + 1];
        if (comment) { if (c === '*' && next === '/') { comment = false; i++; } continue; }
        if (quote) { if (c === '\\') i++; else if (c === quote) quote = ''; continue; }
        if (c === '/' && next === '*') { comment = true; i++; continue; }
        if (c === '"' || c === "'") { quote = c; continue; }
        if (c === '{') level++;
        if (c === '}') { level--; assert(level >= 0, 'Unbalanced CSS: ' + file); }
    }
    assert.equal(level, 0, 'Unclosed rule: ' + file);
    assert(!comment && !quote, 'Unclosed CSS comment/string: ' + file);
}
for (const component of registry.components) {
    assert(fs.existsSync(path.join(source, component.css)), component.name + ': missing owned CSS');
    if (component.template) assert(fs.existsSync(path.join(source, component.template)), component.name + ': missing renderer');
}
for (const file of [...walk(path.join(repo, 'css/components')), ...walk(path.join(source, 'styles'))].filter(f => f.endsWith('.css') && !/bootstrap|swiper-bundle/.test(f))) checkCss(file);
const oldNames = Object.keys(registry.migration);
function inspect(node, file) {
    const attrs = Object.fromEntries((node.attrs || []).map(a => [a.name, a.value]));
    const classes = (attrs.class || '').split(/\s+/);
    for (const cls of classes) assert(!oldNames.some(old => cls === old || cls.startsWith(old + '__') || cls.startsWith(old + '--')), 'Legacy page-specific class ' + cls + ': ' + file);
    if (classes.includes('contact-list__item')) {
        const parentClass = (node.parentNode?.attrs || []).find(a => a.name === 'class')?.value || '';
        assert(/contact-card|person-card__contacts/.test(parentClass), 'Contact group attached to wrong element: ' + file);
    }
    for (const child of node.childNodes || []) inspect(child, file);
}
for (const root of [path.join(repo, 'pages'), path.join(project, 'dist/pages')]) for (const file of walk(root).filter(f => f.endsWith('.html'))) inspect(parse(fs.readFileSync(file, 'utf8')), file);
const owners = {
    'program-card': 'program-card.njk', 'vacancy-card': 'vacancy-card.njk', 'news__card': 'news-card.njk', 'event__card': 'event-card.njk',
    'feature-section': 'feature-section.njk', 'training-program-card': 'training-program-card.njk', 'department-card': 'department-card.njk',
    'person-card': 'person-card.njk', 'contact-card': 'contact-card.njk', 'contact-section': 'contact-section.njk',
    'journal-card__section': 'journal-card.njk', 'metric-card': 'metric-card.njk',
    'flagship-project__card': 'flagship-card.njk', 'ficher': 'ficher.njk',
};
for (const file of [...walk(path.join(source, 'pages')), ...walk(path.join(source, 'templates'))].filter(f => f.endsWith('.njk'))) {
    const text = fs.readFileSync(file, 'utf8');
    for (const [, classes] of text.matchAll(/\bclass\s*=\s*"([^"]*)"/g)) for (const cls of classes.split(/\s+/)) {
        if (owners[cls]) assert.equal(path.basename(file), owners[cls], 'Repeated markup must use shared renderer: ' + file);
    }
}
for (const group of ['programCards', 'features', 'contacts', 'journals', 'filters', 'metrics', 'news', 'events', 'vacancies', 'departments', 'people', 'training', 'linkCards', 'projects', 'teasers']) {
    assert(Object.keys(JSON.parse(fs.readFileSync(path.join(source, 'data/component-examples.json'), 'utf8'))[group]).length > 0, 'Missing demo data: ' + group);
}
console.log('OK: ' + registry.components.length + ' component contracts; CSS structure, new BEM classes and single renderer ownership');
