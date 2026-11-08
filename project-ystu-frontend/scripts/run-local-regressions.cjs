// Запускает существующие браузерные тесты без внешних сервисов и отдельных серверов.
const fs = require('node:fs'), path = require('node:path');
const { chromium, webkit } = require('playwright-core');
const project = path.resolve(__dirname, '..'), repo = path.dirname(project);
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const route = async page => page.route('**/*', request => {
    const url = new URL(request.request().url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return request.abort();
    const root = url.port === '5500' ? repo : path.join(project, 'dist');
    const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return request.fulfill({ status: 404, body: '' });
    return request.fulfill({ body: fs.readFileSync(file), contentType: types[path.extname(file)] || 'application/octet-stream' });
});
for (const engine of [chromium, webkit]) {
    const launch = engine.launch.bind(engine);
    engine.launch = async options => {
        const browser = await launch({ ...options, headless: true, ...(engine === chromium ? { channel: 'chromium' } : {}) });
        const newPage = browser.newPage.bind(browser);
        browser.newPage = async options => { const page = await newPage(options); await route(page); return page; };
        const newContext = browser.newContext.bind(browser);
        browser.newContext = async options => {
            const context = await newContext(options), original = context.newPage.bind(context);
            context.newPage = async () => { const page = await original(); await route(page); return page; };
            return context;
        };
        return browser;
    };
}
const name = process.argv[2];
if (!name || path.basename(name) !== name || !name.endsWith('.cjs')) throw Error('Укажите имя теста из scripts/');
process.argv.splice(2, 1);
require(path.join(__dirname, name));
