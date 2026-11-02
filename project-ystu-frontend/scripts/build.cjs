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
    require('node:child_process').execFileSync(process.execPath, [path.join(__dirname, 'build-ui-sprite.cjs')], { stdio: 'inherit' });
    const env = new nunjucks.Environment(new nunjucks.FileSystemLoader([
        path.join(source, 'pages'), path.join(source, 'templates'),
    ], { noCache: true }), { autoescape: true, throwOnUndefined: true });
    // Ошибка шаблона не уничтожает предыдущую сборку.
    const pages = fs.readdirSync(path.join(source, 'pages')).filter(f => f.endsWith('.njk'));
    const pageData = JSON.parse(fs.readFileSync(path.join(source, 'data/pages.json'), 'utf8'));
    const seo = JSON.parse(fs.readFileSync(path.join(source, 'data/seo.json'), 'utf8'));
    env.addGlobal('navigation', JSON.parse(fs.readFileSync(path.join(source, 'data/navigation.json'), 'utf8')));
    const rendered = pages.map(name => {
        const key = name.replace(/\.njk$/, '');
        const page = seo.pages[key];
        if (!page) throw new Error('Missing page metadata: ' + key);
        const metadata = { ...seo, ...page, url: new URL('pages/' + key + '.html', seo.siteUrl).href,
            image: new URL(page.image || seo.image, seo.siteUrl).href };
        const html = env.render(name, { ...pageData[key], metadata })
            .replace(/<head\b[^>]*>[\s\S]*?<\/head>/, head => head.replace(/[ \t]+(?=\r?$)/gm, ''));
        return [key + '.html', html.replace(/<title>[\s\S]*?<\/title>/, '<title>' + nunjucks.lib.escape(metadata.title) + '</title>')];
    });
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
    for (const directory of ['styles', 'js', 'images', 'fonts', 'favicon']) {
        fs.cpSync(path.join(source, directory), path.join(output, directory), { recursive: true,
            filter: file => !file.split(path.sep).includes('check-in') });
    }
    const homeMetadata = { ...seo, ...seo.pages.index,
        url: new URL('pages/index.html', seo.siteUrl).href,
        image: new URL(seo.pages.index.image || seo.image, seo.siteUrl).href };
    fs.writeFileSync(path.join(output, 'index.html'), env.renderString(
        fs.readFileSync(path.join(source, 'index.html'), 'utf8'), { metadata: homeMetadata, assetPrefix: '' })
        .replace(/<head\b[^>]*>[\s\S]*?<\/head>/, head => head.replace(/[ \t]+(?=\r?$)/gm, '')));
    for (const name of ['manifest.json', 'browserconfig.xml']) fs.copyFileSync(path.join(source, name), path.join(output, name));
    for (const [name, html] of rendered) fs.writeFileSync(path.join(output, 'pages', name), require('./media.cjs').enhanceImages(html));
    console.log(`Сборка готова: ${rendered.length} страниц в dist/`);
}
if (require.main === module) build();
module.exports = build;
