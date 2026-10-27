/* Клиентская проверка не заменяет независимую проверку на сервере. */
(() => {
    let id = 0;
    const phones = new WeakSet();
    const fields = new WeakSet();
    const init = (scope = document) => {
    const find = selector => [...(scope.matches?.(selector) ? [scope] : []), ...scope.querySelectorAll(selector)];
    find('input[data-validate="phone"]').forEach(input => {
        if (phones.has(input)) return;
        phones.add(input);
        input.inputMode = 'tel';
        const mask = typeof IMask === 'function' ? IMask(input, { mask: '+{7} (000) 000-00-00' }) : null;
        const validate = () => {
            const digits = input.value.replace(/\D/g, '');
            input.setCustomValidity(input.value && !(mask ? mask.masked.isComplete : /^7\d{10}$/.test(digits))
                ? 'Введите номер телефона полностью.' : '');
        };
        mask?.on('accept', validate);
        input.addEventListener('input', validate);
        input.addEventListener('change', validate);
        input.form?.addEventListener('reset', () => setTimeout(() => {
            if (mask) mask.value = input.value;
            validate();
        }));
        validate();
    });
    find('[data-ui~="modal-form"]').forEach(form => {
        form.querySelectorAll('[data-ui~="input--container"] input').forEach(input => {
            if (fields.has(input)) return;
            fields.add(input);
            const group = input.closest('[data-ui~="input--container"]');
            let error = group.querySelector('[data-ui~="error-text"]');
            if (!error) { error = document.createElement('span'); error.className = 'error-text';
    error.setAttribute('data-ui', error.className); group.append(error); }
            if (!error.id || document.getElementById(error.id) !== error) {
                do { error.id = `form-field-error-${++id}`; } while (document.getElementById(error.id) !== error && document.getElementById(error.id));
            }
            input.setAttribute('aria-describedby', [input.getAttribute('aria-describedby'), error.id].filter(Boolean).join(' '));
            if (input.name === 'name') input.addEventListener('input', () => {
                input.setCustomValidity(input.required && input.value && !input.value.trim() ? 'Укажите ФИО.' : '');
            });
            const show = () => {
                const invalid = !input.validity.valid;
                group.classList.toggle('error', invalid);
                input.setAttribute('aria-invalid', String(invalid));
                error.textContent = invalid ? input.validationMessage : '';
            };
            input.addEventListener('invalid', show);
            input.addEventListener('blur', () => { if (input.value || group.classList.contains('error')) show(); });
            input.addEventListener('input', () => { if (group.classList.contains('error')) show(); });
            form.addEventListener('reset', () => { group.classList.remove('error'); input.removeAttribute('aria-invalid'); input.setCustomValidity(''); });
        });
    });
    };
    window.Validation = { init };
    init();
})();
