document.querySelectorAll('input[data-validate="phone"]').forEach( (input) => {
    IMask(input, {
        mask: '+{7} (000) 000-00-00'
    })
});