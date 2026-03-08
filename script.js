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

function parseFeed(xmlText) {
    const parser = new DOMParser();
    const xml    = parser.parseFromString(xmlText, 'text/xml');
    const items  = Array.from(xml.querySelectorAll('item')).slice(0, 4);

    return items.map(item => {
        // Medium puts the URL as text between <link> tags (after a CDATA comment)
        const linkEl   = item.querySelector('link');
        const link     = linkEl?.nextSibling?.textContent?.trim()
                      || linkEl?.textContent?.trim()
                      || '#';
        const content  = item.querySelector('encoded')?.textContent
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

function renderPosts(posts) {
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

function renderFallback() {
    const posts = [
        { tag: 'Design',   title: 'If it didn\'t move a metric, it didn\'t work',                              date: 'Mar 2026', read: '4 min read' },
        { tag: 'SEO',      title: 'A Practical 20-Step SEO Checklist That Actually Moves the Needle',          date: 'Feb 2026', read: '6 min read' },
        { tag: 'Culture',  title: 'Why Asians Chase Status — And How the West Does It Differently',            date: 'Jan 2026', read: '5 min read' },
        { tag: 'Travel',   title: 'How to Get a Thailand Non-Immigrant Education Visa (Without Losing Your Mind)', date: 'Dec 2025', read: '7 min read' },
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
    .then(res => {
        if (!res.ok) throw new Error('fetch failed');
        return res.text();
    })
    .then(xml => {
        const posts = parseFeed(xml);
        posts.length > 0 ? renderPosts(posts) : renderFallback();
    })
    .catch(renderFallback);
