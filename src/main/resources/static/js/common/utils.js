export function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export function parseInlineMarkdown(text) {
    let out = escapeHtml(text);
    out = out.replace(/`([^`]+)`/g, '<code>\$1</code>');
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>\$1</strong>');
    out = out.replace(/\*([^*]+)\*/g, '<em>\$1</em>');
    out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="\$2" target="_blank" rel="noopener">\$1</a>');
    return out;
}

export function renderMarkdownToHtml(markdown) {
    if (!markdown.trim()) {
        return '<p style="color:#9ca3af;font-style:italic;">No rules entered yet.</p>';
    }
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    let html = '';
    let i = 0;

    while (i < lines.length) {
        const line = lines[i].trim();
        if (!line) {
            i++;
            continue;
        }

        // Hỗ trợ bảng Markdown
        if (line.startsWith('|') && i + 1 < lines.length && /^\|?[\s:-]+\|[\s|:-]*\$/.test(lines[i + 1].trim())) {
            const headers = line.replace(/^\|/, '').replace(/\|\$/, '').split('|').map(h => parseInlineMarkdown(h.trim()));
            html += '<table><thead><tr>';
            headers.forEach(h => { html += `<th>${h}</th>`; });
            html += '</tr></thead><tbody>';
            i += 2;
            while (i < lines.length && lines[i].trim().startsWith('|')) {
                const cells = lines[i].trim().replace(/^\|/, '').replace(/\|\$/, '').split('|').map(c => parseInlineMarkdown(c.trim()));
                html += '<tr>';
                cells.forEach(c => { html += `<td>${c}</td>`; });
                html += '</tr>';
                i++;
            }
            html += '</tbody></table>';
            continue;
        }

        // Hỗ trợ H1, H2, H3
        if (line.startsWith('### ')) {
            html += `<h3>${parseInlineMarkdown(line.slice(4))}</h3>`;
            i++;
            continue;
        }
        if (line.startsWith('## ')) {
            html += `<h2>${parseInlineMarkdown(line.slice(3))}</h2>`;
            i++;
            continue;
        }
        if (line.startsWith('# ')) {
            html += `<h1>${parseInlineMarkdown(line.slice(2))}</h1>`;
            i++;
            continue;
        }

        // Hỗ trợ danh sách
        if (line.startsWith('- ') || line.startsWith('* ')) {
            html += '<ul>';
            while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
                html += `<li>${parseInlineMarkdown(lines[i].trim().slice(2))}</li>`;
                i++;
            }
            html += '</ul>';
            continue;
        }

        html += `<p>${parseInlineMarkdown(line)}</p>`;
        i++;
    }
    return html;
}