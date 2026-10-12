// CSS-фоны не зависят от fragment/:target внешнего SVG; HTML сохраняет svg/use.
const fs=require('node:fs'),path=require('node:path');
const src=path.resolve(__dirname,'../src');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
let count=0;
for(const file of walk(path.join(src,'styles')).filter(f=>f.endsWith('.css'))){
 const old=fs.readFileSync(file,'utf8');
 const text=old.replace(/url\((['"]?)[^)'"\s]*sprite\.svg#([\w-]+)-view\1\)/g,(_,quote,name)=>{
  const svg=fs.readFileSync(path.join(src,'images/svg',name+'.svg'),'utf8');
  count++;
  return `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g,'%27')}")`;
 });
 if(text!==old)fs.writeFileSync(file,text);
}
console.log(`Исправлено CSS-иконок: ${count}`);
