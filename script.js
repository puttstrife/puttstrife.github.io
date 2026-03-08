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
        return {
            title:    item.querySelector('title')?.textContent?.trim() || 'Untitled',
            link,
            date:     item.querySelector('pubDate')?.textContent || '',
            content,
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
                <span class="blog-tag">${post.category}</span>
                <h3>${post.title}</h3>
                <div class="blog-card-meta">
                    <span class="blog-date">${date} · ${read}</span>
                    <a href="${post.link}" target="_blank" rel="noopener" class="blog-read-more">Read more →</a>
                </div>
            </div>
        </article>`;
    }).join('');
}

function renderMediumFallback() {
    const posts = [
        { tag: 'Design',  title: "If it didn't move a metric, it didn't work",                                 date: 'Mar 2026', read: '4 min read' },
        { tag: 'SEO',     title: 'A Practical 20-Step SEO Checklist That Actually Moves the Needle',           date: 'Feb 2026', read: '6 min read' },
        { tag: 'Culture', title: 'Why Asians Chase Status — And How the West Does It Differently',             date: 'Jan 2026', read: '5 min read' },
        { tag: 'Travel',  title: 'How to Get a Thailand Non-Immigrant Education Visa (Without Losing Your Mind)', date: 'Dec 2025', read: '7 min read' },
    ];
    document.getElementById('medium-posts').innerHTML = posts.map(p => `
        <article class="blog-card">
            <div class="blog-card-content">
                <span class="blog-tag">${p.tag}</span>
                <h3>${p.title}</h3>
                <div class="blog-card-meta">
                    <span class="blog-date">${p.date} · ${p.read}</span>
                    <a href="https://medium.com/@puttstrife" target="_blank" rel="noopener" class="blog-read-more">Read more →</a>
                </div>
            </div>
        </article>`).join('');
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
const NEWS_CACHE_KEY = 'tc_news_v4';
const NEWS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

const NEWS_SOURCES = [
    { name: 'TechCrunch',  url: 'https://techcrunch.com/feed/',                          topics: ['ai', 'uiux']       },
    { name: 'The Verge',   url: 'https://www.theverge.com/rss/index.xml',                topics: ['ai', 'uiux']       },
    { name: 'Dev.to',      url: 'https://dev.to/feed/',                                  topics: ['ai']               },
    { name: 'Hacker News', url: 'https://news.ycombinator.com/rss',                      topics: ['ai', 'uiux']       },
    { name: 'HBR',         url: 'https://feeds.hbr.org/harvardbusiness',                 topics: ['leadership']       },
    { name: 'Fast Company', url: 'https://www.fastcompany.com/latest/rss',               topics: ['leadership', 'uiux'] },
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

function renderNews(topic) {
    activeTopic = topic;
    const filtered = allNews
        .filter(a => matchesTopic(a, topic))
        .slice(0, 10);

    const countEl = document.getElementById('news-count');
    const grid    = document.getElementById('news-grid');

    countEl.textContent = `${filtered.length} article${filtered.length !== 1 ? 's' : ''} found`;

    document.querySelectorAll('.news-filter').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.topic === topic);
    });

    if (filtered.length === 0) {
        grid.innerHTML = '<p class="news-empty">No articles found for this topic.</p>';
        return;
    }

    grid.innerHTML = filtered.map(a => `
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
   Contact Form
───────────────────────────────────────── */
const contactForm  = document.getElementById('contact-form');
const submitBtn    = document.getElementById('submit-btn');
const successMsg   = document.getElementById('contact-success');

contactForm?.addEventListener('submit', async function (e) {
    e.preventDefault();
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled    = true;

    const payload = Object.fromEntries(new FormData(this));

    try {
        const res  = await fetch('https://api.web3forms.com/submit', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body:    JSON.stringify(payload),
        });
        const json = await res.json();

        if (json.success) {
            contactForm.style.display = 'none';
            successMsg.classList.add('visible');
        } else {
            throw new Error(json.message || 'Submission failed');
        }
    } catch {
        submitBtn.textContent = 'Failed — please try again';
        submitBtn.disabled    = false;
    }
});
