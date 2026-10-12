const fs=require('node:fs'),path=require('node:path');
const src=path.resolve(__dirname,'../src');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
for(const file of walk(src).filter(f=>f.endsWith('.njk'))){
 let t=fs.readFileSync(file,'utf8');
 t=t.replace(/(<[\w-]+\b[^<>]*\bclass\s*=\s*")([^"]+)(")/g,(all,start,classes,end)=>{
 const kind=classes.match(/\bbanner-slider-([123])\b/)?.[1];
 const direction=classes.includes('swiper-button-prev')?'prev-big':'next-big';
 if(kind)return `${all} data-slider-kind="${kind}"`;
 if(classes.split(/\s+/).includes('big')&&/swiper-button-(prev|next)/.test(classes))return `${all} data-slider-control="${direction}"`;
 return all;});
 fs.writeFileSync(file,t);
}
const main=path.join(src,'js/main.js');let j=fs.readFileSync(main,'utf8');
j=j.replace(/\.js-init-banner-slider\.banner-slider-([123])/g,(_,n)=>`.js-init-banner-slider[data-slider-kind="${n}"]`)
 .replace(/\.swiper-button-prev\.big/g,'[data-slider-control="prev-big"]')
 .replace(/\.swiper-button-next\.big/g,'[data-slider-control="next-big"]');
fs.writeFileSync(main,j);
for(const file of walk(path.join(src,'styles')).filter(f=>f.endsWith('.css')&&!/bootstrap|swiper/.test(f))){
 let t=fs.readFileSync(file,'utf8');
 t=t.replace(/content:\s*url\((['"]?)([^)'"\s]*\/sprite\.svg#([\w-]+)-view)\1\);/g,(all,q,url,name)=>{
 const original=fs.readFileSync(path.join(src,'images/svg',name+'.svg'),'utf8');const view=original.match(/viewBox="([^"]+)"/)?.[1].split(/\s+/);
 const width=original.match(/<svg[^>]*\bwidth="([\d.]+)"/)?.[1]||view?.[2]||24;
 const height=original.match(/<svg[^>]*\bheight="([\d.]+)"/)?.[1]||view?.[3]||24;
 return `content: ''; display: inline-block; width: ${width}px; height: ${height}px; background: url(${q}${url}${q}) center / contain no-repeat;`;
 });
 if(file.endsWith('flagship-projects.css'))t=t.replace(/content:\s*url\(([^)]+line-[^)]*\.svg)\);/g,(all,url)=>{
 const name=url.replace(/['"]/g,'').split('/').at(-1);const svg=fs.readFileSync(path.join(src,'images/svg',name),'utf8');const height=svg.match(/<svg[^>]*height="([\d.]+)"/)?.[1]||282;
 return `content: ''; background: url(${url}) center bottom / cover no-repeat; width: calc(100% + 4px); height: ${height}px;`;
 });
 fs.writeFileSync(file,t);
}
