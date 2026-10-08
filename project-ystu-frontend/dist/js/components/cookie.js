/* Куки */
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
}

function getCookie(name) {
    const cookieName = name + '=';
    return document.cookie.split(';').find(c => c.trim().startsWith(cookieName))?.split('=')[1] || '';
}

const banner = document.querySelector('.cookie-banner');

if (banner && getCookie('cookieConsent') === 'accepted') {
    banner.style.display = 'none'; // Убедимся, что баннер скрыт
} else if (banner) {
    banner.style.display = 'block'; // Или 'block', в зависимости от макета
}

document.getElementById('cookieAccept')?.addEventListener('click', function () {
    setCookie('cookieConsent', 'accepted', 365);
    if (banner) banner.style.display = 'none';
});
