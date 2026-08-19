const buttonsModal = document.querySelectorAll('.button-modal');
let activeModal = null;
let modalTrigger = null;

const getFocusableElements = (modal) => Array.from(modal.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
));

const closeModal = (modal) => {
    if (!modal || modal.classList.contains('modal--closing')) return;

    const trigger = modalTrigger;
    const finishClosing = () => {
        modal.classList.remove('modal--active', 'modal--closing');
        document.body.classList.remove('body--modal-open');
        activeModal = null;
        trigger?.focus();
        modalTrigger = null;
    };

    modal.classList.add('modal--closing');
    modal.querySelector('.modal-body')?.addEventListener('animationend', finishClosing, { once: true });
};

const openModal = (modal, trigger) => {
    if (!modal) return;

    activeModal = modal;
    modalTrigger = trigger;
    modal.classList.remove('modal--closing');
    modal.classList.add('modal--active');
    document.body.classList.add('body--modal-open');
    modal.querySelector('.modal-close')?.focus();
};

buttonsModal.forEach((button) => {
    button.addEventListener('click', () => {
        openModal(document.querySelector(`.modal[data-modal="${button.dataset.modal}"]`), button);
    });
});

document.querySelectorAll('.modal').forEach((modal) => {
    modal.querySelector('.modal-close')?.addEventListener('click', () => closeModal(modal));

    modal.querySelector('.modal-overlay')?.addEventListener('click', (event) => {
        if (event.target === event.currentTarget) closeModal(modal);
    });
});

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

    if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
    }
});
