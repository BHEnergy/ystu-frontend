// Обновляет цвета значка вкладки, сохраняя форму и альфа-канал.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const project = path.resolve(__dirname, '..');
const repo = path.dirname(project);

(async () => {
    const icons = [];
    for (const size of [16, 32]) {
        const file = `favicon-${size}x${size}.png`;
        const { data, info } = await sharp(path.join(project, 'src/favicon', file))
            .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] && data[i + 2] > data[i]) {
                data[i] = 6; data[i + 1] = 43; data[i + 2] = 89; // #062B59
            } else if (data[i + 3] && data[i] > data[i + 2]) {
                data[i] = 229; data[i + 1] = 87; data[i + 2] = 0; // #E55700
            }
        }
        const png = await sharp(data, { raw: info }).png().toBuffer();
        for (const directory of [path.join(repo, 'favicon'), path.join(project, 'src/favicon')]) {
            fs.writeFileSync(path.join(directory, file), png);
        }
        icons.push({ size, png });
    }
    const header = Buffer.alloc(6 + icons.length * 16);
    header.writeUInt16LE(1, 2); header.writeUInt16LE(icons.length, 4);
    let offset = header.length;
    icons.forEach(({ size, png }, i) => {
        const position = 6 + i * 16;
        header[position] = header[position + 1] = size;
        header.writeUInt16LE(1, position + 4); header.writeUInt16LE(32, position + 6);
        header.writeUInt32LE(png.length, position + 8); header.writeUInt32LE(offset, position + 12);
        offset += png.length;
    });
    const ico = Buffer.concat([header, ...icons.map(icon => icon.png)]);
    for (const directory of [path.join(repo, 'favicon'), path.join(project, 'src/favicon')]) {
        fs.writeFileSync(path.join(directory, 'favicon.ico'), ico);
    }
    console.log('Tab favicons: blue #062B59, orange #E55700; alpha preserved; ICO 16/32 px.');
})().catch(error => { console.error(error); process.exitCode = 1; });
