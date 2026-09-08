const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('C:/Users/User/.vscode/extensions/danielsanmedium.dscodegpt-3.24.62/standalone/node_modules/patchright-core');
const root = path.resolve(__dirname, '../..');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.ttf':'font/ttf'};
const server = http.createServer((req,res)=>{
  const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) {res.writeHead(403).end(); return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(data);});
});
(async()=>{
  await new Promise(resolve=>server.listen(8766,'127.0.0.1',resolve));
  const browser = await chromium.launch({headless:true,channel:"chrome"});
  const page = await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1});
  await page.goto('http://127.0.0.1:8766/pages/index.html');
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(1200);
  await page.screenshot({path:path.join(__dirname,'current.png'),clip:{x:0,y:0,width:1440,height:650}});
  const baselineHeight = (await page.locator('.header').boundingBox()).height;
  const icon = (name,label='') => `<span class="tool"><img src="/images/svg/${name}.svg" alt="">${label}</span>`;
  const logo = '<img class="brand" src="/images/svg/logo.svg" alt="ЯГТУ">';
  const links = words => words.map(w=>`<span>${w}</span>`).join('');
  const audiences = ['Университет','Школьникам','Поступающим','Партнёрам','Обучающимся','Сотрудникам'];
  const topics = ['Образование','Наука','Студенческая жизнь','Заочное обучение','Новости','Контакты','Работа в ЯГТУ'];
  const menu = '<span class="menu-pill">☰ &nbsp; Меню</span>';
  const css = `
    .proposal .nav>span{flex-shrink:0}.proposal .brand{flex-shrink:0}.header{display:none!important} main.main{padding-top:188px!important}.information-banner{padding:0!important}.information-banner{height:40px!important;min-height:40px!important;background:#094188!important}
    .information-banner__body{height:40px!important;min-height:40px!important;justify-content:center!important;gap:36px!important;padding:0!important}
    .information-banner__text{font-size:14px!important;text-transform:none!important;font-weight:500!important}
    .information-banner .btn{padding:5px 18px!important;font-size:13px!important;min-height:28px!important}
    .proposal{position:absolute;top:56px;left:40px;right:40px;z-index:1001;color:#094188;font-family:GoogleSans,sans-serif;background:white;border:1px solid #ced9e7;border-radius:12px;overflow:hidden}
    .proposal *{box-sizing:border-box}.proposal span{white-space:nowrap}.hr-row{display:flex;align-items:center;justify-content:space-between;gap:22px;margin:0;padding:0 28px}.brand{width:157px;height:48px;object-fit:contain}.tool{display:flex;align-items:center;gap:7px;font-size:14px}.tool img{width:24px;height:24px}.tools{display:flex;align-items:center;gap:20px}.nav{display:flex;gap:25px;align-items:center;font-size:16px}.menu-pill{display:inline-flex;background:#094188;color:white;padding:13px 22px;border-radius:28px;font-size:15px}.service{height:44px;background:#f4f7fb;font-size:14px}.hr-main{height:88px}.hr-main .nav{font-weight:600}.active{color:#c44800;background:#fef1ea;border-radius:7px;padding:10px 13px}.cta{background:#e55700;color:white;padding:14px 22px;border-radius:28px;font-size:15px}.search{display:flex;align-items:center;gap:10px;border:1px solid #ced9e7;background:#f8fafc;color:#537aac;padding:12px 17px;border-radius:8px;font-size:15px}.search img{width:21px;height:21px}.sub{height:51px;border-top:1px solid #e6ecf3;font-size:15px}.b .hr-main{height:78px}.b .service{height:38px}.b .sub .nav{gap:36px}.c .hr-main{height:86px}.c .search{width:290px}.c .sub{background:#f4f7fb}.mega{border-top:1px solid #ced9e7;display:grid;grid-template-columns:230px 1fr 1fr 285px;gap:30px;padding:30px 28px 35px;background:white}.mega .side{display:grid;gap:17px;font-size:16px}.mega h3{font-size:19px;margin:0 0 19px}.mega .col span{display:block;font-size:16px;margin-bottom:15px}.mega .card{background:#eef3f9;border-radius:10px;padding:24px}.mega p{font-size:16px;line-height:1.5;margin:14px 0 24px}.mega .card small{font-size:12px;letter-spacing:1px}.mega .card h3{font-size:26px;margin-top:12px}.close{display:inline-flex;align-items:center;justify-content:center;background:#094188;color:white;width:44px;height:44px;border-radius:50%;font-size:25px}
  `;
  const variants = {
    a:`<div class="hr-row service"><div class="nav" style="font-size:14px;gap:22px">${links(topics)}</div><div class="tools"><span>+7 (4852) 40-21-99</span>${icon('translation','RU')}${icon('eyeglases')}</div></div><div class="hr-row hr-main">${logo}<div class="nav" style="gap:20px">${links(audiences)}</div><div class="tools">${icon('search')}${icon('portrait')}${menu}</div></div>`,
    b:`<div class="hr-row service"><div class="nav" style="font-size:14px">${links(['Контакты','Работа в ЯГТУ','Заочное обучение'])}</div><div class="tools"><span>+7 (4852) 40-21-99</span>${icon('translation','RU')}${icon('eyeglases')}${icon('portrait','Личный кабинет')}</div></div><div class="hr-row hr-main">${logo}<div class="nav">${links(['Университет','Образование','Наука','Студенческая жизнь','Новости'])}</div>${icon('search','Поиск')}<span class="cta">Хочу поступить ↗</span></div><div class="hr-row sub"><div class="nav"><span class="active">Поступающим</span>${links(['Школьникам','Обучающимся','Сотрудникам','Партнёрам'])}</div>${menu}</div>`,
    c:`<div class="hr-row hr-main">${logo}${menu}<div class="search">${icon('search')}<span>Поиск по сайту</span></div><span style="font-size:15px">+7 (4852) 40-21-99</span><div class="tools">${icon('portrait','Личный кабинет')}${icon('translation','RU')}${icon('eyeglases')}</div></div><div class="hr-row sub"><div class="nav" style="gap:35px">${links(audiences)}</div><span style="font-size:14px;color:#537aac">Образование &nbsp; / &nbsp; Наука</span></div>`
  };
  for(const [key,html] of Object.entries(variants)){
    await page.goto('http://127.0.0.1:8766/pages/index.html');
    await page.evaluate(()=>document.fonts.ready);
    await page.addStyleTag({content:css});
    await page.evaluate(({key,html})=>{const el=document.createElement('div');el.className='proposal '+key;el.innerHTML=html;document.body.append(el);},{key,html});
    await page.waitForTimeout(350);
    await page.screenshot({path:path.join(__dirname,`${key}.png`),clip:{x:0,y:0,width:1440,height:650}});
    for (const width of [1280,1440,1920]) {
      await page.setViewportSize({width,height:960});
      console.log(key,width,await page.locator('.proposal').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth})));
    }
    await page.setViewportSize({width:1440,height:960});
  }
  await page.evaluate(html=>{document.querySelector('.proposal').className='proposal a';document.querySelector('.proposal').innerHTML=html;},variants.a.replace(menu,'<span class="close">×</span>')+`<div class="mega"><div class="side"><span class="active">Поступающим</span>${links(['Университет','Обучающимся','Школьникам','Сотрудникам','Партнёрам'])}</div><div class="col"><h3>Выбрать образование</h3>${links(['Бакалавриат и специалитет','Магистратура','Аспирантура','Заочное обучение','Целевое обучение'])}</div><div class="col"><h3>Подготовиться к поступлению</h3>${links(['Правила приёма','Вступительные испытания','Стоимость и оплата','Общежития','Контакты приёмной комиссии'])}</div><div class="card"><small>С ЧЕГО НАЧАТЬ</small><h3>Найди свою<br>программу</h3><p>Направления подготовки,<br>предметы и формы обучения</p><span class="cta">Выбрать программу ↗</span></div></div>`);
  await page.screenshot({path:path.join(__dirname,'menu.png'),clip:{x:0,y:0,width:1440,height:650}});
  const img = name => `<img class="screen" alt="${name === 'current' ? 'Текущая шапка проекта' : 'Дизайн-концепция шапки: '+name}" src="data:image/png;base64,${fs.readFileSync(path.join(__dirname,name+'.png')).toString('base64')}">`;
  const sheet = (number,kicker,title,lead,body) => `<section class="sheet"><div class="eyebrow">ЯГТУ / ДЕСКТОПНАЯ ШАПКА <span>${kicker}</span></div><h1>${title}</h1><p class="lead">${lead}</p>${body}<footer>Дизайн-предложение · 08.09.2026 <span>${number} / 6</span></footer></section>`;
  const notes = rows => `<div class="notes">${rows.map(([title,text])=>`<div><h2>${title}</h2><p>${text}</p></div>`).join('')}</div>`;
  const document = `<!doctype html><html lang="ru"><meta charset="utf-8"><title>ЯГТУ — варианты десктопной шапки</title><style>@font-face{font-family:GoogleSans;src:url(data:font/ttf;base64,${fs.readFileSync(path.join(root,'fonts/GoogleSans.ttf')).toString('base64')})}*{box-sizing:border-box}body{margin:0;background:#e6ecf3;color:#163252;font-family:GoogleSans,Arial,sans-serif}.sheet{width:1440px;height:1100px;background:white;margin:24px auto;padding:44px 58px;position:relative;break-after:page}.eyebrow{font-size:13px;letter-spacing:2px;font-weight:600;color:#537aac;display:flex;justify-content:space-between}h1{font-size:40px;letter-spacing:-1px;margin:22px 0 12px;color:#094188}.lead{font-size:19px;line-height:1.5;margin:0 0 24px;max-width:1200px}.screen{display:block;width:100%;border:1px solid #ced9e7;border-radius:12px}.notes{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:24px}h2{font-size:19px;margin:0 0 9px;color:#094188}p,li{font-size:16px;line-height:1.5;margin:0}footer{position:absolute;bottom:24px;left:58px;right:58px;display:flex;justify-content:space-between;border-top:1px solid #e6ecf3;padding-top:13px;font-size:12px;color:#537aac}table{border-collapse:collapse;width:100%;margin:35px 0}th,td{text-align:left;padding:20px 18px;border-bottom:1px solid #ced9e7;font-size:17px;line-height:1.45}th{background:#eef3f9;color:#094188}.recommend{background:#eef3f9;padding:26px 30px;border-radius:12px;margin:28px 0}.recommend h2{font-size:25px}.recommend p{font-size:19px}ul{padding-left:22px}li{margin-bottom:14px}@media print{@page{size:1440px 1100px;margin:0}body{background:white}.sheet{margin:0;break-inside:avoid}.sheet:last-child{break-after:auto}}</style><body>`+
    sheet(1,'ИСХОДНОЕ СОСТОЯНИЕ','Сохранить характер. Упростить выбор.','Основа — фактическая шапка pages/index.html. Скриншот при ширине 1440 px; ниже — предложения на тех же логотипе, шрифте, цветах и первом экране.',img('current')+notes([
      ['Что уже работает','Узнаваемые синий и оранжевый, логотип слева, аудитории на виду и доступ к полному меню. Эти опоры стоит сохранить.'],
      ['Что усложняет чтение','13 видимых навигационных ссылок, телефон и четыре иконки. Капитель делает нижний ряд визуально плотным; оранжевый одновременно выделяет событие и меню.'],
      ['Где есть резерв','На этом экране баннер и шапка заканчиваются на 233 px. Сервисные иконки требуют расшифровки. Предложения ниже — дизайнерские гипотезы, без данных аналитики.']]))+
    sheet(2,'A / РЕКОМЕНДУЕМЫЙ','Аккуратная эволюция','Собрать два ряда в единый блок, облегчить типографику и сохранить привычные входы. Наиболее прямой путь доработки существующей шапки.',img('a')+notes([
      ['Единая поверхность','Общая рамка и светлая служебная полоса объединяют навигацию. Основные ссылки набраны обычным регистром; синий бургер снижает конкуренцию с анонсом.'],
      ['Понятная иерархия','Все нынешние разделы сохраняются. Поиск и вход расположены рядом с основными действиями. RU делает назначение переключателя языка заметнее.'],
      ['Цена решения','Меньше изменений в структуре и привычках. Плотность ссылок всё ещё требует внимания: на 1280 px нужны меньшие интервалы и перенос части сервисов в меню.']]))+
    sheet(3,'B / АКЦЕНТ НА ПРИЁМЕ','Поступление как главное действие','Выделить «Хочу поступить», а разделы университета и ссылки для аудиторий развести по разным уровням. Подходит, если приём — подтверждённый приоритет сайта.',img('b')+notes([
      ['Сильный ориентир','Оранжевый выделяет конкретное действие. «Поступающим» остаётся входом в раздел; кнопка ведёт к началу сценария поступления. Маршруты нужно развести по смыслу.'],
      ['Полная навигация','Образование, наука, жизнь и новости — в основном ряду. Контакты, вакансии и заочное обучение — в служебном. Вход в кабинет получает подпись.'],
      ['Компромисс','Три ряда занимают больше места, чем A и C. При прокрутке стоит оставлять основной ряд. Вне приёмной кампании акцент можно менять редакционно.']]))+
    sheet(4,'C / СЕРВИСНЫЙ ПОДХОД','Поиск и быстрый доступ','Сделать поиск заметным, а полное меню — главным входом в структуру. Аудитории остаются отдельной строкой; тематические разделы в полном объёме доступны в меню.',img('c')+notes([
      ['Быстрее к задаче','Видимое поле поиска помогает начать с конкретного запроса. Кабинет подписан; телефон и выбор языка сохранены рядом.'],
      ['Спокойнее визуально','Два ясных ряда вместо множества равнозначных элементов. В строке аудиторий оставлены быстрые ссылки на образование и науку.'],
      ['Условие выбора','Потребуется качественный поиск и понятное мегаменю. Новости, контакты и другие темы уходят на дополнительный шаг. Подходит при частых повторных визитах.']]))+
    sheet(5,'A / РАСКРЫТОЕ МЕНЮ','Меню, которое помогает выбрать','Дополнение к варианту A: тематические группы и один полезный акцент. Подписи подразделов — предложение по структуре; их нужно сверить с реальным контентом.',img('menu')+notes([
      ['Содержание вместо заглушек','Для выбранной аудитории показываем задачи: выбрать программу, изучить правила, узнать стоимость. В текущем коде часть панелей пока заполнена «Страница 1–5».'],
      ['Предсказуемое управление','Клик открывает панель; Escape закрывает и возвращает фокус на кнопку. Выбранный раздел обозначен фоном. Переход к подразделам доступен с клавиатуры.'],
      ['Сохранить механику проекта','Бургер превращается в круглый крестик, подпись «Меню» скрывается. Панель открывается поверх контента; на низком экране прокручивается внутри.']]))+
    sheet(6,'ВЫБОР НАПРАВЛЕНИЯ','Начать с варианта A','Он сохраняет нынешнюю архитектуру и фирменный характер, но делает шапку спокойнее и собраннее. B и C — альтернативы под разные приоритеты.',`<table><thead><tr><th>Критерий</th><th>A · Эволюция</th><th>B · Поступление</th><th>C · Сервисы</th></tr></thead><tbody><tr><td>Главный эффект</td><td>Понятнее иерархия</td><td>Заметнее путь абитуриента</td><td>Заметнее поиск и кабинет</td></tr><tr><td>Изменение структуры</td><td>Небольшое</td><td>Перегруппировка разделов</td><td>Часть тем уходит в меню</td></tr><tr><td>Высота блока в концепте*</td><td>132 px</td><td>167 px</td><td>137 px</td></tr><tr><td>Главный компромисс</td><td>Остаётся много ссылок</td><td>Три навигационных ряда</td><td>Зависимость от поиска</td></tr></tbody></table><p style="font-size:13px;color:#537aac">* Без рамки, внешних отступов и анонса. У исходной шапки две поверхности высотой 42 и 96 px; дополнительные отступы доводят блок до ${baselineHeight} px. Все концепты показаны при 1440 px, это статические визуальные предложения.</p><div class="recommend"><h2>Первый этап: A + содержательное мегаменю</h2><p>Сохранить все действующие входы, облегчить регистр ссылок, объединить ряды и упорядочить сервисы. Уменьшить анонс до 40 px; закрытие и срок публикации анонса предусмотреть при реализации.</p></div><div class="notes"><div><h2>Адаптация десктопа</h2><p>1440–1920 px: полная версия. 1280–1366 px: интервалы 12–16 px, часть служебных ссылок в меню. Не уменьшать текст до текущих 13 px ради сохранения всех элементов.</p></div><div><h2>Состояния и доступность</h2><p>Для иконок — понятные названия и подсказки, зоны нажатия от 44 px. Видимый фокус; активный раздел; компактная шапка при прокрутке. Учитывать reduced motion.</p></div><div><h2>Проверка перед выпуском</h2><p>Проверить 1280, 1366, 1440 и 1920 px, масштаб 200%, длинные подписи и реальные ссылки. Сравнить поиск программ, расписания и контактов на коротких пользовательских заданиях.</p></div></div>`)+ '</body></html>';
  fs.writeFileSync(path.join(__dirname,'header-proposals.html'),document);
  await page.goto('http://127.0.0.1:8766/docs/header-review/header-proposals.html');
  await page.evaluate(()=>document.fonts.ready);
  console.log('Проверка документа:',await page.locator('.sheet').evaluateAll(sheets=>sheets.map(s=>({page:s.querySelector('footer span').textContent,contentBottom:Math.round(s.querySelector('footer').previousElementSibling.getBoundingClientRect().bottom-s.getBoundingClientRect().top),footerTop:Math.round(s.querySelector('footer').getBoundingClientRect().top-s.getBoundingClientRect().top)}))));
  await page.locator('.sheet').nth(1).screenshot({path:path.join(__dirname,'document-preview.png')});
  await page.pdf({path:path.join(__dirname,'header-proposals.pdf'),printBackground:true,preferCSSPageSize:true});
  console.log('Документ HTML и PDF созданы.');
  await browser.close();
  server.close();
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});




