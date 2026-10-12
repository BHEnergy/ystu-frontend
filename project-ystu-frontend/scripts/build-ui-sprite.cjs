// Символы для svg/use и SVG-stack для CSS-фонов используют одни исходные иконки.
const fs=require('node:fs'),path=require('node:path');
const directory=path.resolve(__dirname,'../src/images/svg');
const file=path.join(directory,'sprite.svg');
const names=[...fs.readFileSync(file,'utf8').matchAll(/<symbol\b[^>]*\bid="([^"]+)"/g)].map(m=>m[1]);
const symbols=[],layers=[];
for(const name of names){
 const svg=fs.readFileSync(path.join(directory,name+'.svg'),'utf8');
 const viewBox=svg.match(/viewBox="([^"]+)"/)[1];
 const fill=svg.match(/<svg[^>]*\bfill="([^"]+)"/)?.[1]||'black';
 const body=svg.replace(/^[\s\S]*?<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
 const scoped=prefix=>body.replace(/\bid="([^"]+)"/g,(_,id)=>`id="${prefix}-${id}"`).replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#${prefix}-${id})`).replace(/(href|xlink:href)="#([^"]+)"/g,(_,attr,id)=>`${attr}="#${prefix}-${id}"`);
 symbols.push(`<symbol id="${name}" viewBox="${viewBox}" fill="${fill}">${scoped(name)}</symbol>`);
 layers.push(`<svg id="${name}-view" class="sprite-view" x="0" y="0" width="64" height="64" viewBox="${viewBox}" fill="${fill}">${scoped(name+'-view')}</svg>`);
}
fs.writeFileSync(file,`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 64 64"><style>.sprite-view{display:none}.sprite-view:target{display:inline}</style><defs>${symbols.join('')}</defs>${layers.join('')}</svg>\n`);
console.log(`SVG-stack: ${names.length} symbols and CSS targets`);
