// Визуальные предложения: изменения применяются только в браузере для съёмки.
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('C:/Users/User/.vscode/extensions/danielsanmedium.dscodegpt-3.24.62/standalone/node_modules/patchright-core');
const root = path.resolve(__dirname, '../..');
const out = path.join(__dirname, 'desktop-menu');
fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (err, data) => {
    if (err) return res.writeHead(404).end();
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});
const common = `@media(min-width:1101px){
  .navbar{background:#f3f6fa;border:1px solid #ced9e7;border-radius:12px 12px 0 0;padding:5px 28px}
  .secondary-nav{font-size:14px;gap:22px}.navbar__phone{font-size:14px}.navbar__panel a,.navbar__panel img{width:24px;height:24px}
  .header__wrapper{gap:0}.header__menu{border-color:#ced9e7;border-top:0;padding:20px 28px}
  .header--menu-open .header__menu--collapsed{border-radius:0}
  .header__menu:after{content:'';position:absolute;bottom:0;left:28px;right:28px;height:1px;background:#ced9e7}
  .btn__menu{background:#094188!important}
  .mega-menu{border-color:#ced9e7;border-radius:0 0 12px 12px;padding:28px 28px 30px;height:710px;box-shadow:0 18px 40px #09418810;--mega-menu-column-gap:40px;grid-template-columns:312px 382px minmax(0,1fr)}
  .mega-menu__primary{grid-column:1;grid-row:1;padding-right:24px;border-right:1px solid #ced9e7;gap:0;height:auto;align-self:stretch}
  .mega-menu__section{grid-column:2;grid-row:1;padding-right:24px;height:auto;align-self:stretch}
  .mega-menu__additional{grid-column:3;grid-row:1;border-left:1px solid #ced9e7;gap:0;padding-left:28px}
  .mega-menu__primary-link,.mega-menu__primary-link:visited{font-size:16px;line-height:1.35;font-weight:600;padding:14px 28px 14px 12px;min-height:52px;border-bottom:1px solid #ced9e7;transition:background-color 160ms,color 160ms}
  .mega-menu__primary-link::before{content:none}
  .mega-menu__primary-link.is-selected{background:#e6ecf3;color:#094188}
  .mega-menu[data-hover-submenu] .mega-menu__primary-link::after{content:'';position:absolute;right:12px;top:50%;width:12px;height:12px;padding:0;background:url('/images/svg/triangle-right-orange.svg') center/contain no-repeat;opacity:0;transform:translateY(-50%)}
  .mega-menu[data-hover-submenu] .mega-menu__primary-link.is-selected::after{opacity:1}
  .mega-menu__title{font-size:18px;line-height:1.35;min-height:52px;display:flex;align-items:center;padding:12px 14px;background:#e6ecf3;border-bottom:1px solid #ced9e7}
  .mega-menu__links{gap:0;margin-top:0!important}
  .mega-menu__links a,.mega-menu__additional a{font-size:16px!important;line-height:1.4;font-weight:500;min-height:49px;padding:13px 14px;border-bottom:1px solid #e5e9ee}
  .mega-menu__additional a{width:100%;padding-left:0;padding-right:8px;color:#094188}
  .mega-menu .is-muted::after,.mega-menu .is-muted:hover::after{content:none}
  .mega-menu a:hover{font-size:16px;background:#f3f6fa}
  .mega-menu a:focus-visible{outline:2px solid #094188;outline-offset:-2px}
  .mega-menu__additional:before{content:'БЫСТРЫЕ ССЫЛКИ';display:flex;align-items:center;min-height:52px;font-size:13px;font-weight:600;letter-spacing:1.4px;color:#537aac;border-bottom:1px solid #ced9e7;width:100%}
}
@media(min-width:1101px) and (max-width:1300px){.mega-menu{grid-template-columns:260px 330px minmax(0,1fr);--mega-menu-column-gap:28px}.secondary-nav{gap:12px;font-size:13px}}
@media(prefers-reduced-motion:reduce){.mega-menu *{transition:none!important;animation:none!important}}`;
const variants = [
  { id:'01-lines', title:'01 / Линии и светлая подложка', badge:'РЕКОМЕНДУЮ',
    lead:'Ближе всего к мобильному меню: одинаковая логика строк, голубое выделение и оранжевый указатель. Второй уровень остаётся отдельным списком в центральной колонке.',
    css:'', notes:[['Ритм и разделители','Тонкие горизонтальные линии между пунктами во всех трёх колонках. Две вертикальные линии сохраняют границы уровней.'],['Общее с мобильным','Активный раздел слева и заголовок по центру получают подложку #E6ECF3. Оранжевый указатель направлен вправо — к центральной панели.'],['Почему этот вариант','Самая последовательная связь с присланным образцом. Белая поверхность и синие заголовки сохраняют лёгкость существующей шапки.']] },
  { id:'02-blue', title:'02 / Фирменная синяя колонка', badge:'БОЛЬШЕ КОНТРАСТА',
    lead:'Первый уровень выделен фирменным синим фоном. Центральный второй уровень остаётся белым и сохраняет тот же размер и положение, что в варианте 01.',
    css:`@media(min-width:1101px){.mega-menu__primary{background:#094188;border-right:0;padding:10px 12px;border-radius:8px}.mega-menu__primary-link,.mega-menu__primary-link:visited{color:#fff;border-bottom-color:#ffffff30;padding-left:14px;font-weight:500}.mega-menu__primary-link.is-selected{background:#e6ecf3;color:#094188;border-left:3px solid #e55700;padding-left:11px}.mega-menu__primary-link:hover{background:#235798;color:#fff}.mega-menu__primary-link.is-selected:hover{background:#e6ecf3;color:#094188}}`,
    notes:[['Фирменный акцент','Синий #094188 маркирует первый уровень. Светлая выбранная строка и оранжевая кромка связывают раздел с содержимым по центру.'],['Сохранённая структура','Те же три колонки, те же ссылки, центральная панель с горизонтальными разделителями. Справа — отдельный список быстрых ссылок.'],['Компромисс','Меню становится заметно контрастнее. Подходит, если нужен более выраженный характер, но связь с белым мобильным меню менее буквальная.']] },
  { id:'03-center', title:'03 / Акцент на центральном уровне', badge:'ФОКУС НА СОДЕРЖАНИИ',
    lead:'Светлая центральная панель выделяет содержимое выбранного раздела. Слева остаётся навигация первого уровня, справа — дополнительные ссылки.',
    css:`@media(min-width:1101px){.mega-menu__section{background:#f3f6fa;border:1px solid #ced9e7;border-radius:8px;padding:0;align-self:start;overflow:hidden}.mega-menu__title{background:#094188;color:#fff;border-top:3px solid #e55700;min-height:55px;padding-left:18px}.mega-menu__links a{padding-left:18px;padding-right:18px;background:#fff}.mega-menu__links a:last-child{border-bottom:0}.mega-menu__primary-link.is-selected{border-left:3px solid #e55700;padding-left:9px}.mega-menu__primary{border-right-color:#e5e9ee}}`,
    notes:[['Центр — точка внимания','Синий заголовок, тонкая оранжевая кромка и общий контур связывают название раздела с его ссылками. Панель остаётся в средней колонке.'],['Общее с мобильным','Заголовок и список воспринимаются одним блоком, как раскрытый пункт аккордеона. Строки разделены тонкими серо-голубыми линиями.'],['Компромисс','Выделение центральной панели сильнее, чем в мобильном образце. Это удобный промежуточный вариант между спокойным 01 и контрастным 02.']] }
];
(async()=>{
  await new Promise(resolve=>server.listen(8767,'127.0.0.1',resolve));
  const browser = await chromium.launch({headless:true,channel:'chrome'});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1050},deviceScaleFactor:1});
    const open = async()=>{
      await page.goto('http://127.0.0.1:8767/pages/index.html');
      await page.evaluate(()=>document.fonts.ready);
      await page.addStyleTag({content:'.cookie-banner{display:none!important}'});
      await page.locator('[data-trigger="open-menu"]').click();
      await page.mouse.move(1420,1020);
      await page.waitForTimeout(600);
    };
    await open();
    await page.screenshot({path:path.join(out,'00-current.png'),clip:{x:0,y:75,width:1440,height:890}});
    for(const variant of variants){
      await open();
      await page.addStyleTag({content:common+variant.css});
      await page.waitForTimeout(250);
      await page.screenshot({path:path.join(out,variant.id+'.png'),clip:{x:0,y:75,width:1440,height:890}});
      const position = await page.evaluate(()=>{
        const selectors=['.mega-menu__primary','.mega-menu__section.is-open','.mega-menu__additional'];
        return selectors.map(s=>{const r=document.querySelector(s).getBoundingClientRect();return {selector:s,x:r.x,width:r.width};});
      });
      console.log(variant.id,JSON.stringify(position));
      fs.writeFileSync(path.join(out,variant.id+'.css'),common+variant.css);
    }
    const image = id=>`<img class="screen" src="data:image/png;base64,${fs.readFileSync(path.join(out,id+'.png')).toString('base64')}" alt="${id==='00-current'?'Текущее раскрытое меню':'Предложение '+id+': второй уровень в центральной колонке'}">`;
    const notes = list=>`<div class="notes">${list.map(([h,p])=>`<div><h2>${h}</h2><p>${p}</p></div>`).join('')}</div>`;
    const sheet = (n,title,badge,lead,body)=>`<section class="sheet"><div class="top">ЯГТУ / ДЕСКТОПНОЕ МЕГАМЕНЮ <span>${badge}</span></div><h1>${title}</h1><p class="lead">${lead}</p>${body}<footer>Визуальные предложения · На основе текущего проекта и мобильного образца · 08.09.2026<span>${n} / 4</span></footer></section>`;
    const doc = `<!doctype html><html lang="ru"><meta charset="utf-8"><title>ЯГТУ — варианты десктопного меню</title><style>@font-face{font-family:GoogleSans;src:url(data:font/ttf;base64,${fs.readFileSync(path.join(root,'fonts/GoogleSans.ttf')).toString('base64')})}*{box-sizing:border-box}body{margin:0;background:#e6ecf3;font-family:GoogleSans,Arial,sans-serif;color:#163252}.sheet{width:1440px;height:1350px;padding:40px 48px;margin:24px auto;background:#fff;position:relative;break-after:page}.top{display:flex;justify-content:space-between;color:#537aac;letter-spacing:1.7px;font-size:13px}h1{font-size:36px;color:#094188;margin:20px 0 12px}.lead{font-size:19px;line-height:1.5;margin:0 0 22px;max-width:1270px}.screen{width:100%;display:block;border:1px solid #ced9e7;border-radius:12px}.notes{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;margin-top:25px}h2{color:#094188;font-size:19px;margin:0 0 10px}p{font-size:17px;line-height:1.5;margin:0}footer{position:absolute;bottom:25px;left:48px;right:48px;border-top:1px solid #ced9e7;padding-top:14px;display:flex;justify-content:space-between;color:#537aac;font-size:12px}@media print{@page{size:1440px 1350px;margin:0}.sheet{margin:0;break-inside:avoid}.sheet:last-child{break-after:auto}}</style><body>`+
      sheet(1,'Второй уровень — строго по центру','ИСХОДНОЕ МЕНЮ','Сохраняем существующую схему: разделы слева → подразделы в средней колонке → дополнительные ссылки справа. Ниже — фактическое раскрытое меню проекта при ширине 1440 px.',image('00-current')+notes([['Что меняем','Переносим визуальный язык мобильного меню: разграничительные линии, светло-голубое выбранное состояние, синие заголовки и оранжевые указатели.'],['Что определяет композицию','Содержание выбранного раздела остаётся в средней колонке во всех трёх предложениях. На десктопе оно не раскрывается под пунктом слева.'],['Как сравнивать','Во всех вариантах открыт «Университет», сохранены реальные подписи и состав ссылок. Верх шапки облегчён по направлению A из предыдущего документа.']]))+
      variants.map((v,i)=>sheet(i+2,v.title,v.badge,v.lead,image(v.id)+notes(v.notes))).join('')+'</body></html>';
    fs.writeFileSync(path.join(out,'desktop-menu-proposals.html'),doc);
    await page.goto('http://127.0.0.1:8767/docs/header-review/desktop-menu/desktop-menu-proposals.html');
    await page.evaluate(()=>document.fonts.ready);
    console.log('Document layout',await page.locator('.sheet').evaluateAll(ss=>ss.map(s=>({content:s.querySelector('.notes').getBoundingClientRect().bottom-s.getBoundingClientRect().top,footer:s.querySelector('footer').getBoundingClientRect().top-s.getBoundingClientRect().top}))));
    await page.pdf({path:path.join(out,'desktop-menu-proposals.pdf'),printBackground:true,preferCSSPageSize:true});
  } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
