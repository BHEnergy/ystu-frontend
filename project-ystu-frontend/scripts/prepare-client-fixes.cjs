// Однократные механические правки шаблонов; данные фильтров — демонстрационные.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../src');
const walk = dir => fs.readdirSync(dir, {withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
for (const file of [...walk(path.join(root,'pages')), ...walk(path.join(root,'templates'))].filter(p=>p.endsWith('.njk'))) {
    let html=fs.readFileSync(file,'utf8');
    html=html.replace(/<article class="(program-card|vacancy-card)">([\s\S]*?)<\/article>/g,(all,type,body)=>{
        const filters=type==='program-card'?{
            education_level:[body.includes('Магистратура')?'master':body.includes('Специалитет')?'specialist':'bachelor'],
            study_form:['full_time'],financing:['budget','target','paid'],
            entrance_exam:['russian','mathematics',body.includes('Архитектура')?'creative':'physics']
        }:{category:[body.includes('Административный')?'administrative':'academic'],experience:['1-plus'],employment:['full'],work_format:['office']};
        return `<article class="${type}" data-catalog-filters='${JSON.stringify(filters)}'>${body}</article>`;
    });
    html=html.replace(/(<article class="training-program-card">[\s\S]*?<h3>)([^<]+)(<\/h3>)/g,'$1<a href="program.html">$2</a>$3');
    html=html.replace(/href="404.html">Структура университета/g,'href="structure.html">Структура университета');
    html=html.replace(/(class="btn btn--default btn--m vacancy-card__button" href=")#("\s*)/g,'$1detail-vacancy.html$2');
    if(file.endsWith('detail-vacancy.njk'))html=html.replace(/(href\s*=\s*")index.html("[^>]*>\s*Работа в ЯГТУ)/g,'$1vacancies.html$2');
    if(html!==fs.readFileSync(file,'utf8'))fs.writeFileSync(file,html);
}
const navFile=path.join(root,'data/navigation.json');
const navigation=JSON.parse(fs.readFileSync(navFile,'utf8'));
navigation.forEach(item=>{if(item.section==='education')item.href='programs.html';});
fs.writeFileSync(navFile,JSON.stringify(navigation,null,2)+'\n');
