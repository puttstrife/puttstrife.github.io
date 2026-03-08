const MEDIUM_RSS = 'https://medium.com/feed/@puttstrife';
const RSS2JSON   = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(MEDIUM_RSS);

function estimateReadTime(html) {
    const words = html.replace(/<[^>]+>/g, '').split(/\s+/).length;
    return Math.max(1, Math.round(words / 200)) + ' min read';
}

function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function renderPosts(posts) {
    const grid = document.getElementById('medium-posts');
    if (!posts || posts.length === 0) {
        grid.innerHTML = '<p style="color:#999;font-size:14px;text-align:center;grid-column:1/-1;">No posts found.</p>';
        return;
    }

    grid.innerHTML = posts.slice(0, 2).map(post => {
        const excerpt = stripHtml(post.description).slice(0, 120).trim() + '…';
        const date    = formatDate(post.pubDate);
        const readTime = estimateReadTime(post.content || post.description);
        const tag     = (post.categories && post.categories[0]) ? post.categories[0] : 'Article';

        return `
        <article class="blog-card">
            <div class="blog-card-content">
                <span class="blog-tag">${tag}</span>
                <h3>${post.title}</h3>
                <p>${excerpt}</p>
                <div class="blog-card-meta">
                    <span class="blog-date">${date} · ${readTime}</span>
                    <a href="${post.link}" target="_blank" rel="noopener" class="blog-read-more">Read more →</a>
                </div>
            </div>
        </article>`;
    }).join('');
}

fetch(RSS2JSON)
    .then(res => res.json())
    .then(data => {
        if (data.status === 'ok') {
            renderPosts(data.items);
        } else {
            throw new Error('Feed error');
        }
    })
    .catch(() => {
        // Fallback to static cards if fetch fails
        document.getElementById('medium-posts').innerHTML = `
        <article class="blog-card">
            <div class="blog-card-content">
                <span class="blog-tag">Design</span>
                <h3>The Future of AI in UX Design</h3>
                <p>Exploring how artificial intelligence is reshaping the way designers think, prototype, and deliver user experiences at scale…</p>
                <div class="blog-card-meta">
                    <span class="blog-date">Feb 2025 · 5 min read</span>
                    <a href="https://medium.com/@puttstrife" target="_blank" rel="noopener" class="blog-read-more">Read more →</a>
                </div>
            </div>
        </article>
        <article class="blog-card">
            <div class="blog-card-content">
                <span class="blog-tag">Nomad Life</span>
                <h3>Designing for Digital Nomads</h3>
                <p>After 10 years as a digital nomad, here's what I've learned about designing products for location-independent lifestyles…</p>
                <div class="blog-card-meta">
                    <span class="blog-date">Jan 2025 · 6 min read</span>
                    <a href="https://medium.com/@puttstrife" target="_blank" rel="noopener" class="blog-read-more">Read more →</a>
                </div>
            </div>
        </article>`;
    });
