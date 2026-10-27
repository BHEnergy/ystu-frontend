(() => {
if (window.Modals?.init) { window.Modals.init(); return; }
const initializedModals = new WeakSet();
const initializedForms = new WeakSet();
let activeModal = null;
let modalTrigger = null;
let modalScrollState = null;
const closingModals = new WeakSet();
const closingTimers = new WeakMap();
const find = (scope, selector) => [
    ...(scope.matches?.(selector) ? [scope] : []), ...scope.querySelectorAll(selector),
];

const resolveModal = trigger => {
    // Явный target — ID окна (с # или без); прежний data-modal остаётся совместимым.
    const target = trigger.dataset.modalTarget || trigger.getAttribute('aria-controls');
    if (target) {
        const modal = document.getElementById(target.replace(/^#/, ''));
        return modal?.matches('[data-ui~="modal"]') ? modal : null;
    }
    const key = trigger.dataset.modal;
    if (!key) return null;
    const scope = trigger.closest('[data-ui~="modal-scope"]');
    const matches = root => find(root, '[data-ui~="modal"]').find(modal => modal.dataset.modal === key);
    // В явной локальной области не открываем случайно одноимённое внешнее окно.
    return matches(scope || document) || null;
};

const lockModalScroll = () => {
    if (modalScrollState) return;
    const body = document.body;
    modalScrollState = { x: window.scrollX, y: window.scrollY,
        position: body.style.position, top: body.style.top, width: body.style.width,
        paddingRight: body.style.paddingRight,
        header: document.querySelector('.header'), headerWidth: document.querySelector('.header')?.style.width };
    const contentWidth = document.documentElement.clientWidth;
    if (modalScrollState.header) modalScrollState.header.style.width = `${contentWidth}px`;
    body.style.position = 'fixed';
    body.style.top = `-${modalScrollState.y}px`;
    body.style.width = `${contentWidth}px`;
    body.classList.add('body--modal-open');
};

const unlockModalScroll = () => {
    if (!modalScrollState) return;
    const { x, y, header, headerWidth, ...styles } = modalScrollState;
    if (header) header.style.width = headerWidth;
    Object.assign(document.body.style, styles);
    document.body.classList.remove('body--modal-open');
    window.scrollTo({ left: x, top: y, behavior: 'instant' });
    window.Header?.update();
    modalScrollState = null;
};

const getFocusableElements = (modal) => Array.from(modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
)).filter((element) => element.getClientRects().length > 0);

const closeModal = (modal) => {
    if (!modal || closingModals.has(modal)) return;
    closingModals.add(modal);

    const trigger = modalTrigger;
    const finishClosing = () => {
        modal.classList.remove('modal--active', 'modal--closing');
        closingModals.delete(modal);
        closingTimers.delete(modal);
        if (activeModal === modal) {
            activeModal = null;
            unlockModalScroll();
            if (trigger?.isConnected) trigger.focus({ preventScroll: true });
            modalTrigger = null;
        }
    };

    modal.classList.add('modal--closing');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) finishClosing();
    else closingTimers.set(modal, window.setTimeout(finishClosing, 220));
};

const resetModalState = (modal) => {
    modal.classList.remove('modal--success');
    modal.querySelectorAll('[data-ui~="modal-header"], [data-ui~="modal-form"], [data-ui~="modal-close"]').forEach(el => el.hidden = false);
    const success = modal.querySelector('[data-ui~="modal-success"]');
    if (success) success.hidden = true;
    const title = modal.querySelector('[data-ui~="modal-header__title"]');
    if (title?.id) modal.setAttribute('aria-labelledby', title.id);
};

// Вызывать после подтверждения успешной отправки сервером 1С-Битрикс.
const showSuccess = (modal, { demo = false } = {}) => {
    const success = modal?.querySelector('[data-ui~="modal-success"]');
    if (!success) return;
    modal.querySelectorAll('[data-ui~="modal-header"], [data-ui~="modal-form"], [data-ui~="modal-close"]').forEach(el => el.hidden = true);
    success.hidden = false;
    modal.classList.add('modal--success');
    const notice = success.querySelector('[data-demo-notice]');
    if (notice) notice.hidden = !demo;
    modal.setAttribute('aria-labelledby', success.querySelector('[data-ui~="modal-success__title"]').id);
    modal.scrollTop = 0;
    success.focus();
};

const openModal = (modal, trigger) => {
    if (!modal) return;
    init(modal);
    if (activeModal && activeModal !== modal) {
        clearTimeout(closingTimers.get(activeModal));
        closingTimers.delete(activeModal);
        closingModals.delete(activeModal);
        activeModal.classList.remove('modal--active', 'modal--closing');
    }
    clearTimeout(closingTimers.get(modal));
    closingTimers.delete(modal);
    activeModal = modal;
    modalTrigger = trigger;
    lockModalScroll();
    resetModalState(modal);
    const eventSelect = modal.querySelector('[name="event"]');
    const eventTitle = trigger?.closest('[data-ui~="event__card"]')?.querySelector('[data-ui~="event__title"]')?.textContent.trim();
    if (eventSelect && eventTitle) {
        const option = Array.from(eventSelect.options).find(item => item.textContent === eventTitle);
        if (option) eventSelect.value = option.value;
    }
    closingModals.delete(modal);
    modal.classList.remove('modal--closing');
    modal.classList.add('modal--active');
    modal.querySelector('[data-ui~="modal-close"]')?.focus({ preventScroll: true });
};

// Делегирование поддерживает триггеры, добавленные после загрузки страницы.
document.addEventListener('click', event => {
    const button = event.target.closest('[data-ui~="button-modal"]');
    if (!button) return;
    const modal = resolveModal(button);
    if (!modal) return;
    event.preventDefault();
    openModal(modal, button);
    if (button.dataset.modalState === 'success') showSuccess(modal, { demo: true });
});

const init = (scope = document) => {
find(scope, '[data-ui~="modal"]').forEach((modal) => {
    if (initializedModals.has(modal)) return;
    initializedModals.add(modal);
    modal.querySelector('[data-modal-back]')?.addEventListener('click', () => closeModal(modal));
    modal.querySelector('[data-ui~="modal-close"]')?.addEventListener('click', () => closeModal(modal));

    modal.querySelector('[data-ui~="modal-overlay"]')?.addEventListener('click', (event) => {
        if (event.target === event.currentTarget) closeModal(modal);
    });
});

find(scope, '[data-ui~="modal-form"]').forEach((form) => {
    if (initializedForms.has(form)) return;
    initializedForms.add(form);
    // Статическая демонстрация. Интеграция перехватывает modal:submit через preventDefault().
    if (form.hasAttribute('data-modal-demo')) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!form.reportValidity()) return;
            const request = new CustomEvent('modal:submit', {
                bubbles: true,
                cancelable: true,
                detail: { form, data: new FormData(form), modal: form.closest('[data-ui~="modal"]') },
            });
            if (form.dispatchEvent(request)) showSuccess(form.closest('[data-ui~="modal"]'), { demo: true });
        });
    }
    const fileInput = form.querySelector('input[type="file"]');
    const fileButton = form.querySelector('[data-ui~="modal-form__file-button"]');
    const fileLabel = fileButton?.querySelector('[data-ui~="modal-form__file-label"]');
    const defaultFileLabel = fileLabel?.textContent.trim() || 'Прикрепить файл';

    const updateFileLabel = () => {
        const selectedFile = fileInput?.files?.[0];

        if (!fileLabel) return;

        fileLabel.textContent = selectedFile?.name || defaultFileLabel;

        if (selectedFile) {
            fileButton.title = selectedFile.name;
        } else {
            fileButton.removeAttribute('title');
        }
    };

    fileInput?.addEventListener('change', updateFileLabel);
    form.addEventListener('reset', () => window.setTimeout(updateFileLabel));
});
};

document.addEventListener('keydown', (event) => {
    if (!activeModal) return;

    if (event.key === 'Escape') {
        closeModal(activeModal);
        return;
    }

    if (event.key !== 'Tab') return;

    const focusableElements = getFocusableElements(activeModal);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!firstElement) { event.preventDefault(); return; }

    if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
    }
});

window.Modals = { init, close: closeModal, open: openModal, showSuccess, resolve: resolveModal };
init();
})();
