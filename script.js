/* ─────────────────────────────────────────
   Medium RSS Feed
───────────────────────────────────────── */
const MEDIUM_FEED = 'https://medium.com/feed/@puttstrife';
const PROXY       = 'https://corsproxy.io/?' + encodeURIComponent(MEDIUM_FEED);

function estimateReadTime(text) {
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / 200)) + ' min read';
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}

function parseMediumFeed(xmlText) {
    const parser = new DOMParser();
    const xml    = parser.parseFromString(xmlText, 'text/xml');
    const items  = Array.from(xml.querySelectorAll('item')).slice(0, 4);

    return items.map(item => {
        const linkEl  = item.querySelector('link');
        const link    = linkEl?.nextSibling?.textContent?.trim()
                     || linkEl?.textContent?.trim()
                     || '#';
        const content = item.querySelector('encoded')?.textContent
                     || item.querySelector('description')?.textContent
                     || '';
        const plainText = stripHtml(content);
        const subtitle  = plainText.trim().replace(/\s+/g, ' ').slice(0, 120).trim() + '…';
        return {
            title:    item.querySelector('title')?.textContent?.trim() || 'Untitled',
            link,
            date:     item.querySelector('pubDate')?.textContent || '',
            content,
            subtitle,
            author:   item.querySelector('creator')?.textContent?.trim() || 'Jeffrey Farañal',
            category: item.querySelector('category')?.textContent || 'Article',
        };
    });
}

function renderMediumPosts(posts) {
    document.getElementById('medium-posts').innerHTML = posts.map(post => {
        const date = formatDate(post.date);
        const read = estimateReadTime(stripHtml(post.content));
        return `
        <article class="blog-card">
            <div class="blog-card-content">
                <div class="blog-card-header">
                    <span class="blog-tag">${post.category}</span>
                    <span class="blog-date">${read}</span>
                </div>
                <h3>${post.title}</h3>
                <p class="blog-subtitle">${post.subtitle}</p>
                <div class="blog-card-meta">
                    <span class="blog-author">By ${post.author}</span>
                    <a href="${post.link}" target="_blank" rel="noopener" class="blog-read-more">Read more</a>
                </div>
            </div>
        </article>`;
    }).join('');
    staggerReveal('#medium-posts', '.blog-card');
}

function renderMediumFallback() {
    const posts = [
        { tag: 'Design',  title: "If it didn't move a metric, it didn't work",                                    subtitle: "Design work that can't be measured is just art. Here's how I tie every design decision to a real business outcome.",           date: 'Mar 2026', read: '4 min read' },
        { tag: 'SEO',     title: 'A Practical 20-Step SEO Checklist That Actually Moves the Needle',               subtitle: "Most SEO advice is noise. This is the exact checklist I run through before every launch — and it works.",                    date: 'Feb 2026', read: '6 min read' },
        { tag: 'Culture', title: 'Why Asians Chase Status — And How the West Does It Differently',                 subtitle: "After a decade of living across cultures, I started noticing a pattern in how people signal success — and what it costs them.", date: 'Jan 2026', read: '5 min read' },
        { tag: 'Travel',  title: 'How to Get a Thailand Non-Immigrant Education Visa (Without Losing Your Mind)',   subtitle: "The complete guide I wish I had when I first tried to stay in Thailand long-term. Visas, paperwork, and hard-won lessons.",    date: 'Dec 2025', read: '7 min read' },
    ];
    document.getElementById('medium-posts').innerHTML = posts.map(p => `
        <article class="blog-card">
            <div class="blog-card-content">
                <div class="blog-card-header">
                    <span class="blog-tag">${p.tag}</span>
                    <span class="blog-date">${p.read}</span>
                </div>
                <h3>${p.title}</h3>
                <p class="blog-subtitle">${p.subtitle}</p>
                <div class="blog-card-meta">
                    <span class="blog-author">By Jeffrey Farañal</span>
                    <a href="https://medium.com/@puttstrife" target="_blank" rel="noopener" class="blog-read-more">Read more</a>
                </div>
            </div>
        </article>`).join('');
    staggerReveal('#medium-posts', '.blog-card');
}

fetch(PROXY)
    .then(res => { if (!res.ok) throw new Error(); return res.text(); })
    .then(xml => {
        const posts = parseMediumFeed(xml);
        posts.length > 0 ? renderMediumPosts(posts) : renderMediumFallback();
    })
    .catch(renderMediumFallback);


/* ─────────────────────────────────────────
   Tech News Aggregator
───────────────────────────────────────── */
const NEWS_CACHE_KEY = 'tc_news_v5';
const NEWS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

const NEWS_SOURCES = [
    { name: 'TechCrunch',       url: 'https://techcrunch.com/feed/',                     topics: ['ai', 'uiux']         },
    { name: 'The Verge',        url: 'https://www.theverge.com/rss/index.xml',           topics: ['ai', 'uiux']         },
    { name: 'Dev.to',           url: 'https://dev.to/feed/',                             topics: ['ai']                 },
    { name: 'Wired',            url: 'https://www.wired.com/feed/rss',                   topics: ['ai', 'uiux']         },
    { name: 'Smashing Magazine', url: 'https://www.smashingmagazine.com/feed/',          topics: ['uiux']               },
    { name: 'HBR',              url: 'https://feeds.hbr.org/harvardbusiness',            topics: ['leadership']         },
    { name: 'Fast Company',     url: 'https://www.fastcompany.com/latest/rss',           topics: ['leadership', 'uiux'] },
];

const TOPIC_KEYWORDS = {
    ai: [
        'ai', 'artificial intelligence', 'machine learning', 'chatgpt', 'llm',
        'gpt', 'openai', 'gemini', 'claude', 'generative', 'neural', 'deep learning',
        'large language', 'stable diffusion', 'midjourney', 'copilot',
    ],
    uiux: [
        'ui', 'ux', 'user experience', 'user interface', 'figma', 'prototype',
        'wireframe', 'accessibility', 'product design', 'interaction design',
        'design system', 'typography', 'usability', 'information architecture',
    ],
    leadership: [
        'leadership', 'management', 'design lead', 'design manager', 'cto',
        'vp of design', 'design director', 'team culture', 'hiring', 'career',
        'mentorship', 'strategy', 'org design', 'remote team',
    ],
};

let allNews = [];
let activeTopic = 'all';

function matchesTopic(article, topic) {
    if (topic === 'all') return true;
    const text   = `${article.title} ${article.description}`.toLowerCase();
    const source = NEWS_SOURCES.find(s => s.name === article.source);
    // If source has topic restrictions, only match within its allowed topics
    if (source?.topics && !source.topics.includes(topic)) return false;
    return (TOPIC_KEYWORDS[topic] || []).some(kw => text.includes(kw));
}

function timeAgo(dateStr) {
    const diff  = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3_600_000);
    const days  = Math.floor(diff / 86_400_000);
    if (hours < 1)  return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 30)  return `${days}d ago`;
    return formatDate(dateStr);
}

const NEWS_PAGE_SIZE = 4;

function buildNewsCards(articles) {
    return articles.map(a => `
        <article class="news-card">
            <div class="news-card-header">
                <span class="news-source">${a.source}</span>
                <span class="news-time">${timeAgo(a.pubDate)}</span>
            </div>
            <h3 class="news-title">
                <a href="${a.link}" target="_blank" rel="noopener">${a.title}</a>
            </h3>
            ${a.author ? `<p class="news-author">By ${a.author}</p>` : ''}
            <p class="news-desc">${a.description.slice(0, 130).trim()}…</p>
        </article>`).join('');
}

function renderNews(topic, showAll = false) {
    activeTopic = topic;
    const all      = allNews.filter(a => matchesTopic(a, topic));
    const visible  = showAll ? all : all.slice(0, NEWS_PAGE_SIZE);
    const hasMore  = !showAll && all.length > NEWS_PAGE_SIZE;

    const countEl = document.getElementById('news-count');
    const grid    = document.getElementById('news-grid');

    countEl.textContent = `${all.length} article${all.length !== 1 ? 's' : ''} found`;

    document.querySelectorAll('.news-filter').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.topic === topic);
    });

    if (all.length === 0) {
        grid.innerHTML = '<p class="news-empty">No articles found for this topic.</p>';
        return;
    }

    grid.innerHTML = buildNewsCards(visible)
        + (hasMore ? `
        <div class="news-see-more-wrap">
            <button class="news-see-more-btn" id="news-see-more">
                See all ${all.length} articles
            </button>
        </div>` : '');

    document.getElementById('news-see-more')
        ?.addEventListener('click', () => renderNews(topic, true));
    staggerReveal('#news-grid', '.news-card');
}

async function fetchNewsFeed(source) {
    const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(source.url);
    try {
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error();
        const xml = await res.text();

        const parser = new DOMParser();
        const doc    = parser.parseFromString(xml, 'text/xml');

        // Support both RSS <item> and Atom <entry>
        const items = Array.from(doc.querySelectorAll('item, entry')).slice(0, 20);

        return items.map(item => {
            // Title
            const title = item.querySelector('title')?.textContent?.trim() || 'Untitled';

            // Link — Atom uses href attribute, RSS uses text node
            const linkEl = item.querySelector('link');
            const link   = linkEl?.getAttribute('href')
                        || linkEl?.nextSibling?.textContent?.trim()
                        || linkEl?.textContent?.trim()
                        || '#';

            // Description
            const descEl    = item.querySelector('description, summary, content');
            const description = stripHtml(descEl?.textContent || '');

            // Author
            const author = item.querySelector('author > name, creator, author')
                              ?.textContent?.trim() || '';

            // Date
            const pubDate = item.querySelector('pubDate, published, updated')
                               ?.textContent?.trim() || '';

            return { title, link, author, pubDate, description, source: source.name };
        }).filter(a => a.title !== 'Untitled' && a.link !== '#');
    } catch {
        return [];
    }
}

async function loadNews() {
    // Try cache first
    try {
        const cached = JSON.parse(localStorage.getItem(NEWS_CACHE_KEY));
        if (cached && Date.now() - cached.timestamp < NEWS_CACHE_TTL) {
            allNews = cached.articles;
            renderNews(activeTopic);
            return;
        }
    } catch { /* ignore */ }

    // Fetch all feeds in parallel, ignore individual failures
    const results = await Promise.allSettled(NEWS_SOURCES.map(fetchNewsFeed));
    allNews = results
        .flatMap((r, i) => {
            if (r.status !== 'fulfilled') return [];
            const source   = NEWS_SOURCES[i];
            const articles = r.value;

            if (source.name === 'Dev.to') {
                // Only 1 AI article from Dev.to
                return articles.filter(a => matchesTopic(a, 'ai')).slice(0, 1);
            }
            // Max 2 articles per source
            return articles.slice(0, 2);
        })
        .filter(a => a.title && a.link)
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    // Cache results
    try {
        localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), articles: allNews }));
    } catch { /* storage full, skip */ }

    renderNews(activeTopic);
}

// Wire up filter buttons
document.querySelectorAll('.news-filter').forEach(btn => {
    btn.addEventListener('click', () => renderNews(btn.dataset.topic));
});

loadNews();


/* ─────────────────────────────────────────
   Input Validation
───────────────────────────────────────── */
function validateName(value) {
    const v = value.trim();
    if (!v)                        return 'Name is required.';
    if (v.length < 2)              return 'Name must be at least 2 characters.';
    if (v.length > 60)             return 'Name must be 60 characters or fewer.';
    // Allow letters (including accented), spaces, hyphens, apostrophes, and dots only
    if (!/^[a-zA-ZÀ-ÿ\s'\-.]+$/.test(v)) return 'Name may only contain letters, spaces, hyphens, or apostrophes. No symbols or code allowed.';
    return null;
}

function validateEmail(value) {
    const v = value.trim();
    if (!v)                              return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(v)) return 'Please enter a valid email address (e.g. you@example.com).';
    return null;
}

function showFieldError(inputEl, message) {
    inputEl.classList.add('input-error');
    let err = inputEl.parentNode.querySelector('.field-error');
    if (!err) {
        err = document.createElement('span');
        err.className = 'field-error';
        inputEl.parentNode.appendChild(err);
    }
    err.textContent = message;
}

function clearFieldError(inputEl) {
    inputEl.classList.remove('input-error');
    const err = inputEl.parentNode.querySelector('.field-error');
    if (err) err.remove();
}

/* ─────────────────────────────────────────
   Custom Booking Calendar
───────────────────────────────────────── */
const TIME_SLOTS   = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];
const MONTH_NAMES  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES    = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// ── Replace this URL after deploying your Google Apps Script ──
const GCAL_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyrXpvEYSzcIf7iiFMJoL48QOSYDOyFml-4JtbKICSIR7C8LhBGpaw1dT4L8IUMSEGVOg/exec';

let calYear, calMonth, calSelectedDate, calSelectedTime;

/* ── Modal helpers ── */
function openModal(id) {
    document.getElementById(id).classList.add('open');
    document.body.style.overflow = 'hidden';
}
function closeModal(id) {
    document.getElementById(id).classList.remove('open');
    document.body.style.overflow = '';
}

function openBookingModal() {
    const formatted = new Date(calSelectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
    document.getElementById('booking-modal-subtitle').textContent = '📅 ' + formatted + ' · ' + calSelectedTime;
    document.getElementById('booking-form-container').innerHTML = `
        <form class="cal-booking-form" id="cal-booking-form" novalidate>
            <div class="cal-field-wrap">
                <input type="text"  name="cal_name"  placeholder="Your name"  autocomplete="name">
            </div>
            <div class="cal-field-wrap">
                <input type="email" name="cal_email" placeholder="Your email" autocomplete="email">
            </div>
            <button type="submit" class="cal-confirm-btn" id="cal-confirm-btn">Confirm Booking</button>
        </form>`;
    document.getElementById('cal-booking-form').addEventListener('submit', calSubmitBooking);
    openModal('booking-modal-overlay');
}
function closeBookingModal(e) {
    if (e && e.target !== document.getElementById('booking-modal-overlay')) return;
    closeModal('booking-modal-overlay');
}

function openContactModal() { openModal('contact-modal-overlay'); }
function closeContactModal(e) {
    if (e && e.target !== document.getElementById('contact-modal-overlay')) return;
    closeModal('contact-modal-overlay');
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeModal('booking-modal-overlay');
        closeModal('contact-modal-overlay');
    }
});

function initCalendar() {
    const now = new Date();
    calYear  = now.getFullYear();
    calMonth = now.getMonth();
    renderCalendar();
}

function renderCalendar() {
    const container = document.getElementById('custom-calendar');
    if (!container) return;

    const today       = new Date(); today.setHours(0,0,0,0);
    const firstDay    = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const startOffset = (firstDay === 0) ? 6 : firstDay - 1;
    const atMinMonth  = new Date(calYear, calMonth, 1) <= today;

    let daysHtml = DAY_NAMES.map(d => `<span>${d}</span>`).join('');
    let gridHtml = '';
    for (let i = 0; i < startOffset; i++) gridHtml += `<div class="cal-day"></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
        const date      = new Date(calYear, calMonth, d);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const isPast    = date < today;
        const dateStr   = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const isSelected = dateStr === calSelectedDate;
        const cls = ['cal-day', isWeekend || isPast ? 'disabled' : 'available', isSelected ? 'selected' : ''].filter(Boolean).join(' ');
        const click = (!isWeekend && !isPast) ? `onclick="calPickDate('${dateStr}')"` : '';
        gridHtml += `<div class="${cls}" ${click}>${d}</div>`;
    }

    const timesColHtml = calSelectedDate ? `
        <div class="cal-time-col">
            <div class="cal-timeslots">
                <p class="cal-timeslot-label">Pick a time</p>
                <div class="cal-times">
                    ${TIME_SLOTS.map(t => `<button class="cal-time ${t === calSelectedTime ? 'selected' : ''}" onclick="calPickTime('${t}')">${t}</button>`).join('')}
                </div>
            </div>
        </div>` : '';

    const bookingHtml = (calSelectedDate && calSelectedTime) ? `
        <div class="cal-schedule-btn-wrap">
            <button class="cal-schedule-btn" onclick="openBookingModal()">Set Schedule →</button>
        </div>` : '';

    container.innerHTML = `
        <div class="cal-header">
            <button class="cal-nav" onclick="calChangeMonth(-1)" ${atMinMonth ? 'disabled' : ''}>‹</button>
            <span class="cal-month-label">${MONTH_NAMES[calMonth]} ${calYear}</span>
            <button class="cal-nav" onclick="calChangeMonth(1)">›</button>
        </div>
        <div class="cal-body">
            <div class="cal-grid-col">
                <div class="cal-weekdays">${daysHtml}</div>
                <div class="cal-grid">${gridHtml}</div>
            </div>
            ${timesColHtml}
        </div>
        ${bookingHtml}`;

}

function calChangeMonth(dir) {
    calMonth += dir;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    if (calMonth < 0)  { calMonth = 11; calYear--; }
    renderCalendar();
}

function calPickDate(dateStr) {
    calSelectedDate = dateStr;
    calSelectedTime = null;
    renderCalendar();
}

function calPickTime(time) {
    calSelectedTime = time;
    renderCalendar();
}

async function calSubmitBooking(e) {
    e.preventDefault();

    const nameInput  = e.target.cal_name;
    const emailInput = e.target.cal_email;
    const name       = nameInput.value.trim();
    const email      = emailInput.value.trim();

    clearFieldError(nameInput);
    clearFieldError(emailInput);

    const nameErr  = validateName(name);
    const emailErr = validateEmail(email);
    if (nameErr)  { showFieldError(nameInput,  nameErr);  return; }
    if (emailErr) { showFieldError(emailInput, emailErr); return; }

    const btn = document.getElementById('cal-confirm-btn');
    btn.textContent = 'Booking…';
    btn.disabled    = true;
    const formatted = new Date(calSelectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });

    // Try Google Calendar via Apps Script first
    const scriptReady = GCAL_SCRIPT_URL && !GCAL_SCRIPT_URL.startsWith('PASTE');
    let gcalOk = false;

    if (scriptReady) {
        try {
            const params = new URLSearchParams({ name, email, date: calSelectedDate, time: calSelectedTime });
            await fetch(GCAL_SCRIPT_URL + '?' + params.toString(), { mode: 'no-cors' });
            gcalOk = true;
        } catch { /* fall through to email notification */ }
    }

    // Always send email notification via Web3Forms
    try {
        const res  = await fetch('https://api.web3forms.com/submit', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
                access_key: '03657e8a-ab0f-4d25-be91-76d8ad81c7b1',
                subject:    `📅 Meeting Request: ${name} — ${formatted} at ${calSelectedTime}`,
                name,
                email,
                message: `${name} has requested a 30-min call.\n\nDate: ${formatted}\nTime: ${calSelectedTime}\nEmail: ${email}${gcalOk ? '\n\n✓ Event added to Google Calendar.' : ''}`,
            }),
        });
        const json = await res.json();
        if (!json.success) throw new Error();

        document.getElementById('booking-form-container').innerHTML = `
            <div class="cal-success">
                <svg class="cylon-sprite" xmlns="http://www.w3.org/2000/svg"
                     viewBox="0 0 96 112" width="96" height="112"
                     shape-rendering="crispEdges" aria-hidden="true">
                    <!-- helmet top -->
                    <rect x="24" y="0"  width="48" height="8" fill="#a8a8a8"/>
                    <rect x="16" y="8"  width="64" height="8" fill="#b8b8b8"/>
                    <!-- highlight ridge -->
                    <rect x="8"  y="16" width="80" height="8" fill="#d0d0d0"/>
                    <!-- visor surround row top -->
                    <rect x="8"  y="24" width="16" height="8" fill="#888"/>
                    <rect x="24" y="24" width="48" height="8" fill="#282828"/>
                    <rect x="72" y="24" width="16" height="8" fill="#888"/>
                    <!-- eye row -->
                    <rect x="8"  y="32" width="16" height="8" fill="#707070"/>
                    <rect x="24" y="32" width="48" height="8" fill="#101010"/>
                    <rect x="72" y="32" width="16" height="8" fill="#707070"/>
                    <!-- scanning eye glow (animated) -->
                    <rect class="cylon-eye-glow" x="24" y="33" width="10" height="6" fill="#e4e4e4"/>
                    <!-- visor surround row bottom -->
                    <rect x="8"  y="40" width="16" height="8" fill="#888"/>
                    <rect x="24" y="40" width="48" height="8" fill="#282828"/>
                    <rect x="72" y="40" width="16" height="8" fill="#888"/>
                    <!-- lower helmet -->
                    <rect x="8"  y="48" width="80" height="8" fill="#a0a0a0"/>
                    <rect x="16" y="56" width="64" height="8" fill="#909090"/>
                    <!-- neck -->
                    <rect x="32" y="64" width="32" height="8" fill="#686868"/>
                    <!-- shoulders -->
                    <rect x="0"  y="72" width="96" height="8" fill="#848484"/>
                    <!-- chest plate -->
                    <rect x="0"  y="80" width="96" height="8" fill="#606060"/>
                    <!-- chest detail stripe -->
                    <rect x="16" y="88" width="64" height="4" fill="#484848"/>
                    <!-- lower chest -->
                    <rect x="0"  y="92" width="96" height="8" fill="#505050"/>
                    <!-- base -->
                    <rect x="8"  y="100" width="80" height="8" fill="#383838"/>
                    <!-- chest center light (static dim) -->
                    <rect x="44" y="81" width="8" height="6" fill="#b0b0b0" opacity="0.5"/>
                </svg>
                <h4>You're booked!</h4>
                <p>${formatted} at ${calSelectedTime}.<br>A confirmation will be sent to ${email}.</p>
            </div>`;
    } catch {
        btn.textContent = 'Failed — try again';
        btn.disabled    = false;
    }
}


initCalendar();

/* ─────────────────────────────────────────
   Contact Form
───────────────────────────────────────── */
document.getElementById('contact-form')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nameInput  = document.getElementById('contact-name');
    const emailInput = document.getElementById('contact-email');

    clearFieldError(nameInput);
    clearFieldError(emailInput);

    const nameErr  = validateName(nameInput.value);
    const emailErr = validateEmail(emailInput.value);
    if (nameErr)  { showFieldError(nameInput,  nameErr);  return; }
    if (emailErr) { showFieldError(emailInput, emailErr); return; }

    const btn = document.getElementById('submit-btn');
    btn.textContent = 'Sending…';
    btn.disabled    = true;

    const payload = Object.fromEntries(new FormData(this));

    try {
        const res  = await fetch('https://api.web3forms.com/submit', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body:    JSON.stringify(payload),
        });
        const json = await res.json();

        if (json.success) {
            this.style.display = 'none';
            document.getElementById('contact-success').classList.add('visible');
        } else {
            throw new Error(json.message || 'Submission failed');
        }
    } catch {
        btn.textContent = 'Failed — please try again';
        btn.disabled    = false;
    }
});

/* ─────────────────────────────────────────
   Scroll Animations
───────────────────────────────────────── */
function staggerReveal(containerSel, cardSel) {
    const container = document.querySelector(containerSel);
    if (!container) return;
    const cards = container.querySelectorAll(cardSel);
    cards.forEach((card, i) => {
        card.classList.add('reveal');
        card.style.transitionDelay = `${i * 0.09}s`;
    });
    const obs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.querySelectorAll(cardSel).forEach(c => c.classList.add('visible'));
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    obs.observe(container);
}

function initScrollAnimations() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    const els = document.querySelectorAll(
        '.blog-heading, .blog-subheading, ' +
        '.usecases-heading, .usecases-subheading, .usecases-card, ' +
        '.feed-heading, .feed-subheading, .tweet-list, .feed-follow-btn, ' +
        '.news-heading, .news-subheading, .news-filters, ' +
        '.contact-heading, .contact-subheading, .contact-cal-card, .contact-secondary'
    );
    els.forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });

    // Stagger static tweet cards
    staggerReveal('.tweet-list', '.tweet-card');
}

initScrollAnimations();
