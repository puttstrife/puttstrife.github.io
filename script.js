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
    const items  = Array.from(xml.querySelectorAll('item')).slice(0, 2);

    return items.map(item => ({
        title:    item.querySelector('title')?.textContent || 'Untitled',
        link:     item.querySelector('link')?.nextSibling?.textContent?.trim() || '#',
        date:     item.querySelector('pubDate')?.textContent || '',
        content:  item.querySelector('encoded')?.textContent || item.querySelector('description')?.textContent || '',
        category: item.querySelector('category')?.textContent || 'Article',
    }));
}

function renderPosts(posts) {
    const grid = document.getElementById('medium-posts');

    grid.innerHTML = posts.map(post => {
        const text    = stripHtml(post.content);
        const excerpt = text.slice(0, 120).trim() + '…';
        const date    = formatDate(post.date);
        const read    = estimateReadTime(text);

        return `
        <article class="blog-card">
            <div class="blog-card-content">
                <span class="blog-tag">${post.category}</span>
                <h3>${post.title}</h3>
                <p>${excerpt}</p>
                <div class="blog-card-meta">
                    <span class="blog-date">${date} · ${read}</span>
                    <a href="${post.link}" target="_blank" rel="noopener" class="blog-read-more">Read more →</a>
                </div>
            </div>
        </article>`;
    }).join('');
}

function renderFallback() {
    document.getElementById('medium-posts').innerHTML = `
    <article class="blog-card">
        <div class="blog-card-content">
            <span class="blog-tag">Design</span>
            <h3>If it didn't move a metric, it didn't work</h3>
            <p>How design effectiveness should be measured through business outcomes rather than aesthetic appeal alone…</p>
            <div class="blog-card-meta">
                <span class="blog-date">Mar 2026 · 4 min read</span>
                <a href="https://medium.com/@puttstrife" target="_blank" rel="noopener" class="blog-read-more">Read more →</a>
            </div>
        </div>
    </article>
    <article class="blog-card">
        <div class="blog-card-content">
            <span class="blog-tag">SEO</span>
            <h3>A Practical 20-Step SEO Checklist That Actually Moves the Needle</h3>
            <p>A comprehensive, actionable framework for SEO implementation, covering technical foundations through content strategy…</p>
            <div class="blog-card-meta">
                <span class="blog-date">Feb 2026 · 6 min read</span>
                <a href="https://medium.com/@puttstrife" target="_blank" rel="noopener" class="blog-read-more">Read more →</a>
            </div>
        </div>
    </article>`;
}

fetch(PROXY)
    .then(res => {
        if (!res.ok) throw new Error('fetch failed');
        return res.text();
    })
    .then(xml => {
        const posts = parseFeed(xml);
        if (posts.length > 0) {
            renderPosts(posts);
        } else {
            renderFallback();
        }
    })
    .catch(renderFallback);
