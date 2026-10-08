// Явная синхронизация проверенной сборки в основную статическую версию проекта.
// Не вызывается автоматически при build: запускать только при согласованном переносе.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const legacy = path.dirname(root);
const source = path.join(root, 'src');
const normalize = s => s.replace(/\r\n/g, '\n').replace(/[\t ]+$/gm, '').trimEnd();
const changes = [];
function write(relative, contents) {
    const target = path.join(legacy, relative);
    const previous = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
    if (previous !== null && normalize(previous) === normalize(contents)) return;
    fs.writeFileSync(target, normalize(contents) + '\n');
    changes.push(relative);
}
function files(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const file = path.join(directory, entry.name);
        return entry.isDirectory() ? files(file) : [file];
    });
}
if (!fs.existsSync(path.join(legacy, 'pages/index.html')) || !fs.existsSync(path.join(legacy, 'css/components/header.css'))) {
    throw new Error('Не найдена основная версия проекта рядом с компонентной');
}
require('./build.cjs')();
if (fs.existsSync(path.join(source, 'images/webp'))) {
    fs.cpSync(path.join(source, 'images/webp'), path.join(legacy, 'images/webp'), {recursive:true});
}
for (const file of files(path.join(source, 'styles'))) {
    if (!file.endsWith('.css') || ['styles.css', 'global.css'].includes(path.basename(file))) continue;
    write('css/components/' + path.basename(file), fs.readFileSync(file, 'utf8'));
}
const entry = fs.readFileSync(path.join(legacy, 'css/styles.css'), 'utf8');
const marker = entry.indexOf('/* Подключение шрифта */');
if (marker < 0) throw new Error('Не найден блок базовых стилей');
const global = fs.readFileSync(path.join(source, 'styles/base/global.css'), 'utf8').replaceAll('../../fonts/', '../fonts/');
write('css/styles.css', entry.slice(0, marker) + global);
for (const file of files(path.join(source, 'js'))) {
    write(path.relative(source, file), fs.readFileSync(file, 'utf8'));
}
for (const file of fs.readdirSync(path.join(root, 'dist/pages')).filter(f => f.endsWith('.html'))) {
    // Не восстанавливаем страницы, удалённые пользователем из основной версии.
    if (!fs.existsSync(path.join(legacy, 'pages', file))) continue;
    let html = fs.readFileSync(path.join(root, 'dist/pages', file), 'utf8');
    html = html.replaceAll('../styles/base/main.css', '../css/components/main.css').replaceAll('../styles/', '../css/');
    write('pages/' + file, html);
}
console.log('Обновлены файлы основной версии:\n' + changes.join('\n'));
