const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'src/data/media.json');
const webpUrl = url => url.replace('/fallback/', '/webp/').replace(/\.(png|jpe?g)$/i, '.webp');
function enhanceImages(html) {
    if (!fs.existsSync(manifestPath)) return html;
    const media = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return html.replace(/<img\b[^>]*>/g, tag => {
        const src = tag.match(/\bsrc\s*=\s*"([^"]+)"/)?.[1];
        const info = src && media[src];
        if (!info) return tag;
        if (!/\bwidth\s*=/.test(tag)) tag = tag.replace(/\s*\/?>$/, ` width="${info.width}" height="${info.height}">`);
        const mobile = tag.match(/\bdata-mobile\s*=\s*"([^"]+)"/)?.[1];
        const mobileInfo = media[mobile];
        const mobileSources = mobileInfo ? `<source media="(max-width: 767px)" type="image/webp" srcset="${webpUrl(mobile)}"><source media="(max-width: 767px)" srcset="${mobile}">` : '';
        return `<picture class="responsive-picture">${mobileSources}<source type="image/webp" srcset="${webpUrl(src)}">${tag}</picture>`;
    });
}
async function generate() {
    const sharp = require('sharp');
    const source = path.join(root, 'src/images/fallback');
    const destination = path.join(root, 'src/images/webp');
    fs.mkdirSync(destination,{recursive:true});
    const manifest = {};
    let before=0,after=0;
    for(const file of fs.readdirSync(source).filter(name=>/\.(png|jpe?g)$/i.test(name))) {
        const full = path.join(source,file);
        const output = path.join(destination,file.replace(/\.(png|jpe?g)$/i,'.webp'));
        const info=await sharp(full).metadata();
        await sharp(full).webp({quality:85,effort:5}).toFile(output);
        manifest['../images/fallback/'+file]={width:info.width,height:info.height};
        before+=fs.statSync(full).size;after+=fs.statSync(output).size;
    }
    fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
    console.log(`WebP: ${Object.keys(manifest).length} files; ${before} -> ${after} bytes`);
}
module.exports={enhanceImages};
if(require.main===module)generate().catch(error=>{console.error(error);process.exitCode=1;});
