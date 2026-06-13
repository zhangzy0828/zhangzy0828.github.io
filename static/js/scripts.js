

const content_dir = 'contents/'
const config_file = 'config.yml'
const section_names = ['home', 'publications', 'awards']

let revealObserver;

function setupScrollProgress() {
    const progress = document.querySelector('.scroll-progress');
    if (!progress) {
        return;
    }

    const updateProgress = () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const width = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
        progress.style.width = width + '%';
    };

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
}

function setupResearchTyping() {
    const target = document.getElementById('research-typing');
    if (!target || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const topics = [
        'AI for Agriculture',
        'Federated Learning',
        'Large Language Models',
        'Edge Intelligence'
    ];
    let idx = 0;

    window.setInterval(() => {
        idx = (idx + 1) % topics.length;
        target.textContent = topics[idx];
    }, 2400);
}

function setupRevealObserver() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
        return;
    }

    revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
}

function registerRevealItems(root = document) {
    const items = root.querySelectorAll('.top-section, section header, section .main-body > *, .research-panel');
    items.forEach((item) => {
        if (item.classList.contains('is-visible')) {
            return;
        }
        item.classList.add('reveal-item');
        if (revealObserver) {
            revealObserver.observe(item);
        } else {
            item.classList.add('is-visible');
        }
    });
}

function addYearBadge(element, className) {
    if (element.dataset.enhanced === 'true') {
        return;
    }

    const match = element.textContent.match(/\b(20\d{2})\b/);
    if (match) {
        const badge = document.createElement('span');
        badge.className = className;
        badge.textContent = match[1];
        element.prepend(badge);
    }

    element.dataset.enhanced = 'true';
}

function enhanceRenderedSection(name) {
    const section = document.getElementById(name);
    if (!section) {
        return;
    }

    if (name === 'publications') {
        section.querySelectorAll('#publications-md p').forEach((entry) => addYearBadge(entry, 'publication-year'));
    }

    if (name === 'awards') {
        section.querySelectorAll('#awards-md li').forEach((entry) => addYearBadge(entry, 'award-year'));
    }

    registerRevealItems(section);
}


window.addEventListener('DOMContentLoaded', event => {
    setupScrollProgress();
    setupResearchTyping();
    setupRevealObserver();
    registerRevealItems();

    // Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            offset: 74,
        });
    };

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });


    // Yaml
    fetch(content_dir + config_file)
        .then(response => response.text())
        .then(text => {
            const yml = jsyaml.load(text);
            Object.keys(yml).forEach(key => {
                try {
                    document.getElementById(key).innerHTML = yml[key];
                } catch {
                    console.log("Unknown id and value: " + key + "," + yml[key].toString())
                }

            })
        })
        .catch(error => console.log(error));


    // Marked
    marked.use({ mangle: false, headerIds: false })
    section_names.forEach((name, idx) => {
        fetch(content_dir + name + '.md')
            .then(response => response.text())
            .then(markdown => {
                const html = marked.parse(markdown);
                document.getElementById(name + '-md').innerHTML = html;
            }).then(() => {
                enhanceRenderedSection(name);
                // MathJax
                MathJax.typeset();
            })
            .catch(error => console.log(error));
    })

}); 
