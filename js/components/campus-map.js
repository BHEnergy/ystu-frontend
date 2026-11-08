(() => {
    const instances = new WeakMap();
    let firstInstance = null;
    const initOne = (mapElement) => {
        if (instances.has(mapElement)) return instances.get(mapElement);
        const componentScope = mapElement.closest('[data-campus-map-component], .campus-map') || mapElement.parentElement;
        let campusObjects = window.CampusMapData || [];
        if (mapElement.dataset.campusObjects) {
            try {
                const configured = JSON.parse(mapElement.dataset.campusObjects);
                if (!Array.isArray(configured)) throw new TypeError('Ожидается массив объектов карты');
                campusObjects = configured;
            } catch (error) {
                console.warn('Некорректные данные компонента карты', error);
                campusObjects = [];
            }
        }
    const activeFilters = { category: '', department: '' };
    let interactiveMap = null;
    let activeMarker = null;
    let pinnedMarker = null;
    let hideTimer = null;
    const mobilePopup = window.matchMedia('(max-width: 768px), (hover: none)');

    const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character]);

    const createPopupHtml = (item) => {
        const objects = item.objects.map(([icon, title]) => `<p class="campus-marker__object"><img src="../images/svg/${escapeHtml(icon)}" alt="" /><span>${escapeHtml(title)}</span></p>`).join('');
        return `<article class="campus-marker__popup"><button class="campus-marker__close" data-ui="campus-marker__close" type="button" aria-label="Закрыть информацию об объекте"></button><img class="campus-marker__photo" src="../images/fallback/campus-building-e.png" alt="Учебный корпус ЯГТУ — демонстрационная фотография" /><div class="campus-marker__section"><p class="campus-marker__caption">Адрес</p><p class="campus-marker__text">${escapeHtml(item.address)}</p></div><div class="campus-marker__section"><p class="campus-marker__caption">Объекты в здании</p>${objects}</div></article>`;
    };

    const createMarkerHtml = (item) => `<div class="campus-marker" data-ui="campus-marker" data-campus-marker="${escapeHtml(item.id)}" style="left:${item.position[0]}%;top:${item.position[1]}%"><button class="campus-marker__head campus-marker__trigger" data-ui="campus-marker__trigger" type="button" aria-label="Показать информацию: ${escapeHtml(item.title)}" aria-expanded="false"><img src="../images/svg/campus-pin.svg" alt="" /><span class="campus-marker__label">${escapeHtml(item.title)}</span></button><template class="campus-marker__popup-template" data-ui="campus-marker__popup-template">${createPopupHtml(item)}</template></div>`;

    mapElement.innerHTML = `<img class="campus-map__image" data-ui="campus-map-page__image" src="../images/fallback/campus-map.png" alt="Карта кампуса ЯГТУ с учебными корпусами и стадионом" />${campusObjects.map(createMarkerHtml).join('')}`;

    const popupLayer = document.createElement('div');
    const markers = new Map([...mapElement.querySelectorAll('[data-campus-marker]')]
        .map((marker) => [marker.dataset.campusMarker, marker]));
    popupLayer.className = 'campus-popup-layer';
    popupLayer.setAttribute('data-ui', popupLayer.className);
    popupLayer.hidden = true;
    document.body.append(popupLayer);

    const positionPopup = (marker) => {
        const triggerRect = marker.querySelector('[data-ui~="campus-marker__trigger"]').getBoundingClientRect();
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
            activeMarker?.querySelector('[data-ui~="campus-marker__trigger"]')?.setAttribute('aria-expanded', 'false');
            popupLayer.innerHTML = marker.querySelector('[data-ui~="campus-marker__popup-template"]').innerHTML;
            activeMarker = marker;
        }
        marker.querySelector('[data-ui~="campus-marker__trigger"]')?.setAttribute('aria-expanded', 'true');
        popupLayer.hidden = false;
        positionPopup(marker);
    };

    const hidePopup = (force = false) => {
        if (pinnedMarker && !force) return;
        activeMarker?.querySelector('[data-ui~="campus-marker__trigger"]')?.setAttribute('aria-expanded', 'false');
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
            const marker = markers.get(item.id);
            marker.hidden = !(matchesCategory && matchesDepartment);
            if (marker.hidden && marker === activeMarker) {
                pinnedMarker = null;
                hidePopup(true);
            }
        });
    };

    componentScope.querySelectorAll('[data-campus-filter]').forEach((filter) => {
        const type = filter.dataset.campusFilter;
        const label = filter.querySelector('[data-campus-filter-label]');
        const initialLabel = label.textContent;
        filter.querySelectorAll('[data-filter-value]').forEach((option) => {
            option.setAttribute('aria-pressed', 'false');
        });

        filter.addEventListener('toggle', () => {
            if (!filter.open) return;
            componentScope.querySelectorAll('[data-campus-filter][open]').forEach((other) => {
                if (other !== filter) other.open = false;
            });
        });

        filter.addEventListener('click', (event) => {
            const option = event.target.closest('[data-filter-value]');
            if (!option) {
                if (activeFilters[type] && !filter.open && event.target.closest('summary')) {
                    event.preventDefault();
                    activeFilters[type] = '';
                    filter.classList.remove('is-selected');
                    filter.querySelectorAll('[data-filter-value]').forEach((item) => {
                        item.classList.remove('is-selected');
                        item.setAttribute('aria-pressed', 'false');
                    });
                    label.textContent = initialLabel;
                    applyFilters();
                }
                return;
            }

            filter.querySelectorAll('[data-filter-value]').forEach((item) => {
                const selected = item === option;
                item.classList.toggle('is-selected', selected);
                item.setAttribute('aria-pressed', String(selected));
            });
            activeFilters[type] = option.dataset.filterValue;
            label.textContent = option.textContent.trim();
            filter.classList.add('is-selected');
            filter.open = false;
            applyFilters();
        });
    });

    mapElement.querySelectorAll('[data-ui~="campus-marker"]').forEach((marker) => {
        marker.addEventListener('mouseenter', () => {
            if (!mobilePopup.matches) showPopup(marker);
        });
        marker.addEventListener('mouseleave', scheduleHide);
        marker.addEventListener('focusin', () => {
            if (!mobilePopup.matches) showPopup(marker);
        });
        marker.addEventListener('focusout', scheduleHide);
    });

    popupLayer.addEventListener('mouseenter', () => window.clearTimeout(hideTimer));
    popupLayer.addEventListener('mouseleave', scheduleHide);

    popupLayer.addEventListener('click', (event) => {
        if (!event.target.closest('[data-ui~="campus-marker__close"]')) return;
        const trigger = activeMarker?.querySelector('[data-ui~="campus-marker__trigger"]');
        window.clearTimeout(hideTimer);
        pinnedMarker = null;
        // Возвращаем фокус до закрытия, чтобы focusin не открыл окно повторно.
        trigger?.focus({ preventScroll: true });
        hidePopup(true);
    });

    mapElement.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-ui~="campus-marker__trigger"]');
        const marker = trigger?.closest('[data-ui~="campus-marker"]');
        if (!marker) {
            pinnedMarker = null;
            hidePopup(true);
            return;
        }
        pinnedMarker = pinnedMarker === marker ? null : marker;
        if (pinnedMarker) showPopup(marker); else hidePopup(true);
    });

    const clearFilters = () => {
        componentScope.querySelectorAll('[data-campus-filter]').forEach((filter) => {
            activeFilters[filter.dataset.campusFilter] = '';
            filter.classList.remove('is-selected');
            filter.querySelectorAll('[data-filter-value]').forEach((item) => {
                item.classList.remove('is-selected');
                item.setAttribute('aria-pressed', 'false');
            });
            filter.querySelector('[data-campus-filter-label]').textContent = filter.dataset.campusFilter === 'category' ? 'выбрать объект' : 'выбрать подразделение';
        });
        applyFilters();
    };

    const focusObject = (objectId) => {
        const marker = markers.get(objectId);
        if (!marker) return;
        clearFilters();
        if (interactiveMap) {
            const item = campusObjects.find((object) => object.id === objectId);
            interactiveMap.setLocation({ center: [item.coordinates[1], item.coordinates[0]], zoom: 17 });
        }
        pinnedMarker = marker;
        marker.querySelector('[data-ui~="campus-marker__trigger"]')?.focus({ preventScroll: true });
        (interactiveMap ? mapElement : marker).scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
            block: 'center', inline: 'center',
        });
        window.setTimeout(() => showPopup(marker), 300);
    };

    componentScope.querySelector('[data-campus-search]')?.addEventListener('submit', (event) => {
        event.preventDefault();
        const query = new FormData(event.currentTarget).get('campus-query')?.toString().trim().toLowerCase();
        if (!query) return;
        const target = campusObjects.find((item) => item.title.toLowerCase().includes(query));
        if (target) focusObject(target.id);
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('[data-campus-filter]')) {
            componentScope.querySelectorAll('[data-campus-filter][open]').forEach((filter) => { filter.open = false; });
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        pinnedMarker = null;
        hidePopup(true);
        componentScope.querySelectorAll('[data-campus-filter][open]').forEach((filter) => { filter.open = false; });
    });

    window.addEventListener('resize', () => { if (activeMarker) positionPopup(activeMarker); });
    document.addEventListener('scroll', () => { if (activeMarker) positionPopup(activeMarker); }, true);

    const initYandexMap = async () => {
        if (mapElement.dataset.mapProvider !== 'yandex') return;
        const apiKey = mapElement.dataset.yandexApiKey?.trim();
        // Без ключа сохраняем рабочую статическую карту и не отправляем запрос к API.
        if (!apiKey) {
            mapElement.dataset.mapState = 'missing-key';
            return;
        }

        const host = document.createElement('div');
        host.className = 'campus-map__yandex';
    host.setAttribute('data-ui', host.className);
        let timeoutId;
        let script;
        mapElement.dataset.mapState = 'loading';
        try {
            await Promise.race([
                (async () => {
                    if (!window.ymaps3) {
                        await new Promise((resolve, reject) => {
                            script = document.createElement('script');
                            const url = new URL('https://api-maps.yandex.ru/v3/');
                            url.searchParams.set('apikey', apiKey);
                            url.searchParams.set('lang', 'ru_RU');
                            script.src = url.href;
                            script.onload = resolve;
                            script.onerror = () => reject(new Error('Не удалось загрузить Яндекс.Карты'));
                            document.head.append(script);
                        });
                    }
                    await window.ymaps3.ready;
                })(),
                new Promise((_, reject) => {
                    timeoutId = window.setTimeout(() => reject(new Error('Истекло время ожидания Яндекс.Карт')), 15000);
                }),
            ]);

            const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker, YMapListener } = window.ymaps3;
            mapElement.append(host);
            mapElement.classList.add('campus-map--interactive');
            interactiveMap = new YMap(host, {
                // В API v3 порядок координат: долгота, широта.
                location: {
                    center: [Number(mapElement.dataset.mapLon), Number(mapElement.dataset.mapLat)],
                    zoom: Number(mapElement.dataset.mapZoom) || 16,
                },
            });
            interactiveMap.addChild(new YMapDefaultSchemeLayer());
            interactiveMap.addChild(new YMapDefaultFeaturesLayer());
            campusObjects.forEach((item) => {
                const marker = markers.get(item.id);
                marker.style.removeProperty('left');
                marker.style.removeProperty('top');
                // Переиспользуем DOM метки вместе с обработчиками и разметкой popup.
                interactiveMap.addChild(new YMapMarker({
                    coordinates: [item.coordinates[1], item.coordinates[0]],
                }, marker));
            });
            interactiveMap.addChild(new YMapListener({
                onUpdate: () => {
                    if (activeMarker) window.requestAnimationFrame(() => {
                        if (activeMarker) positionPopup(activeMarker);
                    });
                },
            }));
            mapElement.querySelector('[data-ui~="campus-map-page__image"]').hidden = true;
            applyFilters();
            mapElement.dataset.mapState = 'ready';
        } catch (error) {
            interactiveMap?.destroy();
            interactiveMap = null;
            host.remove();
            script?.remove();
            mapElement.classList.remove('campus-map--interactive');
            mapElement.querySelector('[data-ui~="campus-map-page__image"]').hidden = false;
            campusObjects.forEach((item) => {
                const marker = markers.get(item.id);
                marker.style.left = `${item.position[0]}%`;
                marker.style.top = `${item.position[1]}%`;
                mapElement.append(marker);
            });
            mapElement.dataset.mapState = 'error';
            console.warn('Используется статическая карта: подключение API не удалось.', error);
        } finally {
            window.clearTimeout(timeoutId);
        }
    };


        const api = { campusObjects, focusObject, clearFilters };
        instances.set(mapElement, api);
        firstInstance ||= api;
        initYandexMap();
        return api;
    };
    const init = (scope = document) => {
        const maps = [...(scope.matches?.('[data-campus-map]') ? [scope] : []), ...scope.querySelectorAll('[data-campus-map]')];
        maps.forEach(initOne);
    };
    window.CampusMap = {
        init,
        get: element => instances.get(element),
        get campusObjects() { return firstInstance?.campusObjects || []; },
        focusObject: (...args) => firstInstance?.focusObject(...args),
        clearFilters: () => firstInstance?.clearFilters(),
    };
    init();
})();
