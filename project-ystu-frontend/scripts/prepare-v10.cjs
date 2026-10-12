// Механический перенос: размеры шрифта, независимые JS-хуки и общий SVG-спрайт.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src');
const walk = dir => fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]);
const owned = file => !/bootstrap|swiper-bundle|gsap|imask|lazyload/.test(path.basename(file));
const scripts = walk(path.join(src,'js')).filter(owned);
const templates = walk(src).filter(f => f.endsWith('.njk'));
const styles = walk(path.join(src,'styles')).filter(f => f.endsWith('.css') && owned(f));
const skip = name => /^(js-|swiper-|is-|has-)/.test(name) || /^(active|unactive|current|select|open|big-disabled)$/.test(name) || /--(open|active|selected)$/.test(name);
const selectorCalls = /(querySelector(?:All)?|closest|matches)\(\s*(['"`])([\s\S]*?)\2/g;
const hook = name => `[data-ui~="${name}"]`;
const hooks = new Set();
for (const file of scripts) {
    const text=fs.readFileSync(file,'utf8');
    for (const call of text.matchAll(selectorCalls)) {
        for(const match of call[3].matchAll(/(?<![\w-])\.([\w-]+)/g)) if (!skip(match[1])) hooks.add(match[1]);
    }
}
const iconNames = ['search','portrait','translation','eyeglases','arrow-white','calendar','call','call-white','mail-white','location','location-white','tg','vk','ok','close','close-white','campus-close','filters','vacancy-search','triangle-down','triangle-left-orange','triangle-right-orange','event-modal-arrow','link-arrow'];
const iconDir = path.join(src,'images/svg');
const symbols = [];
const views = [];
iconNames.forEach((name,index) => {
    const file=path.join(iconDir,name+'.svg');
    if(!fs.existsSync(file))return;
    const svg=fs.readFileSync(file,'utf8');
    const viewBox=svg.match(/viewBox="([^"]+)"/)?.[1];
    if(!viewBox)throw Error('Missing viewBox: '+name);
    const body=svg.replace(/^[\s\S]*?<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
    const scoped=prefix=>body.replace(/\bid="([^"]+)"/g,(_,id)=>`id="${prefix}-${id}"`).replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#${prefix}-${id})`).replace(/(href|xlink:href)="#([^"]+)"/g,(_,attr,id)=>`${attr}="#${prefix}-${id}"`);
    const fill=svg.match(/<svg[^>]*\bfill="([^"]+)"/)?.[1] || 'black';
    symbols.push(`<symbol id="${name}" viewBox="${viewBox}" fill="${fill}">${scoped(name)}</symbol>`);
    views.push(`<view id="${name}-view" viewBox="0 ${index*64} 64 64"/><svg x="0" y="${index*64}" width="64" height="64" viewBox="${viewBox}" fill="${fill}">${scoped(name+'-view')}</svg>`);
});
fs.writeFileSync(path.join(iconDir,'sprite.svg'),`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 64 64"><defs>${symbols.join('')}</defs>${views.join('')}</svg>\n`);
const addHooks = text => text.replace(/(<[\w-]+\b[^<>]*?\bclass\s*=\s*")([^"]+)(")/g,(all,start,classes,end)=>{
    const tags=classes.split(/\s+/).filter(c=>hooks.has(c));
    return tags.length ? `${start}${classes}${end} data-ui="${tags.join(' ')}"` : all;
});
for (const file of templates) {
    let text=fs.readFileSync(file,'utf8');
    text=text.replace(/<img\b[^>]*\bsrc\s*=\s*"\.\.\/images\/svg\/([\w-]+)\.svg"[^>]*\/?\s*>/g,(tag,name)=>{
        if(!iconNames.includes(name))return tag;
        const attrs=tag.replace(/^<img\b/,'').replace(/\s*\/?>$/,'').replace(/\bsrc\s*=\s*"[^"]*"/,'').replace(/\balt\s*=\s*"[^"]*"/,'').replace(/\b(?:loading|decoding)\s*=\s*"[^"]*"/g,'');
        const cls=attrs.match(/\bclass\s*=\s*"([^"]*)"/);
        const adjusted=cls ? attrs.replace(cls[0],`class="${cls[1]} ui-icon"`) : attrs+' class="ui-icon"';
        return `<svg${adjusted} aria-hidden="true" focusable="false"><use href="../images/svg/sprite.svg#${name}"></use></svg>`;
    });
    if(file.endsWith('vacancy-description.njk')) {
        text=text.replace(/<p class\s*=\s*"detail-vacancy__list__title">([^<]+)<\/p>/g,'<h2>$1</h2>').replaceAll('detail-vacancy__list wyswig d-flex flex-column','detail-vacancy__list wyswig');
    }
    // У текстовых узлов редактора нет классов; оформление задаётся контейнером.
    const parse5=require('parse5');
    const doc=parse5.parseFragment(text,{sourceCodeLocationInfo:true});
    const removals=[];
    const inspect=(node,inRich=false)=>{
        const cls=node.attrs?.find(a=>a.name==='class')?.value||'';
        const rich=inRich||cls.split(/\s+/).includes('wyswig');
        if(inRich&&/^(p|h[1-6]|ul|ol|li|strong|em|table|thead|tbody|tr|td|th)$/.test(node.tagName)&&node.sourceCodeLocation?.attrs?.class)removals.push(node.sourceCodeLocation.attrs.class);
        for(const child of node.childNodes||[])inspect(child,rich);
    };
    inspect(doc);
    removals.sort((a,b)=>b.startOffset-a.startOffset).forEach(r=>{text=text.slice(0,r.startOffset)+text.slice(r.endOffset)});
    text=addHooks(text);
    fs.writeFileSync(file,text);
}
for (const file of scripts) {
    let text=fs.readFileSync(file,'utf8');
    text=text.replace(selectorCalls,(_,fn,quote,selector)=>{
        const transformed=selector.replace(/(?<![\w-])\.([\w-]+)/g,(all,name)=>hooks.has(name)?hook(name):all);
        // Атрибуты используют одинарные кавычки внутри двойной JS-строки.
        return `${fn}(${quote}${quote==='"'?transformed.replace(/"/g,"'"):transformed}${quote}`;
    });
    text=addHooks(text);
    text=text.replace(/([\w.]+)\.className\s*=\s*(['"`])([^\n]+?)\2;/g,(all,node)=>`${all}\n    ${node}.setAttribute('data-ui', ${node}.className);`);
    fs.writeFileSync(file,text);
}
for (const file of styles) {
    let text=fs.readFileSync(file,'utf8');
    text=text.replace(/(font-size\s*:\s*)([^;}]+)/g,(_,prefix,value)=>prefix+value.replace(/(\d*\.?\d+)px\b/g,(_,n)=>`${Number(n)/16}rem`));
    // SVG use сохраняет размеры иконок, ранее заданные селекторами img.
    text=text.replace(/([^{}]+)\{/g,(all,selector)=>selector.includes('img') ? selector.replace(/\bimg\b/g,':is(img, .ui-icon)')+'{' : all);
    text=text.replace(/url\((['"]?)([^)'"\s]*\/)([\w-]+)\.svg\1\)/g,(all,q,base,name)=>iconNames.includes(name)?`url(${q}${base}sprite.svg#${name}-view${q})`:all);
    fs.writeFileSync(file,text);
}
console.log(`${hooks.size} поведенческих хуков; ${symbols.length} UI-иконок; размеры шрифтов переведены в rem`);
