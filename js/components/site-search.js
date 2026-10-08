/* Демонстрационный поиск по страницам комплекта, не по базе CMS. */
(() => {
    const form = document.querySelector('.search-page__form');
    if (!form) return;
    const input = form.querySelector('input');
    const pages = [['index','Главная ЯГТУ'],['programs','Образовательные программы'],['program','Архитектура — образовательная программа'],['nauka','Наука и инновации'],['student-life','Студенческая жизнь'],['news-events','Новости и события'],['detail-sotrudnik','Сотрудник университета'],['structure','Структура университета'],['detail-structure','Подразделение университета'],['map','Карта кампуса'],['vacancies','Работа в ЯГТУ — вакансии'],['detail-vacancy','Отклик на вакансию']];
    const results = document.createElement('div');
    results.className = 'search-page__results wyswig';
    results.setAttribute('aria-live','polite');
    form.after(results);
    const render = () => {
        results.replaceChildren();
        const words=input.value.trim().toLocaleLowerCase('ru').split(/\s+/).filter(Boolean);
        if (!words.length) return;
        const found=pages.filter(([,title])=>words.every(word=>title.toLocaleLowerCase('ru').includes(word)));
        const note=document.createElement('p');
        note.textContent=found.length?'Демонстрационный поиск по страницам комплекта.':'По вашему запросу ничего не найдено.';
        results.append(note);
        found.forEach(([name,title])=>{const p=document.createElement('p'),a=document.createElement('a');a.href=name+'.html';a.textContent=title;p.append(a);results.append(p);});
    };
    input.value=new URLSearchParams(location.search).get('q')||'';
    render();
    form.addEventListener('submit',event=>{event.preventDefault();const url=new URL(location.href);url.hash='';url.searchParams.set('q',input.value);history.replaceState(null,'',url);render();});
})();
