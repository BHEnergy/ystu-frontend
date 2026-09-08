(() => {
    const groups = document.querySelectorAll('.university-statistics__numbers');
    const gsap = window.gsap;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const activeCounters = new Set();

    window.UniversityStatistics = {};

    if (!gsap || !groups.length || !('IntersectionObserver' in window)) return;

    const animateGroup = (group) => {
        if (reducedMotion.matches) return;

        group.querySelectorAll('.university-statistics__number').forEach((element) => {
            const original = element.textContent.trim();
            const match = original.match(/^(\D*)(\d[\d\s\u00a0\u202f]*)(\D*)$/);
            if (!match) return;

            const [, prefix, digits, suffix] = match;
            const target = Number(digits.replace(/\s/g, ''));
            if (!Number.isSafeInteger(target)) return;

            const separator = digits.match(/\s/)?.[0];
            const format = (value) => {
                const number = String(Math.round(value));
                return prefix + (separator ? number.replace(/\B(?=(\d{3})+(?!\d))/g, separator) : number) + suffix;
            };

            // Для скринридера итог остаётся неизменным на протяжении анимации.
            element.setAttribute('aria-label', original);
            const visual = document.createElement('span');
            visual.setAttribute('aria-hidden', 'true');
            visual.textContent = format(0);
            element.replaceChildren(visual);

            const counter = { value: 0, tween: null, finish: null };
            counter.finish = () => {
                visual.textContent = original;
                activeCounters.delete(counter);
            };
            activeCounters.add(counter);
            counter.tween = gsap.to(counter, {
                value: target,
                duration: 4,
                ease: 'power1.out',
                onUpdate: () => { visual.textContent = format(counter.value); },
                onComplete: counter.finish,
            });
        });
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            observer.unobserve(entry.target);
            animateGroup(entry.target);
        });
    }, { threshold: 0.8 });

    groups.forEach((group) => observer.observe(group));

    reducedMotion.addEventListener('change', () => {
        if (!reducedMotion.matches) return;
        activeCounters.forEach((counter) => {
            counter.tween.kill();
            counter.finish();
        });
    });
})();
