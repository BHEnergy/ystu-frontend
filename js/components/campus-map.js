(() => {
    const mapElement = document.querySelector('[data-campus-map]');

    if (!mapElement) {
        window.CampusMap = {};
        return;
    }

    const campusObjects = [
        { id: 'building-e', title: 'Корпус Е', coordinates: [57.58468, 39.85582], position: [24.93, 9.2], address: 'Московский проспект, 84А', categories: ['education', 'laboratory'], departments: ['institute-1', 'department-1'], objects: [['campus-school.svg', 'Институт химии и химической технологии'], ['campus-lab.svg', 'Лаборатории']] },
        { id: 'building-a', title: 'Корпус А', coordinates: [57.58548, 39.85529], position: [32.92, 18.77], address: 'Московский проспект, 88', categories: ['admissions', 'administration'], departments: ['service-1'], objects: [['campus-school.svg', 'Учебный корпус']] },
        { id: 'building-g', title: 'Корпус Г', coordinates: [57.58496, 39.85454], position: [29.38, 37.3], address: 'Московский проспект, 88', categories: ['education', 'library'], departments: ['institute-2'], objects: [['campus-school.svg', 'Учебный корпус']] },
        { id: 'building-s', title: 'Корпус С', coordinates: [57.58345, 39.85817], position: [56.25, 60.12], address: 'Московский проспект, 88', categories: ['education', 'laboratory'], departments: ['institute-3'], objects: [['campus-school.svg', 'Учебный корпус']] },
        { id: 'education-building', title: 'Учебный корпус', coordinates: [57.58276, 39.85918], position: [62.64, 71.78], address: 'Московский проспект, 88', categories: ['education', 'military'], departments: ['department-2'], objects: [['campus-school.svg', 'Учебные аудитории']] },
        { id: 'stadium', title: 'Стадион', coordinates: [57.58438, 39.85289], position: [13.75, 24.3], address: 'Московский проспект, 88', categories: ['sport', 'driving'], departments: ['service-2'], objects: [['campus-school.svg', 'Спортивный комплекс']] }
    ];

    const activeFilters = { category: '', department: '' };
    let activeMarker = null;
    let pinnedMarker = null;
    let hideTimer = null;

    const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character]);

    const createPopupHtml = (item) => {
        const objects = item.objects.map(([icon, title]) => `<p class="campus-marker__object"><img src="../images/svg/${escapeHtml(icon)}" alt="" /><span>${escapeHtml(title)}</span></p>`).join('');
        return `<article class="campus-marker__popup"><img class="campus-marker__photo" src="../images/fallback/campus-building-e.png" alt="${escapeHtml(item.title)}" /><div class="campus-marker__section"><p class="campus-marker__caption">Адрес</p><p class="campus-marker__text">${escapeHtml(item.address)}</p></div><div class="campus-marker__section"><p class="campus-marker__caption">Объекты в здании</p>${objects}</div></article>`;
    };

    const createMarkerHtml = (item) => `<div class="campus-marker" data-campus-marker="${escapeHtml(item.id)}" style="left:${item.position[0]}%;top:${item.position[1]}%"><div class="campus-marker__head"><button class="campus-marker__trigger" type="button" aria-label="Показать информацию: ${escapeHtml(item.title)}" aria-expanded="false"><img src="../images/svg/campus-pin.svg" alt="" /></button><span class="campus-marker__label">${escapeHtml(item.title)}</span></div><template class="campus-marker__popup-template">${createPopupHtml(item)}</template></div>`;

    mapElement.innerHTML = `<img class="campus-map-page__image" src="../images/fallback/campus-map.png" alt="Схема кампуса ЯГТУ" />${campusObjects.map(createMarkerHtml).join('')}`;

    const popupLayer = document.createElement('div');
    popupLayer.className = 'campus-popup-layer';
    popupLayer.hidden = true;
    document.body.append(popupLayer);

    const positionPopup = (marker) => {
        const triggerRect = marker.querySelector('.campus-marker__trigger').getBoundingClientRect();
        const popupRect = popupLayer.getBoundingClientRect();
        const gap = 10;
        const left = Math.min(Math.max(16, triggerRect.left), window.innerWidth - popupRect.width - 16);
        const spaceBelow = window.innerHeight - triggerRect.bottom;
        const top = spaceBelow >= popupRect.height + gap
            ? triggerRect.bottom + gap
            : Math.max(16, triggerRect.top - popupRect.height - gap);
        popupLayer.style.left = `${left}px`;
        popupLayer.style.top = `${top}px`;
    };

    const showPopup = (marker) => {
        window.clearTimeout(hideTimer);
        if (activeMarker !== marker) {
            activeMarker?.querySelector('.campus-marker__trigger')?.setAttribute('aria-expanded', 'false');
            popupLayer.innerHTML = marker.querySelector('.campus-marker__popup-template').innerHTML;
            activeMarker = marker;
        }
        marker.querySelector('.campus-marker__trigger')?.setAttribute('aria-expanded', 'true');
        popupLayer.hidden = false;
        positionPopup(marker);
    };

    const hidePopup = (force = false) => {
        if (pinnedMarker && !force) return;
        activeMarker?.querySelector('.campus-marker__trigger')?.setAttribute('aria-expanded', 'false');
        activeMarker = null;
        popupLayer.hidden = true;
        popupLayer.innerHTML = '';
    };

    const scheduleHide = () => {
        window.clearTimeout(hideTimer);
        hideTimer = window.setTimeout(() => hidePopup(), 100);
    };

    const applyFilters = () => {
        campusObjects.forEach((item) => {
            const matchesCategory = !activeFilters.category || item.categories.includes(activeFilters.category);
            const matchesDepartment = !activeFilters.department || item.departments.includes(activeFilters.department);
            const marker = mapElement.querySelector(`[data-campus-marker="${item.id}"]`);
            marker.hidden = !(matchesCategory && matchesDepartment);
            if (marker.hidden && marker === activeMarker) {
                pinnedMarker = null;
                hidePopup(true);
            }
        });
    };

    document.querySelectorAll('[data-campus-filter]').forEach((filter) => {
        const type = filter.dataset.campusFilter;
        const label = filter.querySelector('[data-campus-filter-label]');
        const initialLabel = label.textContent;

        filter.addEventListener('toggle', () => {
            if (!filter.open) return;
            document.querySelectorAll('[data-campus-filter][open]').forEach((other) => {
                if (other !== filter) other.open = false;
            });
        });

        filter.addEventListener('click', (event) => {
            const option = event.target.closest('[data-filter-value]');
            if (!option) {
                if (filter.classList.contains('is-selected') && !filter.open && event.target.closest('summary')) {
                    event.preventDefault();
                    activeFilters[type] = '';
                    filter.classList.remove('is-selected');
                    filter.querySelector('.is-selected')?.classList.remove('is-selected');
                    label.textContent = initialLabel;
                    applyFilters();
                }
                return;
            }

            filter.querySelector('.is-selected')?.classList.remove('is-selected');
            option.classList.add('is-selected');
            activeFilters[type] = option.dataset.filterValue;
            label.textContent = option.textContent.trim();
            filter.classList.add('is-selected');
            filter.open = false;
            applyFilters();
        });
    });

    mapElement.querySelectorAll('.campus-marker').forEach((marker) => {
        marker.addEventListener('mouseenter', () => showPopup(marker));
        marker.addEventListener('mouseleave', scheduleHide);
        marker.addEventListener('focusin', () => showPopup(marker));
        marker.addEventListener('focusout', scheduleHide);
    });

    popupLayer.addEventListener('mouseenter', () => window.clearTimeout(hideTimer));
    popupLayer.addEventListener('mouseleave', scheduleHide);

    mapElement.addEventListener('click', (event) => {
        const trigger = event.target.closest('.campus-marker__trigger');
        const marker = trigger?.closest('.campus-marker');
        if (!marker) {
            pinnedMarker = null;
            hidePopup(true);
            return;
        }
        pinnedMarker = pinnedMarker === marker ? null : marker;
        if (pinnedMarker) showPopup(marker); else hidePopup(true);
    });

    const clearFilters = () => {
        document.querySelectorAll('[data-campus-filter]').forEach((filter) => {
            activeFilters[filter.dataset.campusFilter] = '';
            filter.classList.remove('is-selected');
            filter.querySelector('.is-selected')?.classList.remove('is-selected');
            filter.querySelector('[data-campus-filter-label]').textContent = filter.dataset.campusFilter === 'category' ? 'выбрать объект' : 'выбрать подразделение';
        });
        applyFilters();
    };

    const focusObject = (objectId) => {
        const marker = mapElement.querySelector(`[data-campus-marker="${objectId}"]`);
        if (!marker) return;
        clearFilters();
        pinnedMarker = marker;
        marker.querySelector('.campus-marker__trigger')?.focus({ preventScroll: true });
        marker.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        window.setTimeout(() => showPopup(marker), 300);
    };

    document.querySelector('[data-campus-search]')?.addEventListener('submit', (event) => {
        event.preventDefault();
        const query = new FormData(event.currentTarget).get('campus-query')?.toString().trim().toLowerCase();
        if (!query) return;
        const target = campusObjects.find((item) => item.title.toLowerCase().includes(query));
        if (target) focusObject(target.id);
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('[data-campus-filter]')) {
            document.querySelectorAll('[data-campus-filter][open]').forEach((filter) => { filter.open = false; });
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        pinnedMarker = null;
        hidePopup(true);
        document.querySelectorAll('[data-campus-filter][open]').forEach((filter) => { filter.open = false; });
    });

    window.addEventListener('resize', () => { if (activeMarker) positionPopup(activeMarker); });
    document.addEventListener('scroll', () => { if (activeMarker) positionPopup(activeMarker); }, true);

    window.CampusMap = { campusObjects, focusObject, clearFilters };
})();
