/* Клиентская проверка не заменяет независимую проверку на сервере. */
(() => {
    let id = 0;
    document.querySelectorAll('input[data-validate="phone"]').forEach(input => {
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
    document.querySelectorAll('.modal-form').forEach(form => {
        form.querySelectorAll('.input--container input').forEach(input => {
            const group = input.closest('.input--container');
            let error = group.querySelector('.error-text');
            if (!error) { error = document.createElement('span'); error.className = 'error-text'; group.append(error); }
            error.id ||= `form-field-error-${++id}`;
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
    window.Validation = {};
})();
