/* =====================================================================
   Ruchira Patil — portfolio runtime
   JSON-driven rendering, inline SVG icons, no external dependencies.
   ===================================================================== */

const ACCENTS = { amber: '#E7A94E', cyan: '#6FD3C9' };

const $  = (sel, root = document) => root.querySelector(sel);
const el = (id) => document.getElementById(id);

/* Render an inline SVG icon from the sprite. */
const icon = (name, cls = 'ic') =>
    name ? `<svg class="${cls}" aria-hidden="true"><use href="#icon-${name}"/></svg>` : '';

/* Escape user-facing strings destined for innerHTML. */
const esc = (s = '') =>
    String(s).replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function getJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`${path} → ${res.status}`);
    return res.json();
}

document.addEventListener('DOMContentLoaded', init);

async function init() {
    await Promise.all([
        loadMeta(), loadNavigation(), loadHero(), loadAbout(), loadExperience(),
        loadSkills(), loadProjects(), loadEducation(), loadContact(), loadFooter(),
    ].map((p) => p.catch((e) => console.error(e))));

    // Content is in place — trigger the orchestrated hero entrance.
    document.getElementById('top')?.classList.add('in');

    initNav();
    initScrollUI();
    initReveal();
    handleInitialHash();
}

/* Content is injected after load, so a cold-load deep link (e.g. /#projects)
   has nothing to scroll to until now. Correct it once, accounting for the fixed nav. */
function handleInitialHash() {
    const hash = location.hash;
    if (!hash || hash === '#top') return;
    if (!document.querySelector(hash)) return;

    // Force an instant jump — CSS scroll-behavior: smooth would otherwise swallow this.
    const jump = () => {
        const target = document.querySelector(hash);
        if (!target) return;
        const de = document.documentElement;
        const prev = de.style.scrollBehavior;
        de.style.scrollBehavior = 'auto';
        window.scrollTo(0, target.offsetTop - 80);
        de.style.scrollBehavior = prev;
        // A programmatic jump can bypass the IntersectionObserver, so reveal what's now on screen.
        document.querySelectorAll('.reveal:not(.in)').forEach((elm) => {
            if (elm.getBoundingClientRect().top < window.innerHeight) elm.classList.add('in');
        });
    };

    requestAnimationFrame(() => {
        jump();
        const landed = Math.round(window.scrollY);
        // Images/fonts can shift layout after this first jump — re-assert once everything
        // has loaded, but only if the reader hasn't scrolled away in the meantime.
        if (document.readyState !== 'complete') {
            window.addEventListener('load', () => {
                if (Math.abs(window.scrollY - landed) < 4) jump();
            }, { once: true });
        }
    });
}

/* --------------------------------------------------------------- Meta */
async function loadMeta() {
    const d = await getJSON('data/site-config.json');
    document.title = d.title;
    const set = (name, val) => { const m = $(`meta[name="${name}"]`); if (m && val) m.setAttribute('content', val); };
    set('description', d.description);
    set('keywords', d.keywords);
    set('author', d.author);
}

/* --------------------------------------------------------------- Nav */
async function loadNavigation() {
    const d = await getJSON('data/navigation.json');
    const brand = el('nav-brand');
    brand.href = d.brand.href;
    brand.innerHTML = `<span class="brand__mono">${esc(d.brand.initials)}</span><span class="brand__name">${esc(d.brand.name)}</span>`;
    el('nav-menu').innerHTML = d.menuItems
        .map((i) => `<li><a href="${esc(i.href)}">${esc(i.text)}</a></li>`).join('');
}

/* --------------------------------------------------------------- Hero */
async function loadHero() {
    const d = await getJSON('data/hero.json');

    const status = el('hero-status');
    status.textContent = `${d.status}  ·  ${d.location}`;

    // JSON is authoritative; the static markup is the no-JS / crawler fallback.
    const setText = (sel, val) => { const n = $(sel); if (n && val) n.textContent = val; };
    setText('.hero__name', d.name);
    setText('.hero__tagline', d.tagline);
    setText('.hero__summary', d.summary);

    el('hero-metrics').innerHTML = (d.metrics || []).map((m) => `
        <div class="metric">
            <div class="metric__value">${esc(m.value)}</div>
            <span class="metric__label">${esc(m.label)}</span>
        </div>`).join('');

    el('hero-cta').innerHTML = (d.cta?.buttons || []).map((b) => {
        const cls = b.type === 'primary' ? 'btn btn--primary' : 'btn btn--ghost';
        const dl  = b.download ? ' download' : '';
        return `<a class="${cls}" href="${esc(b.href)}"${dl}>${icon(b.icon)}${esc(b.text)}</a>`;
    }).join('');

    el('hero-social').innerHTML = socialRow(d.socialLinks);
}

function socialRow(links = []) {
    return links.map((l) => `
        <a class="iconbtn" href="${esc(l.url)}" aria-label="${esc(l.platform)}"
           ${l.url.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>${icon(l.icon)}</a>`).join('');
}

function sectionHead(prefix, d) {
    if (el(`${prefix}-index`)) el(`${prefix}-index`).textContent = d.sectionIndex || '';
    if (el(`${prefix}-title`)) el(`${prefix}-title`).textContent = d.sectionTitle || '';
}

/* --------------------------------------------------------------- About */
async function loadAbout() {
    const d = await getJSON('data/about.json');
    sectionHead('about', d);
    el('about-text').innerHTML = (d.paragraphs || []).map((p) => `<p>${esc(p)}</p>`).join('');

    if (el('about-portrait') && d.image) {
        el('about-portrait').innerHTML = `
            <img src="${esc(d.image)}" alt="${esc(d.name || 'Portrait')}" width="720" height="720" loading="lazy" decoding="async">
            <figcaption>
                <span class="portrait__dot"></span>
                <span>${esc(d.name || '')}</span>
            </figcaption>`;
    }

    if (el('about-specs')) {
        el('about-specs').innerHTML = (d.specs || []).map((s) => `
            <div><dt>${esc(s.k)}</dt><dd>${esc(s.v)}</dd></div>`).join('');
    }

    el('about-stats').innerHTML = (d.statistics || []).map((s) => `
        <div class="cell">
            <div class="cell__num">${esc(s.value)}</div>
            <div class="cell__lbl">${esc(s.label)}</div>
        </div>`).join('');
}

/* Company logo badge: real brand mark, monogram, or role-icon fallback. */
function xpLogo(x) {
    const lg = x.logo;
    if (lg?.type === 'brand') return `<span class="xp__logo xp__logo--brand" title="${esc(x.company)}">${icon(lg.name, 'brandmark')}</span>`;
    if (lg?.type === 'mono')  return `<span class="xp__logo xp__logo--mono" title="${esc(x.company)}">${esc(lg.text)}</span>`;
    return `<span class="xp__logo xp__logo--brand">${icon(x.icon || 'briefcase')}</span>`;
}

/* --------------------------------------------------------------- Experience */
async function loadExperience() {
    const d = await getJSON('data/experience.json');
    sectionHead('experience', d);
    el('experience-timeline').innerHTML = (d.experiences || []).map((x) => `
        <article class="xp" data-accent="${esc(x.accent || 'amber')}">
            <div class="xp__meta">
                ${xpLogo(x)}
                <span class="xp__period">${esc(x.period)}</span>
                <span class="xp__type">${esc(x.type || '')}</span>
            </div>
            <div class="xp__body">
                <h3 class="xp__role">${esc(x.title)} <span class="xp__company">· ${esc(x.company)}</span></h3>
                ${x.summary ? `<p class="xp__summary">${esc(x.summary)}</p>` : ''}
                ${x.responsibilities?.length ? `<ul class="xp__list">${x.responsibilities.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
                ${x.tech?.length ? `<div class="tags">${x.tech.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
            </div>
        </article>`).join('');
}

/* --------------------------------------------------------------- Skills */
async function loadSkills() {
    const d = await getJSON('data/skills.json');
    sectionHead('skills', d);
    el('skills-grid').innerHTML = (d.categories || []).map((c) => `
        <div class="skillcat" data-accent="${esc(c.accent || 'amber')}">
            <div class="skillcat__head">
                <span class="skillcat__icon">${icon(c.icon || 'code')}</span>
                <h3 class="skillcat__title">${esc(c.category)}</h3>
            </div>
            <div class="skillcat__list">${(c.skills || []).map((s) => `<span class="tag">${esc(s)}</span>`).join('')}</div>
        </div>`).join('');
}

/* --------------------------------------------------------------- Projects */
async function loadProjects() {
    const d = await getJSON('data/projects.json');
    sectionHead('projects', d);
    if (el('projects-note')) el('projects-note').textContent = d.note || '';

    el('projects-grid').innerHTML = (d.projects || []).map((p) => {
        const a = ACCENTS[p.accent] || ACCENTS.amber;
        const ang = ((p.seed || 1) * 37) % 360;
        const id = `PRJ_${String(p.seed || 0).padStart(2, '0')}`;
        const links = (p.links || []).map((l) =>
            `<a class="plink" href="${esc(l.href)}" target="_blank" rel="noopener">${icon(l.icon || 'external')}${esc(l.label)}</a>`).join('');
        const cover = p.image
            ? `<div class="pcard__cover pcard__cover--img">
                   <img src="${esc(p.image)}" alt="Illustration for ${esc(p.title)}" loading="lazy" decoding="async" width="1200" height="800">
                   <span class="pcard__seed">${id}</span>
                   <span class="pcard__year">${esc(p.year || '')}</span>
               </div>`
            : `<div class="pcard__cover" style="--a:${a}; --ang:${ang}deg">
                   <span class="glyph">${String(p.seed || 0).padStart(2, '0')}</span>
                   <span class="pcard__seed">${id}</span>
                   <span class="pcard__year">${esc(p.year || '')}</span>
               </div>`;
        return `
        <article class="pcard" data-accent="${esc(p.accent || 'amber')}">
            ${cover}
            <div class="pcard__body">
                <span class="pcard__ctx">${esc(p.context || '')}</span>
                <h3 class="pcard__title">${esc(p.title)}</h3>
                <p class="pcard__desc">${esc(p.description)}</p>
                <div class="pcard__foot">
                    <div class="tags">${(p.tech || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
                    ${links ? `<div class="pcard__links">${links}</div>` : ''}
                </div>
            </div>
        </article>`;
    }).join('');
}

/* --------------------------------------------------------------- Education */
async function loadEducation() {
    const d = await getJSON('data/education.json');
    sectionHead('education', d);
    el('education-grid').innerHTML = (d.education || []).map((e) => `
        <div class="educard" data-accent="${esc(e.accent || 'amber')}">
            <span class="educard__period">${esc(e.period)}</span>
            <h3 class="educard__degree">${esc(e.degree)}</h3>
            <p class="educard__inst">${esc(e.institution)}</p>
            ${e.location ? `<p class="educard__loc">${esc(e.location)}</p>` : ''}
            ${e.detail ? `<span class="educard__detail">${esc(e.detail)}</span>` : ''}
        </div>`).join('');

    if (el('certifications-title')) el('certifications-title').textContent = d.certificationsTitle || 'Certifications';
    el('certifications-grid').innerHTML = (d.certifications || []).map((c) => `
        <li class="cert">
            ${icon('doc')}
            <div>
                <div class="cert__title">${esc(c.title)}</div>
                <div class="cert__issuer">${esc(c.issuer)}</div>
            </div>
        </li>`).join('');
}

/* --------------------------------------------------------------- Contact */
async function loadContact() {
    const d = await getJSON('data/contact.json');
    sectionHead('contact', d);
    if (el('contact-subtitle')) el('contact-subtitle').textContent = d.subtitle || '';

    el('contact-grid').innerHTML = (d.channels || []).map((c) => {
        const inner = `
            <span class="channel__icon">${icon(c.icon)}</span>
            <div>
                <div class="channel__label">${esc(c.label)}</div>
                <div class="channel__value">${esc(c.value)}</div>
            </div>`;
        return c.href
            ? `<a class="channel" data-accent="${esc(c.accent || 'amber')}" href="${esc(c.href)}" ${c.href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>${inner}</a>`
            : `<div class="channel" data-accent="${esc(c.accent || 'amber')}">${inner}</div>`;
    }).join('');

    const actions = el('contact-actions');
    const parts = [];
    if (d.copyEmail) {
        parts.push(`<button class="copybtn" id="copy-email" data-email="${esc(d.copyEmail)}">${icon('copy')}<span>Copy email</span></button>`);
    }
    if (d.resume) {
        parts.push(`<a class="btn btn--ghost" href="${esc(d.resume.href)}" download>${icon(d.resume.icon)}${esc(d.resume.text)}</a>`);
    }
    actions.innerHTML = parts.join('');

    const copyBtn = el('copy-email');
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            const email = copyBtn.dataset.email;
            try { await navigator.clipboard.writeText(email); }
            catch { /* clipboard blocked — fall through to visual confirm */ }
            copyBtn.classList.add('copied');
            copyBtn.innerHTML = `${icon('check')}<span>Copied</span>`;
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyBtn.innerHTML = `${icon('copy')}<span>Copy email</span>`;
            }, 1800);
        });
    }
}

/* --------------------------------------------------------------- Footer */
async function loadFooter() {
    const d = await getJSON('data/footer.json');
    if (el('footer-name')) el('footer-name').textContent = d.name;
    if (el('footer-tagline')) el('footer-tagline').textContent = d.tagline;
    if (el('footer-copyright')) el('footer-copyright').textContent = d.copyright;
    el('footer-social').innerHTML = socialRow(d.socialLinks);
}

/* --------------------------------------------------------------- Nav behaviour */
function initNav() {
    const toggle = el('nav-toggle');
    const menu = el('nav-menu');

    const setMenu = (open) => {
        menu.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.querySelector('use').setAttribute('href', open ? '#icon-close' : '#icon-menu');
    };

    toggle?.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
    menu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.classList.contains('open')) {
            setMenu(false);
            toggle.focus();
        }
    });
}

/* --------------------------------------------------------------- Scroll UI (navbar, active link, back-to-top) */
function initScrollUI() {
    const nav = el('nav');
    const toTop = el('to-top');
    const links = [...document.querySelectorAll('#nav-menu a')];
    const sections = links
        .map((l) => document.querySelector(l.getAttribute('href')))
        .filter(Boolean);

    const onScroll = () => {
        const y = window.scrollY;
        nav.classList.toggle('scrolled', y > 40);
        toTop.classList.toggle('visible', y > 480);

        let current = '';
        for (const s of sections) {
            if (y >= s.offsetTop - 140) current = s.id;
        }
        links.forEach((l) => {
            const on = l.getAttribute('href') === `#${current}`;
            l.classList.toggle('active', on);
            if (on) l.setAttribute('aria-current', 'true');
            else l.removeAttribute('aria-current');
        });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* --------------------------------------------------------------- Reveal on scroll */
function initReveal() {
    const targets = document.querySelectorAll('.section__head, .about, .readout-strip, .xp, .skillcat, .pcard, .educard, .cert, .channel');
    targets.forEach((t) => t.classList.add('reveal'));

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        targets.forEach((t) => t.classList.add('in'));
        return;
    }

    const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    targets.forEach((t) => io.observe(t));
}
