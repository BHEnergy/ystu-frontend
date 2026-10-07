const fs = require('node:fs');
const path = require('node:path');
const nunjucks = require('nunjucks');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'src');
const output = path.join(root, 'dist');
function listFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const file = path.join(directory, entry.name);
        return entry.isDirectory() ? listFiles(file) : [file];
    });
}

function build() {
    const env = new nunjucks.Environment(new nunjucks.FileSystemLoader([
        path.join(source, 'pages'), path.join(source, 'templates'),
    ], { noCache: true }), { autoescape: true, throwOnUndefined: true });
    // Ошибка шаблона не уничтожает предыдущую сборку.
    const pages = fs.readdirSync(path.join(source, 'pages')).filter(f => f.endsWith('.njk'));
    const pageData = JSON.parse(fs.readFileSync(path.join(source, 'data/pages.json'), 'utf8'));
    env.addGlobal('navigation', JSON.parse(fs.readFileSync(path.join(source, 'data/navigation.json'), 'utf8')));
    const rendered = pages.map(name => [name.replace(/\.njk$/, '.html'), env.render(name, pageData[name.replace(/\.njk$/, '')] || {})]);
    const templates = listFiles(source).filter(file => file.endsWith('.njk'));
    const inventory = fs.readdirSync(path.join(source, 'templates/components')).map(name => ({
        template: 'templates/components/' + name,
        usedBy: templates.filter(file => fs.readFileSync(file, 'utf8').includes('components/' + name))
            .map(file => path.relative(source, file).split(path.sep).join('/')),
    }));
    fs.writeFileSync(path.join(source, 'data/components.json'), JSON.stringify(inventory, null, 2) + '\n');
    if (fs.existsSync(output)) {
        if (fs.realpathSync(output).toLowerCase() !== output.toLowerCase()) throw new Error('Unsafe dist path');
        fs.rmSync(output, { recursive: true });
    }
    fs.mkdirSync(path.join(output, 'pages'), { recursive: true });
    for (const directory of ['styles', 'js', 'images', 'fonts']) {
        fs.cpSync(path.join(source, directory), path.join(output, directory), { recursive: true,
            filter: file => !file.split(path.sep).includes('check-in') });
    }
    fs.copyFileSync(path.join(source, 'index.html'), path.join(output, 'index.html'));
    for (const [name, html] of rendered) fs.writeFileSync(path.join(output, 'pages', name), html);
    console.log(`Сборка готова: ${rendered.length} страниц в dist/`);
}
if (require.main === module) build();
module.exports = build;
