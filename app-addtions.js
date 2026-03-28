/* ═══════════════════════════════════════════════════════
   ★ FEATURE 1 — FIND & REPLACE (Editor)
   Keyboard: Ctrl+F = find · Ctrl+H = find+replace · Esc = close
   Behaviour:
     - Typing only recomputes matches + updates counter.
       The editor selection / focus is NEVER touched while
       the user is still typing.
     - Enter / ↑ / ↓ buttons move to the next/prev match,
       scroll the editor line into view, select the text
       and return focus to the find input immediately.
═══════════════════════════════════════════════════════ */

let findMatches = [];
let findCurrentIdx = 0;
let findPanelOpen = false;
let findReplaceVisible = false;

/** Regex-escape a literal string */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Open (or focus) the find panel */
function openFind(withReplace = false) {
    findPanelOpen = true;
    $('find-panel').classList.add('open');

    if (withReplace && !findReplaceVisible) {
        findReplaceVisible = true;
        $('find-replace-row').style.display = 'flex';
        $('find-toggle-replace').classList.add('on');
    }

    const input = $('find-input');
    // Pre-fill with current editor selection (single-line only)
    const sel = editorEl.value.substring(editorEl.selectionStart, editorEl.selectionEnd);
    if (sel && !sel.includes('\n')) input.value = sel;

    // Focus stays in the find input — always
    input.focus();
    input.select();
    recomputeMatches();
    updateFindStatus();
}

/** Toggle the replace row */
function toggleFindReplace() {
    if (!findPanelOpen) { openFind(true); return; }
    findReplaceVisible = !findReplaceVisible;
    $('find-replace-row').style.display = findReplaceVisible ? 'flex' : 'none';
    $('find-toggle-replace').classList.toggle('on', findReplaceVisible);
    if (findReplaceVisible) $('replace-input').focus();
    else $('find-input').focus();
}

/** Close panel and restore editor */
function closeFind() {
    findPanelOpen = false;
    findReplaceVisible = false;
    findMatches = [];
    findCurrentIdx = 0;
    $('find-panel').classList.remove('open');
    $('find-replace-row').style.display = 'none';
    $('find-toggle-replace').classList.remove('on');
    updateFindStatus();
    editorEl.focus();
}

/**
 * Called on every keystroke in the find input.
 * ONLY recomputes the match list + updates the counter.
 * Does NOT touch editor focus or selection.
 */
function updateFindMatches() {
    recomputeMatches();
    // Pick a reasonable "current" index based on scroll position,
    // without touching the editor selection at all.
    if (findMatches.length) {
        const approxChar = getApproxCaretFromScroll();
        const idx = findMatches.findIndex(mt => mt.start >= approxChar);
        findCurrentIdx = idx >= 0 ? idx : 0;
    } else {
        findCurrentIdx = 0;
    }
    updateFindStatus();
}

/** Recompute findMatches from the query — pure, no side effects */
function recomputeMatches() {
    const query = $('find-input').value;
    const caseSen = $('find-case').classList.contains('on');
    findMatches = [];
    if (!query) return;
    const rx = new RegExp(escapeRegex(query), caseSen ? 'g' : 'gi');
    let m;
    while ((m = rx.exec(editorEl.value)) !== null) {
        findMatches.push({ start: m.index, end: m.index + m[0].length });
    }
}

/**
 * Estimate the character offset at the top of the editor's
 * visible area — used only to set the initial match index
 * when typing, without ever moving the cursor.
 */
function getApproxCaretFromScroll() {
    const lineH = parseFloat(getComputedStyle(editorEl).lineHeight) || 20;
    const pad = parseFloat(getComputedStyle(editorEl).paddingTop) || 0;
    const topLine = Math.floor((editorEl.scrollTop + pad) / lineH);
    const lines = editorEl.value.split('\n');
    let offset = 0;
    for (let i = 0; i < Math.min(topLine, lines.length); i++) {
        offset += lines[i].length + 1;
    }
    return offset;
}

/**
 * Navigate to match at index idx.
 * Scrolls the editor line into view + selects the match text,
 * then immediately returns focus to the find input.
 */
function navigateFind(idx) {
    if (!findMatches.length) return;
    findCurrentIdx = ((idx % findMatches.length) + findMatches.length) % findMatches.length;
    const match = findMatches[findCurrentIdx];

    // Focus editor briefly to set the selection, then return
    editorEl.focus();
    editorEl.setSelectionRange(match.start, match.end);

    // Scroll matched line to vertical center of the textarea
    const lines = editorEl.value.substr(0, match.start).split('\n');
    const lineH = parseFloat(getComputedStyle(editorEl).lineHeight) || 20;
    const padTop = parseFloat(getComputedStyle(editorEl).paddingTop) || 0;
    const targetY = (lines.length - 1) * lineH + padTop;
    editorEl.scrollTop = Math.max(0, targetY - editorEl.clientHeight / 2 + lineH / 2);

    // Return focus so the user can keep typing
    $('find-input').focus();
    updateFindStatus();
}

function findNext() { navigateFind(findCurrentIdx + 1); }
function findPrev() { navigateFind(findCurrentIdx - 1); }

function toggleFindCase() {
    $('find-case').classList.toggle('on');
    updateFindMatches();
}

function doReplace() {
    if (!findMatches.length) return;
    const match = findMatches[findCurrentIdx];
    const replacement = $('replace-input').value;
    editorEl.value =
        editorEl.value.slice(0, match.start) + replacement + editorEl.value.slice(match.end);
    editorEl.focus();
    editorEl.setSelectionRange(match.start, match.start + replacement.length);
    renderPreview();
    updateCharCount();
    scheduleSave();
    scheduleRemoteDocWrite();
    recomputeMatches();
    updateFindStatus();
    $('replace-input').focus();
}

function doReplaceAll() {
    const query = $('find-input').value;
    if (!query || !findMatches.length) return;
    const caseSen = $('find-case').classList.contains('on');
    const rx = new RegExp(escapeRegex(query), caseSen ? 'g' : 'gi');
    const count = (editorEl.value.match(rx) || []).length;
    editorEl.value = editorEl.value.replace(rx, $('replace-input').value);
    renderPreview();
    updateCharCount();
    scheduleSave();
    scheduleRemoteDocWrite();
    recomputeMatches();
    findCurrentIdx = 0;
    updateFindStatus();
    showToast(`✓ ${count} substituição${count !== 1 ? 'ões' : ''} feita${count !== 1 ? 's' : ''}`);
    $('find-input').focus();
}

function updateFindStatus() {
    const status = $('find-status');
    const query = $('find-input').value;
    if (!query) {
        status.textContent = '';
        status.className = 'find-status';
    } else if (!findMatches.length) {
        status.textContent = 'Sem resultados';
        status.className = 'find-status no-match';
    } else {
        status.textContent = `${findCurrentIdx + 1} / ${findMatches.length}`;
        status.className = 'find-status';
    }
}

function handleFindKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? findPrev() : findNext(); }
    if (e.key === 'Escape') { e.preventDefault(); closeFind(); }
    if (e.key === 'Tab' && !e.shiftKey && findReplaceVisible) {
        e.preventDefault(); $('replace-input').focus();
    }
}

function handleReplaceKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); doReplace(); }
    if (e.key === 'Escape') { e.preventDefault(); closeFind(); }
    if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); $('find-input').focus(); }
}

window.openFind = openFind;
window.closeFind = closeFind;
window.toggleFindReplace = toggleFindReplace;
window.updateFindMatches = updateFindMatches;
window.findNext = findNext;
window.findPrev = findPrev;
window.toggleFindCase = toggleFindCase;
window.doReplace = doReplace;
window.doReplaceAll = doReplaceAll;
window.handleFindKey = handleFindKey;
window.handleReplaceKey = handleReplaceKey;


/* ═══════════════════════════════════════════════════════
   ★ FEATURE 2 — PREVIEW SEARCH
   Searches the rendered HTML preview by walking text nodes
   and wrapping matches in <mark class="pv-mark">.
   The active match gets "pv-mark-active" + scrolls into view.
═══════════════════════════════════════════════════════ */

let pvMarks = [];
let pvCurrentIdx = 0;
let pvPanelOpen = false;

function openPreviewFind() {
    pvPanelOpen = true;
    $('pv-find-panel').classList.add('open');
    const input = $('pv-find-input');
    input.focus();
    input.select();
    updatePreviewFind();
}

function closePreviewFind() {
    pvPanelOpen = false;
    pvCurrentIdx = 0;
    $('pv-find-panel').classList.remove('open');
    clearPreviewMarks();
    updatePvStatus();
}

/** Strip all <mark> wrappers, rejoining text nodes */
function clearPreviewMarks() {
    previewEl.querySelectorAll('mark.pv-mark').forEach(mark => {
        mark.replaceWith(document.createTextNode(mark.textContent));
        mark.parentNode && mark.parentNode.normalize();
    });
    pvMarks = [];
}

/**
 * Walk the preview DOM, split text nodes and wrap every
 * occurrence of query in a <mark class="pv-mark"> element.
 */
function markTextInNode(root, query, caseSen) {
    const marks = [];
    const flags = caseSen ? 'g' : 'gi';
    const rx = new RegExp(escapeRegex(query), flags);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            const tag = node.parentElement?.tagName?.toLowerCase();
            if (tag === 'script' || tag === 'style' || tag === 'mark') {
                return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
        }
    });

    const textNodes = [];
    let n;
    while ((n = walker.nextNode())) textNodes.push(n);

    textNodes.forEach(node => {
        const text = node.nodeValue;
        rx.lastIndex = 0;
        const parts = [];
        let lastEnd = 0;
        let m;

        while ((m = rx.exec(text)) !== null) {
            if (m.index > lastEnd) {
                parts.push(document.createTextNode(text.slice(lastEnd, m.index)));
            }
            const mark = document.createElement('mark');
            mark.className = 'pv-mark';
            mark.textContent = m[0];
            parts.push(mark);
            marks.push(mark);
            lastEnd = m.index + m[0].length;
        }

        if (!parts.length) return;
        if (lastEnd < text.length) parts.push(document.createTextNode(text.slice(lastEnd)));

        const frag = document.createDocumentFragment();
        parts.forEach(p => frag.appendChild(p));
        node.parentNode.replaceChild(frag, node);
    });

    return marks;
}

function updatePreviewFind() {
    clearPreviewMarks();
    const query = $('pv-find-input').value;
    const caseSen = $('pv-find-case').classList.contains('on');
    if (!query) { updatePvStatus(); return; }

    pvMarks = markTextInNode(previewEl, query, caseSen);
    pvCurrentIdx = 0;
    if (pvMarks.length) activatePvMark(0);
    updatePvStatus();
}

function activatePvMark(i) {
    pvMarks.forEach(m => m.classList.remove('pv-mark-active'));
    pvCurrentIdx = ((i % pvMarks.length) + pvMarks.length) % pvMarks.length;
    const active = pvMarks[pvCurrentIdx];
    active.classList.add('pv-mark-active');
    active.scrollIntoView({ block: 'center', behavior: 'smooth' });
    updatePvStatus();
}

function pvFindNext() { if (pvMarks.length) activatePvMark(pvCurrentIdx + 1); }
function pvFindPrev() { if (pvMarks.length) activatePvMark(pvCurrentIdx - 1); }

function togglePvFindCase() {
    $('pv-find-case').classList.toggle('on');
    updatePreviewFind();
}

function updatePvStatus() {
    const status = $('pv-find-status');
    const query = $('pv-find-input').value;
    if (!query) {
        status.textContent = '';
        status.className = 'find-status';
    } else if (!pvMarks.length) {
        status.textContent = 'Sem resultados';
        status.className = 'find-status no-match';
    } else {
        status.textContent = `${pvCurrentIdx + 1} / ${pvMarks.length}`;
        status.className = 'find-status';
    }
}

function handlePvFindKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? pvFindPrev() : pvFindNext(); }
    if (e.key === 'Escape') { e.preventDefault(); closePreviewFind(); }
}

// Patch renderPreview so preview marks survive re-renders
(function patchRenderPreview() {
    const _orig = window.renderPreview || renderPreview;
    const patched = function () {
        _orig();
        if (pvPanelOpen && $('pv-find-input') && $('pv-find-input').value) {
            setTimeout(updatePreviewFind, 30);
        }
    };
    // Assign to both the global and the module-scoped variable used by editorEl.oninput
    window.renderPreview = patched;
    // If editorEl already has its listener wired before this script runs,
    // this patch will still work because renderPreview() is called by reference.
})();

window.openPreviewFind = openPreviewFind;
window.closePreviewFind = closePreviewFind;
window.updatePreviewFind = updatePreviewFind;
window.pvFindNext = pvFindNext;
window.pvFindPrev = pvFindPrev;
window.togglePvFindCase = togglePvFindCase;
window.handlePvFindKey = handlePvFindKey;


/* ═══════════════════════════════════════════════════════
   ★ FEATURE 3 — EXPORT AS HTML
═══════════════════════════════════════════════════════ */

function exportHtml() {
    const a1 = currentAcc1;
    const a2 = currentAcc2;
    const dark = isDark;

    const tokens = dark
        ? {
            bg: '#12141a', s1: '#1a1d25', s2: '#20232d', s3: '#272b37',
            bd: '#2c3040', tx: '#c8cfdf', tx2: '#7a849e', tx3: '#4a5368', txh: '#e8ecf5',
            ta1: `rgba(${hexToRgbString(a1)},.10)`, ta2: `rgba(${hexToRgbString(a2)},.10)`
        }
        : {
            bg: '#f5f6fa', s1: '#ffffff', s2: '#f0f2f8', s3: '#e8eaf2',
            bd: '#d4d8e8', tx: '#2a2e3e', tx2: '#606680', tx3: '#9099b0', txh: '#12141a',
            ta1: `rgba(${hexToRgbString(a1)},.07)`, ta2: `rgba(${hexToRgbString(a2)},.07)`
        };

    const docTitle = (editorEl.value.match(/^#\s+(.+)/m) || [])[1] || 'Markdowner Export';

    // Clone preview without any pv-mark leaking into the export
    const clone = previewEl.cloneNode(true);
    clone.querySelectorAll('mark.pv-mark').forEach(m => m.replaceWith(document.createTextNode(m.textContent)));

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${escHtml(docTitle)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--a1:${a1};--a2:${a2};--bg:${tokens.bg};--s1:${tokens.s1};--s2:${tokens.s2};--s3:${tokens.s3};--bd:${tokens.bd};--tx:${tokens.tx};--tx2:${tokens.tx2};--tx3:${tokens.tx3};--txh:${tokens.txh};--ta1:${tokens.ta1};--ta2:${tokens.ta2};--ff:'IBM Plex Sans',sans-serif;--fm:'IBM Plex Mono',monospace}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--ff);background:var(--bg);color:var(--tx);padding:clamp(24px,6vw,56px) clamp(20px,8vw,80px);max-width:860px;margin:0 auto;line-height:1.8;-webkit-font-smoothing:antialiased}
h1,h2,h3,h4{line-height:1.25;font-weight:600}
h1{font-size:clamp(22px,5vw,32px);font-weight:700;color:var(--a1);padding-bottom:10px;margin:0 0 22px;border-bottom:2px solid var(--a1)}
h1:not(:first-child){margin-top:40px}
h2{font-size:clamp(15px,3vw,19px);color:var(--a2);margin:32px 0 12px;padding:6px 14px 6px 16px;background:var(--ta2);border-left:3px solid var(--a2);border-radius:0 4px 4px 0}
h3{font-size:clamp(13px,2.4vw,16px);color:var(--tx);margin:24px 0 8px;display:flex;align-items:center;gap:8px}
h3::before{content:'';display:inline-block;width:3px;height:14px;background:var(--a1);border-radius:2px;flex-shrink:0}
h4{font-size:14px;font-weight:600;color:var(--tx2);margin:18px 0 6px}
p{font-size:15px;margin:8px 0}
ul,ol{padding-left:22px;margin:8px 0}li{font-size:15px;margin:3px 0}li::marker{color:var(--a1);font-weight:600}
strong{font-weight:700;color:var(--txh)}em{font-style:italic;color:var(--a2)}
blockquote{margin:12px 0;padding:10px 16px;background:var(--ta1);border-left:3px solid var(--a1);border-radius:0 4px 4px 0}
blockquote p{color:var(--tx2);margin:0}
code{font-family:var(--fm);font-size:13px;background:var(--s3);border:1px solid var(--bd);padding:2px 6px;border-radius:3px;color:var(--a2)}
pre{margin:14px 0;border-radius:6px;border:1px solid var(--bd);background:var(--s2);overflow-x:auto}
pre code{display:block;padding:16px;background:transparent;border:none;color:var(--tx);font-size:13px;line-height:1.7}
a{color:var(--a1);text-decoration:none;border-bottom:1px solid rgba(${hexToRgbString(a1)},.35)}
hr{border:none;height:1px;background:var(--bd);margin:28px 0}
table{width:100%;border-collapse:collapse;margin:14px 0;border:1px solid var(--bd);border-radius:6px;overflow:hidden;display:block;overflow-x:auto}
th{background:var(--s2);font-weight:600;font-size:12px;letter-spacing:.06em;text-transform:uppercase;padding:10px 14px;text-align:left;color:var(--tx2);border-bottom:1px solid var(--bd)}
td{padding:10px 14px;border-bottom:1px solid var(--bd);color:var(--tx)}
tr:last-child td{border-bottom:none}tbody tr:hover td{background:var(--ta1)}
img{max-width:100%;border-radius:6px}
.mkd-footer{margin-top:48px;padding-top:16px;border-top:1px solid var(--bd);font-size:11px;color:var(--tx3);font-family:var(--fm);display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px}
</style></head>
<body>
${clone.innerHTML}
<div class="mkd-footer"><span>Gerado por Markdowner</span><span>${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span></div>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), {
        href: url,
        download: `${docTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'markdowner'}.html`,
    }).click();
    URL.revokeObjectURL(url);
    $('expDrop').classList.remove('open');
    $('sheetOverlay').classList.remove('vis');
    showToast('Exportado como .html ✓');
}

window.exportHtml = exportHtml;


/* ═══════════════════════════════════════════════════════
   ★ FEATURE 4 — STATS PANEL
═══════════════════════════════════════════════════════ */

let statsVisible = false;

function toggleStats() {
    statsVisible = !statsVisible;
    if (statsVisible) { computeStats(); $('stats-panel').classList.add('vis'); }
    else { $('stats-panel').classList.remove('vis'); }
}

function closeStats() {
    statsVisible = false;
    $('stats-panel').classList.remove('vis');
}

function computeStats() {
    const text = editorEl.value;
    const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    const chars = text.length;
    const charsNoSp = text.replace(/\s/g, '').length;
    const lines = text ? text.split('\n').length : 0;
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length;
    const headings = (text.match(/^#{1,6}\s/gm) || []).length;
    const minutes = Math.max(1, Math.ceil(words / 200));

    $('stat-words').textContent = words.toLocaleString('pt-BR');
    $('stat-chars').textContent = chars.toLocaleString('pt-BR');
    $('stat-chars-ns').textContent = charsNoSp.toLocaleString('pt-BR');
    $('stat-lines').textContent = lines.toLocaleString('pt-BR');
    $('stat-paragraphs').textContent = paragraphs.toLocaleString('pt-BR');
    $('stat-headings').textContent = headings.toLocaleString('pt-BR');
    $('stat-reading').textContent = minutes === 1 ? '~1 min' : `~${minutes} min`;
}

document.addEventListener('click', e => {
    if (!statsVisible) return;
    if (!$('stats-panel').contains(e.target) && !$('cc').contains(e.target)) closeStats();
});

window.toggleStats = toggleStats;
window.closeStats = closeStats;


/* ═══════════════════════════════════════════════════════
   ★ GLOBAL KEYBOARD SHORTCUTS
   Capture phase ensures Ctrl+F intercepts before the
   browser's native find dialog fires.
═══════════════════════════════════════════════════════ */

document.addEventListener('keydown', e => {
    const mod = e.ctrlKey || e.metaKey;

    // Ctrl+F — editor find if editor visible, preview find if preview-only
    if (mod && e.key === 'f' && !e.shiftKey) {
        if (!$('ep').classList.contains('gone')) {
            e.preventDefault(); openFind(false);
        } else if (!$('pp').classList.contains('gone')) {
            e.preventDefault(); openPreviewFind();
        }
        return;
    }

    // Ctrl+H — find + replace (editor only)
    if (mod && e.key === 'h') {
        if (!$('ep').classList.contains('gone')) {
            e.preventDefault(); openFind(true);
        }
        return;
    }

    // Escape priority chain
    if (e.key === 'Escape') {
        if (findPanelOpen) { closeFind(); return; }
        if (pvPanelOpen) { closePreviewFind(); return; }
        if (statsVisible) { closeStats(); return; }
    }
}, true); // capture phase