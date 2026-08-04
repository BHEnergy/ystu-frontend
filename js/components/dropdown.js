const dropdown = document.querySelectorAll('.dropdown--item');
dropdown.forEach( (item) => {
    item.querySelector('.dropdown--header').addEventListener('click', () => {
        item.classList.toggle('open');
    });
});