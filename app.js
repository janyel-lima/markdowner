/**
 * Markdowner — MD Editor & Viewer
 * app.js — Main application logic  (final / all-working)
 */

'use strict';

/* ═══════════════════════════════════════════════════════
   1. CONSTANTS & CONFIGURATION
═══════════════════════════════════════════════════════ */

const STORAGE_KEYS = {
    theme: 'lp_theme',
    acc1: 'lp_acc1',
    acc2: 'lp_acc2',
    content: 'lp_content',
    toured: 'lp_toured',
    profile: 'mkd_profile',
    collab: 'mkd_collab_name',
    lastSession: 'mkd_last_session',
};

const ACCENT_PRESETS_1 = [
    '#e8a020', '#e85d20', '#e82060', '#a020e8',
    '#2060e8', '#20a8e8', '#208860', '#8da020', '#c87060',
];
const ACCENT_PRESETS_2 = [
    '#2fa88a', '#2f88a8', '#2f4da8', '#882fa8',
    '#a82f60', '#a86020', '#a8882f', '#60a82f', '#2fa860',
];

const PEER_COLORS = [
    '#e8a020', '#2fa88a', '#6c7de8', '#e85c5c',
    '#c87de0', '#4db8d4', '#d4a22f', '#82c44e',
];

const FIREBASE_CONFIG = {
    apiKey: window._FB_API_KEY || '',
    authDomain: `${window._FB_PROJECT_ID}.firebaseapp.com`,
    databaseURL: window._FB_DB_URL || '',
    projectId: window._FB_PROJECT_ID || '',
};

const IMG = {
    maxPxPhoto: 1280,
    maxPxScreen: 1920,
    qualityPhoto: 0.72,
    qualityScreen: 0.88,
    maxB64: 900_000,
};

/** Maximum live time for a collaborative session: 7 hours */
const SESSION_MAX_MS = 7 * 60 * 60 * 1000;

const FIREBASE_READY = !FIREBASE_CONFIG.apiKey.startsWith('__');

const DEFAULT_MD = `# Le Pimpe - N1

* **O que é esse doc?**

>  Uma forma rápida de acessar mensagens personalizdas pré-escritas para enviar após envio macros.

### Atenção!

* **Validar o execução do processo pelo número!**

> Não confuda o documento atual como guia do processo. Este é apenas um guia de busca rápido para o projeto via o número dele, assim como tem a utilidade extra de prover economia de tempo com mensagens úteis a se enviar após o envio das macros e dependendo a situação com o Parceiro.

### Forma simples de atender

1. Saudar o parceiro
2. Abrir oráculo
3. Analisar Karen, Chat de Cliente e demais se necessário;
    * Indentificado o caso - verificar processo correspondente usar número para abri-lo na sales;
4. TMI - Manda algo para o parceiro para se manter dentro do tempo de interação;
5. Macros - Enviar as macros do processo;
    * Macro é muito grande?
        - Dividir ela em fragmentos, ou...
        - Avise que está ciente da situação, mas precisa enviar textos automáticos;
6. Verificar/Utilizar ferramentas pertinentes ao caso
    * Salesforce azul, Backoffice, Portal do Parceiro;
7. Validar resolução e tabulação
    * Resolveu? Macro **ChatN1Avaliação**;
8. Demais dúvidas? Supervisores primeiro, veteranos depois;

# Processos e mensagens pré-escritas.

## Processos Logísticos de Restaurantes - 000001377

### Pedido sem entregador alocado - 000001379

* **Praça Saturada - Prazo OK**:

> Como a praça em sua região está saturada, caso não queira mais aguardar, podemos cancelar e reembolsar você e seu cliente, sem impactar a taxa de cancelamento da sua loja.

* **Prazo Estourado**

> Como a promessa de entrega está estourada, podemos cancelar e reembolsar, sem impactar sua taxa de cancelamento.

### Dificuldades com a entrega - 000001392
### Dificuldades operacionais com o entregador - 000001387
### Alterações solicitadas pelo Cliente - 000001378
### Pedido incorreto, incompleto ou com qualidade comprometida - 000001393

---

## Processos Sob Demanda Off - 000003308
## Conduta do entregador - 000004096
## Contestação de Cancelamento Parcial e Total (N1) - 000001418
## Problema Operacional do Parceiro - 000001419
## Moderação de Avaliação - N1 - 000003966
## Redução de Raio de Entrega N1 - 000004054
## Política de abandono - Support - 000003286

# Suporte técnico

## Direcionar para ST N2 (Fila PX Food N2 - AeC)

### Antes de transferir!

> Notas obrigatórias — preencha conforme a solicitação:

**Caso relacionado:**

> Problemas no gestor ( ) · Problemas no portal ( ) · Associação ( ) · Notificação Sonora ( ) · Impressão ( ) · Loja Não aparece/Loja fechada ( ) · Integração ( )
`;

/* ═══════════════════════════════════════════════════════
   2. TOUR STEPS
═══════════════════════════════════════════════════════ */

const TOUR_STEPS = [
    {
        phase: 'Interface', sel: '#t-brand',
        title: 'Markdowner MD Editor & Viewer',
        desc: 'Seu editor de referências para atendimento. Tudo que você escreve é <strong>salvo automaticamente</strong> no navegador — você nunca perde nada ao fechar e reabrir.',
    },
    {
        phase: 'Interface', sel: '#t-views',
        title: 'Modos de visualização',
        desc: '<strong>Dividido</strong> — editor e preview lado a lado.<br><strong>Editor</strong> — expande o textarea para escrita focada.<br><strong>Preview</strong> — visualização limpa do documento renderizado.',
    },
    {
        phase: 'Interface', sel: '#t-epbar',
        title: 'Painel do editor',
        desc: 'Aqui você digita seu Markdown. O contador no canto direito mostra caracteres e linhas em tempo real. Use <code>Tab</code> para inserir dois espaços de indentação.',
    },
    {
        phase: 'Interface', sel: '#t-ppbar',
        title: 'Painel de preview',
        desc: 'O Markdown renderizado ao vivo. Títulos, listas, citações, tabelas — tudo aparece aqui enquanto você digita, sem precisar salvar ou recarregar.',
    },
    {
        phase: 'Interface', sel: '#dv',
        title: 'Divisor arrastável',
        desc: 'Clique e arraste esta barra para ajustar a proporção entre editor e preview. Em telas menores o divisor fica horizontal.',
    },
    {
        phase: 'Interface', sel: '#t-copy',
        title: 'Copiar Markdown',
        desc: 'Copia todo o conteúdo do editor para a área de transferência. Útil para colar o texto em outros sistemas ou ferramentas.',
    },
    {
        phase: 'Interface', sel: '#t-export',
        title: 'Exportar arquivo',
        desc: 'Baixa o conteúdo como arquivo. <strong>.md</strong> mantém a sintaxe Markdown. <strong>.txt</strong> é texto puro. Ambos abrem normalmente em qualquer editor de texto.',
    },
    {
        phase: 'Interface', sel: '#t-import',
        title: 'Importar arquivo .md ou .txt',
        desc: 'Abre um arquivo do seu computador e carrega o conteúdo no editor. Funciona com qualquer arquivo <strong>.md</strong> ou <strong>.txt</strong>. Um diálogo de confirmação aparece antes de substituir o conteúdo atual.',
    },
    {
        phase: 'Interface', sel: '#t-colors',
        title: 'Personalizar cores',
        desc: 'Defina a <strong>cor principal</strong> (títulos, bordas, marcadores) e a <strong>cor secundária</strong> (subtítulos, itálico, destaques). Use os presets ou insira um hex personalizado.',
    },
    {
        phase: 'Interface', sel: '#t-theme',
        title: 'Tema escuro / claro',
        desc: 'Alterna entre o tema escuro profissional e o tema claro. A preferência fica salva — da próxima vez o editor já abre no tema certo.',
    },
    {
        phase: 'Interface', sel: '#tour-btn',
        title: 'Botão de tour',
        desc: 'Este botão fica sempre disponível para rever o tutorial quando precisar. Agora vamos aprender a escrever em Markdown!',
    },
    {
        phase: 'Markdown', sel: '#t-epbar',
        title: 'Títulos com #',
        desc: 'Use <code>#</code> no início da linha. Quanto mais <code>#</code>, menor o título. O editor aceita até 6 níveis.',
        md: '# Título principal\n## Seção (H2)\n### Subseção (H3)',
        sample: '# Título principal\n## Seção\n### Subseção\n',
        preview: '<div class="r-h1"># Título principal</div><div class="r-h2">## Seção (H2)</div><div class="r-h3">### Subseção (H3)</div>',
    },
    {
        phase: 'Markdown', sel: '#t-epbar',
        title: 'Negrito, itálico e código',
        desc: '<code>**texto**</code> → negrito · <code>*texto*</code> → itálico · <code>~~texto~~</code> → tachado · <code>`código`</code> → inline code',
        md: '**negrito** e *itálico*\n~~tachado~~\n`ChatN1Avaliação`',
        sample: '**Informação crítica** e *detalhe*\n`ChatN1Avaliação`\n',
        preview: '<span class="r-bold">negrito</span> e <span class="r-em">itálico</span><br><span style="text-decoration:line-through;color:var(--tx3);font-size:11px">tachado</span><br><span class="r-code">ChatN1Avaliação</span>',
    },
    {
        phase: 'Markdown', sel: '#t-epbar',
        title: 'Listas',
        desc: 'Use <code>-</code> ou <code>*</code> para listas com marcador. Use <code>1.</code> <code>2.</code> para listas numeradas. Adicione 2 espaços antes para criar subitens.',
        md: '- Item um\n- Item dois\n  - Subitem\n\n1. Primeiro\n2. Segundo',
        sample: '- Saudar o parceiro\n- Abrir oráculo\n  - Verificar Karen\n1. Analisar\n2. Resolver\n',
        preview: '<div class="r-li">Item um</div><div class="r-li">Item dois</div><div style="padding-left:14px"><div class="r-li" style="font-size:10px">Subitem</div></div><div style="font-size:10.5px;color:var(--tx);margin-top:3px">1. Primeiro<br>2. Segundo</div>',
    },
    {
        phase: 'Markdown', sel: '#t-epbar',
        title: 'Citações com >',
        desc: 'Use <code>&gt;</code> no início da linha. Ideal para mensagens prontas de atendimento — destaca o texto com bordas coloridas.',
        md: '> Como a praça está saturada,\n> podemos cancelar sem impactar\n> sua taxa de cancelamento.',
        sample: '> Como a praça está saturada, podemos cancelar sem impactar sua taxa de cancelamento.\n',
        preview: '<div class="r-bq">Como a praça está saturada, podemos cancelar sem impactar sua taxa de cancelamento.</div>',
    },
    {
        phase: 'Markdown', sel: '#t-epbar',
        title: 'Links e separadores',
        desc: '<code>[texto](url)</code> cria links clicáveis. <code>---</code> em linha sozinha cria um separador horizontal — ótimo para dividir seções.',
        md: '[Portal do Parceiro](https://parceiro.ifood.com.br)\n\n---\n\n[Salesforce](https://ifood.lightning.force.com)',
        sample: '[Portal do Parceiro](https://parceiro.ifood.com.br)\n\n---\n\n',
        preview: '<div style="display:flex;flex-direction:column;gap:5px"><a class="r-a" style="display:inline-block">🔗 Portal do Parceiro</a><hr class="r-hr" style="margin:2px 0"><a class="r-a" style="display:inline-block">🔗 Salesforce</a></div>',
    },
    {
        phase: 'Markdown', sel: '#t-epbar',
        title: 'Blocos de código',
        desc: 'Use três crases ``` para blocos de código. Adicione o nome da linguagem logo após as crases para ter destaque de sintaxe automático.',
        md: '```json\n{\n  "processo": "000001379",\n  "status": "saturado"\n}\n```',
        sample: '```\nChatN1Avaliação\nChatN1Transferência\n```\n',
        preview: '<div style="background:var(--bg2);border:1px solid var(--bd);border-radius:4px;padding:6px 8px;font-family:var(--fm);font-size:10px;color:var(--tx)">{ <span style="color:var(--a2)">"processo"</span>: <span style="color:var(--a1)">"000001379"</span> }</div>',
    },
    {
        phase: 'Markdown', sel: '#t-epbar',
        title: 'Tabelas',
        desc: 'Use <code>|</code> para separar colunas e <code>---</code> na segunda linha para definir o separador de cabeçalho.',
        md: '| Processo | Código | Ação |\n|---|---|---|\n| Sem entregador | 000001379 | Cancelar |\n| Prod. incorreta | 000001393 | Reembolsar |',
        sample: '| Processo | Código |\n|---|---|\n| Sem entregador | 000001379 |\n| Prod. incorreta | 000001393 |\n',
        preview: '<div style="overflow-x:auto"><table class="r-tbl" style="min-width:200px"><thead><tr><th>Processo</th><th>Código</th><th>Ação</th></tr></thead><tbody><tr><td>Sem entregador</td><td>000001379</td><td>Cancelar</td></tr><tr><td>Prod. incorreta</td><td>000001393</td><td>Reembolsar</td></tr></tbody></table></div>',
    },
    {
        phase: 'Colaboração', sel: '#collab-btn',
        title: 'Colaborar em tempo real',
        desc: 'Clique em <strong>Colaborar</strong> para criar ou entrar em uma sessão compartilhada. Edite o mesmo documento simultaneamente com sua equipe — todas as mudanças aparecem ao vivo para todos os participantes.',
    },
    {
        phase: 'Colaboração', sel: '#collab-btn',
        title: 'Como criar ou entrar numa sessão',
        desc: '<strong>Criar sessão:</strong> escolha seu nome e clique em "Criar sessão". Um <strong>código de 6 letras</strong> será gerado — envie para seus colegas.<br><br><strong>Entrar:</strong> escolha "Entrar em sessão", coloque seu nome e o código que recebeu. Sessões duram no máximo <strong>7 horas</strong>.',
    },
    {
        phase: 'Colaboração', sel: '#chat-toggle-btn',
        title: 'Chat da sessão',
        desc: 'Quando em uma sessão ativa, o botão <strong>Chat</strong> aparece no cabeçalho. Clique para abrir o painel lateral. O painel tem duas áreas: <strong>#sessão</strong> (grupo) e <strong>mensagens diretas</strong> com cada participante.',
    },
    {
        phase: 'Colaboração', sel: '#chat-toggle-btn',
        title: 'Canal #sessão — chat em grupo',
        desc: 'O canal <strong>#sessão</strong> na barra lateral esquerda do chat é o grupo geral — todas as mensagens enviadas aqui são visíveis para todos os participantes da sessão. Use para coordenar o trabalho em equipe.',
    },
    {
        phase: 'Colaboração', sel: '#chat-toggle-btn',
        title: 'Mensagens diretas — chat privado',
        desc: 'Na seção <strong>Mensagens diretas</strong> da barra lateral aparecem todos os participantes online. Clique no nome de alguém para abrir um chat privado — as mensagens são visíveis apenas para vocês dois, sem histórico compartilhado com os demais.',
    },
    {
        phase: 'Colaboração', sel: '#chat-toggle-btn',
        title: 'Perfil e badges de não lidas',
        desc: 'Clique no seu avatar no topo da barra lateral para editar seu <strong>nome e foto de perfil</strong>. Badges vermelhos aparecem em cada canal e mensagem direta com contagem de mensagens não lidas.',
    },
    {
        phase: 'Concluído', sel: '#tour-btn',
        title: 'Tudo pronto! 🎉',
        desc: 'Você conhece o editor, o Markdown, a colaboração em tempo real e o sistema de chat com canais e DMs. Seu documento é salvo automaticamente. Clique em <strong>Tour</strong> sempre que quiser rever. Bom atendimento!',
        isLast: true,
    },
];


/* ═══════════════════════════════════════════════════════
   3. UTILITIES
═══════════════════════════════════════════════════════ */

const $ = id => document.getElementById(id);

function lsGet(key, fallback = null) {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function lsSet(key, value) {
    try { localStorage.setItem(key, value); } catch { /* noop */ }
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function hexToRgbString(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return null;
    return `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
}

const isMobile = () => window.innerWidth <= 700;

function genRoomCode() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function genUserId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function getInitials(name) {
    return String(name || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

const getPeerColor = idx => PEER_COLORS[idx % PEER_COLORS.length];

const dmChannelKey = (a, b) => [a, b].sort().join('_');

/** Format milliseconds → human readable "6h 23m" or "45m" */
function fmtDuration(ms) {
    if (ms <= 0) return '0m';
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}


/* ═══════════════════════════════════════════════════════
   3.5 SOUND SYSTEM
═══════════════════════════════════════════════════════ */

let _audioCtx = null;
let soundEnabled = true;
let _prevPeerCount = 0;

function getAudioCtx() {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    return _audioCtx;
}

function playTone({ freq = 660, freq2 = null, type = 'sine', gain = 0.14, attack = 0.006, duration = 0.20 } = {}) {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const amp = ctx.createGain();
        osc.connect(amp); amp.connect(ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        if (freq2 !== null) osc.frequency.linearRampToValueAtTime(freq2, ctx.currentTime + duration * 0.55);
        amp.gain.setValueAtTime(0, ctx.currentTime);
        amp.gain.linearRampToValueAtTime(gain, ctx.currentTime + attack);
        amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration + 0.05);
    } catch { /* noop */ }
}

function soundMessageReceived() { playTone({ freq: 880, gain: 0.11, duration: 0.22 }); }
function soundDmReceived() {
    playTone({ freq: 1047, gain: 0.13, duration: 0.14 });
    setTimeout(() => playTone({ freq: 1319, gain: 0.11, duration: 0.18 }), 115);
}
function soundUserJoined() {
    playTone({ freq: 528, gain: 0.09, duration: 0.16 });
    setTimeout(() => playTone({ freq: 660, gain: 0.08, duration: 0.20 }), 130);
}
function soundMessageSent() { playTone({ freq: 700, type: 'sine', gain: 0.06, duration: 0.09 }); }

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = $('sound-btn');
    btn.title = soundEnabled ? 'Silenciar sons' : 'Ativar sons';
    btn.classList.toggle('muted', !soundEnabled);
    showToast(soundEnabled ? '🔔 Sons ativados' : '🔕 Sons silenciados');
}
window.toggleSound = toggleSound;


/* ═══════════════════════════════════════════════════════
   4. MARKDOWN RENDERER SETUP
═══════════════════════════════════════════════════════ */

(function setupMarked() {
    const renderer = new marked.Renderer();
    renderer.code = (code, lang) => {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        const highlighted = hljs.highlight(code, { language }).value;
        return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
    };
    marked.use({ renderer, breaks: true, gfm: true });
})();


/* ═══════════════════════════════════════════════════════
   5. EDITOR CORE — RENDER & AUTOSAVE
═══════════════════════════════════════════════════════ */

const editorEl = $('editor');
const previewEl = $('preview');
const charCountEl = $('cc');
const saveStatusEl = $('save-status');
const hlDark = $('hl-dark');
const hlLight = $('hl-light');

function renderPreview() {
    previewEl.innerHTML = DOMPurify.sanitize(marked.parse(editorEl.value));
}

function updateCharCount() {
    const chars = editorEl.value.length;
    const lines = editorEl.value.split('\n').length;
    charCountEl.textContent = `${chars.toLocaleString('pt-BR')} chars · ${lines} linhas`;
}

let saveTimer = null;

function scheduleSave() {
    saveStatusEl.textContent = 'Salvando...';
    saveStatusEl.className = 'saving';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        lsSet(STORAGE_KEYS.content, editorEl.value);
        saveStatusEl.textContent = 'Salvo';
        saveStatusEl.className = 'saved';
        setTimeout(() => { saveStatusEl.textContent = 'Salvo'; saveStatusEl.className = ''; }, 1800);
    }, 800);
}

editorEl.addEventListener('input', () => {
    renderPreview();
    updateCharCount();
    scheduleSave();
    scheduleRemoteDocWrite();
});

editorEl.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const s = editorEl.selectionStart, end = editorEl.selectionEnd;
    editorEl.value = editorEl.value.slice(0, s) + '  ' + editorEl.value.slice(end);
    editorEl.selectionStart = editorEl.selectionEnd = s + 2;
    renderPreview();
});


/* ═══════════════════════════════════════════════════════
   6. THEME
═══════════════════════════════════════════════════════ */

let isDark = true;

function applyTheme(dark) {
    isDark = dark;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    $('th-lbl').textContent = dark ? 'Escuro' : 'Claro';
    hlDark.disabled = !dark;
    hlLight.disabled = dark;
    lsSet(STORAGE_KEYS.theme, dark ? 'dark' : 'light');
}
function toggleTheme() { applyTheme(!isDark); }


/* ═══════════════════════════════════════════════════════
   7. ACCENT COLORS
═══════════════════════════════════════════════════════ */

const root = document.documentElement;
let currentAcc1 = '#e8a020';
let currentAcc2 = '#2fa88a';

function applyAccent1(hex) {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    currentAcc1 = hex;
    root.style.setProperty('--a1', hex);
    const rgb = hexToRgbString(hex);
    if (rgb) root.style.setProperty('--a1r', rgb);
    $('sw1').style.background = hex;
    $('cp1').value = hex; $('hx1').value = hex;
    document.querySelectorAll('.ps1').forEach(btn => btn.classList.toggle('sel', btn.dataset.c === hex));
    lsSet(STORAGE_KEYS.acc1, hex);
}

function applyAccent2(hex) {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    currentAcc2 = hex;
    root.style.setProperty('--a2', hex);
    const rgb = hexToRgbString(hex);
    if (rgb) root.style.setProperty('--a2r', rgb);
    $('sw2').style.background = hex;
    $('cp2').value = hex; $('hx2').value = hex;
    document.querySelectorAll('.ps2').forEach(btn => btn.classList.toggle('sel', btn.dataset.c === hex));
    lsSet(STORAGE_KEYS.acc2, hex);
}

function buildPresetGrid(containerId, colors, applyFn, cssClass) {
    const container = $(containerId);
    colors.forEach(color => {
        const btn = document.createElement('button');
        btn.className = `ps ${cssClass}`;
        btn.dataset.c = color;
        btn.style.background = color;
        btn.title = color;
        btn.addEventListener('click', () => applyFn(color));
        container.appendChild(btn);
    });
}

function wireColorInputs(n, applyFn) {
    const picker = $(`cp${n}`);
    const hexInput = $(`hx${n}`);
    const getCurrent = () => n === '1' ? currentAcc1 : currentAcc2;

    picker.addEventListener('input', e => { hexInput.value = e.target.value; applyFn(e.target.value); });
    hexInput.addEventListener('input', e => { if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) applyFn(e.target.value); });
    hexInput.addEventListener('blur', e => {
        let val = e.target.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9a-fA-F]{6}$/.test(val)) { applyFn(val); } else { hexInput.value = getCurrent(); }
    });
}

function initColors() {
    buildPresetGrid('presets1', ACCENT_PRESETS_1, applyAccent1, 'ps1');
    buildPresetGrid('presets2', ACCENT_PRESETS_2, applyAccent2, 'ps2');
    wireColorInputs('1', applyAccent1);
    wireColorInputs('2', applyAccent2);
}


/* ═══════════════════════════════════════════════════════
   8. DROPDOWNS
═══════════════════════════════════════════════════════ */

function closeAllDropdowns() {
    $('cpanel').classList.remove('open');
    $('expDrop').classList.remove('open');
    $('sheetOverlay').classList.remove('vis');
}

function toggleColorPanel() {
    const willOpen = !$('cpanel').classList.contains('open');
    closeAllDropdowns();
    if (willOpen) { $('cpanel').classList.add('open'); if (isMobile()) $('sheetOverlay').classList.add('vis'); }
}

function toggleExportMenu() {
    const willOpen = !$('expDrop').classList.contains('open');
    closeAllDropdowns();
    if (willOpen) { $('expDrop').classList.add('open'); if (isMobile()) $('sheetOverlay').classList.add('vis'); }
}

document.addEventListener('click', e => {
    if (!$('colorWrap').contains(e.target) && !$('sheetOverlay').contains(e.target)) $('cpanel').classList.remove('open');
    if (!$('expWrap').contains(e.target) && !$('sheetOverlay').contains(e.target)) $('expDrop').classList.remove('open');
    if (!$('cpanel').classList.contains('open') && !$('expDrop').classList.contains('open')) $('sheetOverlay').classList.remove('vis');
});

window.toggleColor = toggleColorPanel;
window.toggleExp = toggleExportMenu;
window.closeAllDropdowns = closeAllDropdowns;


/* ═══════════════════════════════════════════════════════
   9. VIEW MODES
═══════════════════════════════════════════════════════ */

const panelEditor = $('ep');
const panelPreview = $('pp');
const divider = $('dv');

function setView(mode) {
    ['both', 'edit', 'preview'].forEach(v => $(`b-${v}`).classList.toggle('on', v === mode));
    panelEditor.classList.remove('gone');
    panelPreview.classList.remove('gone');
    divider.classList.remove('gone');
    panelEditor.style.cssText = '';
    if (mode === 'edit') { panelPreview.classList.add('gone'); divider.classList.add('gone'); }
    if (mode === 'preview') { panelEditor.classList.add('gone'); divider.classList.add('gone'); }
}
window.setView = setView;


/* ═══════════════════════════════════════════════════════
   10. DRAG DIVIDER
═══════════════════════════════════════════════════════ */

let isDragging = false;
let dragStart = 0;
let dragStartSz = 0;

function onDragStart(e) {
    e.preventDefault();
    isDragging = true;
    divider.classList.add('drag');
    document.body.style.userSelect = 'none';
    document.body.style.cursor = isMobile() ? 'row-resize' : 'col-resize';

    const pointer = e.touches?.[0] ?? e;
    if (isMobile()) {
        dragStart = pointer.clientY;
        dragStartSz = panelEditor.getBoundingClientRect().height;
    } else {
        dragStart = pointer.clientX;
        dragStartSz = panelEditor.getBoundingClientRect().width;
    }

    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchend', onDragEnd);
}

function onDragMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    const pointer = e.touches?.[0] ?? e;
    const ws = $('workspace').getBoundingClientRect();
    if (isMobile()) {
        const h = Math.max(80, Math.min(ws.height - 80, dragStartSz + (pointer.clientY - dragStart)));
        panelEditor.style.flex = 'none'; panelEditor.style.height = h + 'px';
    } else {
        const w = Math.max(80, Math.min(ws.width - 80, dragStartSz + (pointer.clientX - dragStart)));
        panelEditor.style.flex = 'none'; panelEditor.style.width = w + 'px';
    }
}

function onDragEnd() {
    isDragging = false;
    divider.classList.remove('drag');
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('touchmove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    document.removeEventListener('touchend', onDragEnd);
}

divider.addEventListener('mousedown', onDragStart);
divider.addEventListener('touchstart', onDragStart, { passive: false });


/* ═══════════════════════════════════════════════════════
   11. COPY / EXPORT / IMPORT
═══════════════════════════════════════════════════════ */

function copyMarkdown() {
    navigator.clipboard.writeText(editorEl.value)
        .then(() => showToast('Copiado para a área de transferência'));
}

function exportFile(ext) {
    const blob = new Blob([editorEl.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: `le-pimpe-n1.${ext}` }).click();
    URL.revokeObjectURL(url);
    $('expDrop').classList.remove('open');
    $('sheetOverlay').classList.remove('vis');
    showToast(`Exportado como .${ext}`);
}

let pendingImportContent = null;
let pendingImportName = '';

function triggerImport() { $('file-input').value = ''; $('file-input').click(); }

$('file-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['md', 'txt'].includes(ext)) { showToast('Formato inválido — use .md ou .txt'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
        pendingImportContent = ev.target.result;
        pendingImportName = file.name;
        $('imp-title').textContent = 'Importar arquivo';
        $('imp-desc').innerHTML =
            `O conteúdo atual será substituído pelo arquivo:<br>` +
            `<span class="imp-fname">${escHtml(pendingImportName)}</span><br><br>` +
            `Esta ação não pode ser desfeita.`;
        $('imp-backdrop').classList.add('vis');
    };
    reader.readAsText(file, 'utf-8');
});

$('imp-cancel').addEventListener('click', () => {
    $('imp-backdrop').classList.remove('vis');
    pendingImportContent = null; pendingImportName = '';
});

$('imp-confirm').addEventListener('click', () => {
    if (pendingImportContent === null) return;
    editorEl.value = pendingImportContent;
    renderPreview(); updateCharCount(); scheduleSave();
    $('imp-backdrop').classList.remove('vis');
    showToast(`"${pendingImportName}" importado com sucesso ✓`);
    pendingImportContent = null; pendingImportName = '';
});

window.copyMd = copyMarkdown;
window.exportFile = exportFile;
window.triggerImport = triggerImport;


/* ═══════════════════════════════════════════════════════
   12. TOAST
═══════════════════════════════════════════════════════ */

let toastTimer = null;

function showToast(message) {
    const el = $('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}
window.showToast = showToast;


/* ═══════════════════════════════════════════════════════
   13. TOUR SYSTEM
═══════════════════════════════════════════════════════ */

const tourSpot = $('tour-spot');
const tourCard = $('tour-card');
const tourBlocker = $('tour-blocker');
let currentStep = 0;

function showWelcomeModal() { $('tw-backdrop').classList.add('vis'); }
function hideWelcomeModal() { $('tw-backdrop').classList.remove('vis'); }

$('tw-skip').addEventListener('click', () => { hideWelcomeModal(); lsSet(STORAGE_KEYS.toured, '1'); });
$('tw-start').addEventListener('click', () => { hideWelcomeModal(); tourStart(); });

function tourStart() {
    setView('both'); currentStep = 0;
    tourBlocker.classList.add('vis');
    tourSpot.classList.add('vis');
    tourCard.classList.add('vis');
    renderTourStep(0);
}

function tourEnd() {
    tourBlocker.classList.remove('vis');
    tourSpot.classList.remove('vis');
    tourCard.classList.remove('vis');
    lsSet(STORAGE_KEYS.toured, '1');
    showToast('Tour concluído! Bom atendimento 👍');
}

function renderTourStep(index) {
    const step = TOUR_STEPS[index];
    const total = TOUR_STEPS.length;
    $('tc-phase').textContent = step.phase;
    $('tc-count').textContent = `${index + 1} / ${total}`;
    $('tc-fill').style.width = `${((index + 1) / total) * 100}%`;
    $('tc-title').textContent = step.title;
    $('tc-desc').innerHTML = step.desc;
    buildTourExtra(step);
    $('tc-prev').disabled = (index === 0);
    const nextBtn = $('tc-next');
    if (step.isLast) { nextBtn.textContent = '✓ Fechar tour'; nextBtn.onclick = tourEnd; }
    else { nextBtn.textContent = 'Próximo →'; nextBtn.onclick = () => goTourStep(1); }
    requestAnimationFrame(() => setTourSpotlight(step.sel));
}

function buildTourExtra(step) {
    const extra = $('tc-extra');
    extra.innerHTML = '';
    if (!step.md) return;
    const codeBox = document.createElement('div');
    codeBox.className = 'tc-example';
    codeBox.innerHTML = `
    <div class="tc-ex-bar">
      <span class="tc-ex-label">Sintaxe Markdown</span>
      ${step.sample ? '<button class="tc-try" id="tc-try-btn">▶ Inserir no editor</button>' : ''}
    </div>
    <pre class="tc-code-pre">${escHtml(step.md)}</pre>`;
    extra.appendChild(codeBox);
    if (step.sample) {
        $('tc-try-btn').addEventListener('click', () => {
            const pos = editorEl.selectionStart || editorEl.value.length;
            editorEl.value = editorEl.value.slice(0, pos) + '\n' + step.sample + editorEl.value.slice(pos);
            renderPreview(); updateCharCount(); scheduleSave();
            showToast('Exemplo inserido! Veja o preview →');
        });
    }
    if (step.preview) {
        const split = document.createElement('div');
        split.className = 'tc-split';
        split.innerHTML = `
      <div class="tc-sp">
        <div class="tc-sp-tag">Markdown</div>
        <div class="tc-sp-md">${escHtml(step.md)}</div>
      </div>
      <div class="tc-sp tc-sp-result">
        <div class="tc-sp-tag">Resultado</div>
        <div style="font-size:11px;line-height:1.65">${step.preview}</div>
      </div>`;
        extra.appendChild(split);
    }
}

function goTourStep(direction) {
    const next = currentStep + direction;
    if (next < 0 || next >= TOUR_STEPS.length) return;
    currentStep = next; renderTourStep(next);
}

$('tc-prev').addEventListener('click', () => goTourStep(-1));
$('tc-close').addEventListener('click', tourEnd);

function setTourSpotlight(selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    const PAD = 8, r = el.getBoundingClientRect();
    tourSpot.style.left = (r.left - PAD) + 'px';
    tourSpot.style.top = (r.top - PAD) + 'px';
    tourSpot.style.width = (r.width + PAD * 2) + 'px';
    tourSpot.style.height = (r.height + PAD * 2) + 'px';
    placeTourCard(r, PAD);
}

function placeTourCard(targetRect, pad) {
    const mobile = isMobile();
    const vw = window.innerWidth, vh = window.innerHeight, mg = 12;
    const cardWidth = mobile ? vw - 24 : Math.min(Math.max(300, vw * 0.26), 400);
    tourCard.style.width = cardWidth + 'px';
    const cardHeight = Math.min(tourCard.offsetHeight || 300, vh - mg * 2);
    tourCard.style.maxHeight = (vh - mg * 2) + 'px';
    const spaceBelow = vh - (targetRect.bottom + pad + mg);
    const spaceAbove = targetRect.top - pad - mg;
    let top, left;
    if (mobile) {
        left = 12;
        if (spaceBelow >= cardHeight + 8) top = targetRect.bottom + pad + mg;
        else if (spaceAbove >= cardHeight + 8) top = targetRect.top - pad - mg - cardHeight;
        else top = Math.max(mg, vh - cardHeight - mg - 16);
        top = Math.max(mg, Math.min(top, vh - cardHeight - mg));
    } else {
        if (spaceBelow >= cardHeight + 8) {
            top = targetRect.bottom + pad + mg;
            left = Math.max(mg, Math.min(targetRect.left, vw - cardWidth - mg));
        } else if (spaceAbove >= cardHeight + 8) {
            top = targetRect.top - pad - mg - cardHeight;
            left = Math.max(mg, Math.min(targetRect.left, vw - cardWidth - mg));
        } else {
            const spaceRight = vw - (targetRect.right + pad + mg);
            const spaceLeft = targetRect.left - pad - mg;
            if (spaceRight >= cardWidth + 8) { left = targetRect.right + pad + mg; top = Math.max(mg, Math.min(targetRect.top, vh - cardHeight - mg)); }
            else if (spaceLeft >= cardWidth + 8) { left = targetRect.left - pad - mg - cardWidth; top = Math.max(mg, Math.min(targetRect.top, vh - cardHeight - mg)); }
            else { left = Math.max(mg, vw / 2 - cardWidth / 2); top = Math.max(mg, Math.min(targetRect.bottom + pad + mg, vh - cardHeight - mg)); }
        }
        top = Math.max(mg, Math.min(top, vh - cardHeight - mg));
        left = Math.max(mg, Math.min(left, vw - cardWidth - mg));
    }
    tourCard.style.top = top + 'px';
    tourCard.style.left = left + 'px';
}

window.addEventListener('resize', () => {
    if (tourCard.classList.contains('vis')) setTourSpotlight(TOUR_STEPS[currentStep].sel);
});
window.tourStart = tourStart;


/* ═══════════════════════════════════════════════════════
   14. PROFILE
═══════════════════════════════════════════════════════ */

let myName = 'Anônimo';
let myColor = getPeerColor(0);
let myAvatarUrl = '';

function loadProfile() {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.profile) || '{}');
        myName = stored.name || lsGet(STORAGE_KEYS.collab, '') || 'Anônimo';
        myColor = stored.color || getPeerColor(Math.floor(Math.random() * PEER_COLORS.length));
        myAvatarUrl = stored.avatarUrl || '';
    } catch { myName = 'Anônimo'; myColor = getPeerColor(0); }
}

function saveProfileData(name, color, avatarUrl) {
    myName = name; myColor = color; myAvatarUrl = avatarUrl;
    try { localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify({ name, color, avatarUrl })); } catch { /* noop */ }
    lsSet(STORAGE_KEYS.collab, name);
}

function renderAvatar(el, name, color, avatarUrl) {
    if (!el) return;
    el.style.background = color || '#888';
    if (avatarUrl) {
        const safeName = escHtml(getInitials(name));
        const safeColor = escHtml(color || '#888');
        el.innerHTML = `<img src="${escHtml(avatarUrl)}"
      onerror="this.parentNode.innerHTML='${safeName}';this.parentNode.style.background='${safeColor}'">`;
    } else {
        el.innerHTML = getInitials(name);
    }
}

function renderMyAvatar() { renderAvatar($('cp-my-avatar'), myName, myColor, myAvatarUrl); }

function openProfileModal() {
    $('profile-name-input').value = myName;
    $('profile-avatar-input').value = myAvatarUrl;
    updateProfilePreview();
    $('profile-backdrop').classList.add('vis');
    setTimeout(() => $('profile-name-input').focus(), 80);
}

function closeProfileModal() { $('profile-backdrop').classList.remove('vis'); }

function closeProfileOnBg(e) { if (e.target === $('profile-backdrop')) closeProfileModal(); }

function updateProfilePreview() {
    const name = $('profile-name-input').value.trim() || 'Anônimo';
    const url = $('profile-avatar-input').value.trim();
    $('profile-name-display').textContent = name;
    renderAvatar($('profile-avatar-big'), name, myColor, url);
}

function saveProfile() {
    const name = $('profile-name-input').value.trim() || 'Anônimo';
    const url = $('profile-avatar-input').value.trim();
    saveProfileData(name, myColor, url);
    renderMyAvatar();
    if (fbRoom && myId) fbRoom.child(`users/${myId}`).update({ name, avatarUrl: url || '' }).catch(() => { });
    closeProfileModal();
    showToast('✓ Perfil atualizado');
}

$('profile-name-input').addEventListener('input', updateProfilePreview);
$('profile-avatar-input').addEventListener('input', updateProfilePreview);

window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;
window.closeProfileOnBg = closeProfileOnBg;
window.saveProfile = saveProfile;


/* ═══════════════════════════════════════════════════════
   15. FIREBASE & COLLAB
═══════════════════════════════════════════════════════ */

let fbApp = null;
let fbDb = null;
let fbRoom = null;

let myId = '';
let roomCode = '';
let hostId = '';       // ← tracks who created the room

let sessionListeners = [];
let writeDocTimer = null;
let applyingRemote = false;

// ── Session timer (7-hour max) ──────────────────────
let sessionStartedAt = 0;    // Unix ms from Firebase
let sessionAutoLeaveTimer = null; // setTimeout handle
let sessionTimerInterval = null; // setInterval handle for display

function startSessionTimerDisplay() {
    clearInterval(sessionTimerInterval);
    _updateSessionTimerLabel();
    sessionTimerInterval = setInterval(_updateSessionTimerLabel, 60_000);
}

function _updateSessionTimerLabel() {
    const lbl = $('pb-label');
    if (!lbl) return;
    if (!sessionStartedAt) { lbl.textContent = 'Sessão ativa'; return; }
    const remaining = SESSION_MAX_MS - (Date.now() - sessionStartedAt);
    if (remaining <= 0) { lbl.textContent = 'Sessão encerrada'; return; }
    lbl.textContent = `Sessão · ${fmtDuration(remaining)} restantes`;
}

function stopSessionTimerDisplay() {
    clearInterval(sessionTimerInterval);
    sessionTimerInterval = null;
    const lbl = $('pb-label');
    if (lbl) lbl.textContent = 'Sessão ativa';
}

// ────────────────────────────────────────────────────

function initFirebase() {
    if (fbApp) return true;
    if (!FIREBASE_READY) { showToast('⚠ Firebase não configurado. Veja o SETUP.md.'); return false; }
    try {
        fbApp = firebase.initializeApp(FIREBASE_CONFIG);
        fbDb = firebase.database();
        return true;
    } catch (err) { showToast(`⚠ Erro Firebase: ${err.message}`); return false; }
}

function scheduleRemoteDocWrite() {
    if (applyingRemote || !fbRoom) return;
    clearTimeout(writeDocTimer);
    writeDocTimer = setTimeout(() => {
        fbRoom.child('doc').set(editorEl.value).catch(() => { });
    }, 250);
}

function applyRemoteContent(content) {
    if (content === editorEl.value) return;
    applyingRemote = true;
    const cursor = editorEl.selectionStart;
    editorEl.value = content;
    try { editorEl.selectionStart = editorEl.selectionEnd = cursor; } catch { /* noop */ }
    renderPreview(); updateCharCount(); scheduleSave();
    applyingRemote = false;
}

/* ── Collab modal ── */

function openCollabModal() {
    if (roomCode) {
        // Already in a session — show active session view
        switchCollabTab('create');
        $('cm-create-step1').style.display = 'none';
        $('cm-create-step2').style.display = 'flex';
        $('cm-code-val').textContent = roomCode;
        $('cm-host-name').value = myName;
        _updateModalSessionInfo();
        renderModalParticipants();
    } else {
        $('cm-host-name').value = myName;
        $('cm-join-name').value = myName;
        $('cm-create-step1').style.display = 'block';
        $('cm-create-step2').style.display = 'none';
        switchCollabTab('create');
        setTimeout(() => { $('cm-host-name').focus(); $('cm-host-name').select(); }, 80);
    }
    $('collab-backdrop').classList.add('vis');
}

/** Show session creation time + remaining time in the modal */
function _updateModalSessionInfo() {
    const info = $('cm-session-info');
    if (!info) return;
    if (!sessionStartedAt) { info.textContent = ''; return; }
    const elapsed = Date.now() - sessionStartedAt;
    const remaining = SESSION_MAX_MS - elapsed;
    info.textContent = remaining > 0
        ? `Ativa há ${fmtDuration(elapsed)} · expira em ${fmtDuration(remaining)}`
        : 'Sessão expirada';
}

function closeCollabModal() { $('collab-backdrop').classList.remove('vis'); }
function closeCollabOnBg(e) { if (e.target === $('collab-backdrop')) closeCollabModal(); }

function switchCollabTab(tab) {
    $('cm-tab-create').classList.toggle('on', tab === 'create');
    $('cm-tab-join').classList.toggle('on', tab === 'join');
    $('cm-create-body').style.display = tab === 'create' ? 'flex' : 'none';
    $('cm-join-body').style.display = tab === 'join' ? 'flex' : 'none';
    setTimeout(() => {
        const input = tab === 'create' ? $('cm-host-name') : $('cm-join-name');
        if (input && !input.value) input.focus();
    }, 60);
}

/* ── Create session ── */

function hostSession() {
    if (!initFirebase()) return;
    const nameInput = $('cm-host-name').value.trim();
    if (nameInput) saveProfileData(nameInput, myColor, myAvatarUrl);

    myId = genUserId();
    roomCode = genRoomCode();

    const btn = $('cm-create-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="cm-spinner"></span> Criando sessão...';

    fbRoom = fbDb.ref(`rooms/${roomCode}`);

    fbRoom.once('value')
        .then(snap => {
            if (snap.exists()) { roomCode = genRoomCode(); fbRoom = fbDb.ref(`rooms/${roomCode}`); }
            return fbRoom.set({
                doc: editorEl.value,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                hostId: myId,
            });
        })
        .then(() => {
            joinRoom();
            $('cm-create-step1').style.display = 'none';
            $('cm-create-step2').style.display = 'flex';
            $('cm-code-val').textContent = roomCode;
            $('pb-room-code').textContent = roomCode;
            $('cm-share-url').textContent = `${location.origin}${location.pathname}?r=${roomCode}`;
            activateSessionUI();
            history.pushState({}, '', `?r=${roomCode}`);
            renderModalParticipants();
            addSystemMessage('✦ Sessão criada — aguardando participantes...');
            showToast(`✓ Sessão criada! Código: ${roomCode}`);
        })
        .catch(err => {
            btn.disabled = false;
            btn.innerHTML = '<svg viewBox="0 0 14 14" fill="currentColor" width="13" height="13"><path d="M7 1v12M1 7h12"/></svg> Criar sessão';
            showToast(`❌ Erro ao criar: ${err.message}`);
            roomCode = '';
        });
}

/* ── Join session ── */

function joinSession() {
    if (!initFirebase()) return;
    const nameInput = $('cm-join-name').value.trim();
    if (nameInput) saveProfileData(nameInput, myColor, myAvatarUrl);

    const code = $('cm-join-code').value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length !== 6) { showJoinStatus('Digite o código de 6 caracteres.', 'err'); return; }

    myId = genUserId();
    roomCode = code;

    const btn = $('cm-join-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="cm-spinner"></span> Conectando...';
    showJoinStatus(`Verificando sessão ${code}...`, 'info');

    fbRoom = fbDb.ref(`rooms/${code}`);

    fbRoom.once('value')
        .then(snap => {
            if (!snap.exists()) {
                roomCode = '';
                showJoinStatus(`❌ Sessão "${code}" não encontrada.`, 'err');
                btn.disabled = false; btn.innerHTML = 'Entrar na sessão →';
                return;
            }

            const data = snap.val();
            const created = data.createdAt || 0;

            // ── 7-hour expiry check ──
            if (created && (Date.now() - created) >= SESSION_MAX_MS) {
                roomCode = '';
                showJoinStatus('⚠ Esta sessão expirou (limite de 7 horas).', 'err');
                btn.disabled = false; btn.innerHTML = 'Entrar na sessão →';
                // Clean up orphan room
                fbDb.ref(`rooms/${code}`).remove().catch(() => { });
                return;
            }

            if (data.doc !== undefined) applyRemoteContent(data.doc);
            hostId = data.hostId || '';

            showJoinStatus('✓ Conectado com sucesso!', 'ok');
            joinRoom();
            activateSessionUI();

            setTimeout(() => {
                closeCollabModal();
                addSystemMessage('✓ Você entrou na sessão');
                showToast('✓ Conectado! Abrindo chat...');
                setTimeout(toggleChat, 300);
            }, 700);

            btn.disabled = false;
            btn.innerHTML = 'Entrar na sessão →';
        })
        .catch(err => {
            roomCode = '';
            showJoinStatus(`❌ ${err.message}`, 'err');
            btn.disabled = false;
            btn.innerHTML = 'Entrar na sessão →';
        });
}

function showJoinStatus(message, type) {
    const el = $('cm-join-status');
    el.innerHTML = message;
    el.className = `cm-status vis${type === 'err' ? ' cm-err' : type === 'ok' ? ' cm-ok' : ''}`;
}

/* ── Room listeners ── */

function joinRoom() {
    saveLastSession(roomCode);

    const userRef = fbRoom.child(`users/${myId}`);
    userRef.set({
        name: myName,
        color: myColor,
        avatarUrl: myAvatarUrl || '',
        joinedAt: firebase.database.ServerValue.TIMESTAMP,
    });
    userRef.onDisconnect().remove();

    // ── Session expiry timer ──────────────────────────
    fbRoom.child('createdAt').once('value', snap => {
        const created = snap.val();
        if (!created) { sessionStartedAt = Date.now(); startSessionTimerDisplay(); return; }

        sessionStartedAt = created;
        const elapsed = Date.now() - created;
        const remaining = SESSION_MAX_MS - elapsed;

        if (remaining <= 0) {
            showToast('⚠ Sessão expirada (limite de 7 horas). Saindo...');
            setTimeout(() => leaveSession(false), 1200);
            return;
        }

        startSessionTimerDisplay();
        clearTimeout(sessionAutoLeaveTimer);
        sessionAutoLeaveTimer = setTimeout(() => {
            showToast('⏰ Sessão encerrada — limite de 7 horas atingido.');
            leaveSession(false);
        }, remaining);
    });

    // ── Sync hostId ──────────────────────────────────
    fbRoom.child('hostId').once('value', snap => { hostId = snap.val() || ''; });

    // ── Sync document ────────────────────────────────
    const docRef = fbRoom.child('doc');
    const docHandler = docRef.on('value', snap => {
        const val = snap.val();
        if (val !== null && val !== editorEl.value) applyRemoteContent(val);
    });
    sessionListeners.push(() => docRef.off('value', docHandler));

    // ── Sync users list (real-time participant list) ──
    const usersRef = fbRoom.child('users');
    const usersHandler = usersRef.on('value', snap => {
        const users = snap.val() || {};
        const count = Object.keys(users).length;

        // Sound cue when someone new joins (not on initial load)
        if (count > _prevPeerCount && _prevPeerCount > 0) soundUserJoined();
        _prevPeerCount = count;

        window._peerUsers = users;

        renderPresenceBar();
        renderModalParticipants();
        updateCollabBtnLabel();

        // Auto-clean room when everyone has left
        if (!snap.exists() && fbRoom) {
            const ref = fbRoom;
            setTimeout(() => {
                ref.child('users').once('value', s => {
                    if (!s.exists()) ref.remove().catch(() => { });
                });
            }, 4000);
        }
    });
    sessionListeners.push(() => usersRef.off('value', usersHandler));

    // ── Sync session chat ────────────────────────────
    const chatRef = fbRoom.child('chat');
    const joinedAt = Date.now();
    const chatHandler = chatRef.orderByChild('ts').startAt(joinedAt)
        .on('child_added', snap => { if (snap.val()) appendChatMessage(snap.val()); });
    sessionListeners.push(() => chatRef.off('child_added', chatHandler));
}

/* ── Leave session ── */

function leaveSession(silent = false) {
    history.pushState({}, '', location.pathname);
    clearLastSession();

    // Clear session timers
    clearTimeout(sessionAutoLeaveTimer);
    sessionAutoLeaveTimer = null;
    stopSessionTimerDisplay();
    sessionStartedAt = 0;

    if (!roomCode) return;

    sessionListeners.forEach(off => { try { off(); } catch { /* noop */ } });
    sessionListeners = [];

    if (fbRoom) {
        const ref = fbRoom;
        ref.child(`users/${myId}`).remove()
            .then(() => ref.child('users').once('value'))
            .then(snap => { if (!snap.exists()) ref.remove().catch(() => { }); })
            .catch(() => { });
    }

    // Clean up DM listeners
    Object.values(dmListeners).forEach(off => { try { off(); } catch { /* noop */ } });
    dmListeners = {};
    channelUnread = {};
    activeChannel = 'session';

    fbRoom = null;
    roomCode = '';
    myId = '';
    hostId = '';
    window._peerUsers = {};
    _prevPeerCount = 0;

    lastChatSenderId = null;
    clearTimeout(writeDocTimer);

    // Reset UI
    $('dm-list').innerHTML = '';
    $('ch-session').classList.add('active');
    $('collab-btn').classList.remove('active');
    $('presence-bar').classList.remove('active');
    $('chat-toggle-btn').classList.remove('vis', 'on');
    $('chat-panel').classList.remove('open', 'pb-active');
    $('presence-list').innerHTML = '';
    $('chat-messages').innerHTML = '';
    chatPanelOpen = false;
    updateUnreadBadges();
    updateCollabBtnLabel();
    closeCollabModal();

    // Reset collab modal back to create-step1
    $('cm-create-step1').style.display = 'block';
    $('cm-create-step2').style.display = 'none';
    $('cm-create-btn').disabled = false;
    $('cm-create-btn').innerHTML =
        '<svg viewBox="0 0 14 14" fill="currentColor" width="13" height="13"><path d="M7 1v12M1 7h12"/></svg> Criar sessão';
    $('cm-join-status').className = 'cm-status';
    $('cm-join-code').value = '';

    if (!silent) showToast('Você saiu da sessão.');
}

/* ═══════════════════════════════════════════════════════
   LINK / REJOIN
═══════════════════════════════════════════════════════ */

function saveLastSession(code) {
    lsSet(STORAGE_KEYS.lastSession, JSON.stringify({ code, ts: Date.now() }));
}
function clearLastSession() {
    try { localStorage.removeItem(STORAGE_KEYS.lastSession); } catch { /* noop */ }
}

function checkUrlSession() {
    const code = new URLSearchParams(location.search).get('r');
    if (!code) return;
    const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (clean.length !== 6) return;
    $('cm-join-code').value = clean;
    $('cm-join-name').value = myName !== 'Anônimo' ? myName : '';
    openCollabModal();
    switchCollabTab('join');
    if (myName && myName !== 'Anônimo') setTimeout(joinSession, 420);
    else setTimeout(() => $('cm-join-name').focus(), 80);
}

function checkRejoin() {
    if (new URLSearchParams(location.search).get('r')) return;
    try {
        const stored = JSON.parse(lsGet(STORAGE_KEYS.lastSession, 'null'));
        if (!stored) return;
        // Show rejoin bar if within 30 min of last session
        if (Date.now() - stored.ts > 30 * 60 * 1000) { clearLastSession(); return; }
        showRejoinBar(stored.code);
    } catch { clearLastSession(); }
}

function showRejoinBar(code) {
    $('rejoin-code-lbl').textContent = code;
    $('rejoin-bar').dataset.code = code;
    $('rejoin-bar').classList.add('active');
}

function dismissRejoin() { $('rejoin-bar').classList.remove('active'); clearLastSession(); }

function rejoinSession() {
    const code = $('rejoin-bar').dataset.code;
    dismissRejoin();
    $('cm-join-code').value = code;
    $('cm-join-name').value = myName !== 'Anônimo' ? myName : '';
    openCollabModal();
    switchCollabTab('join');
    if (myName && myName !== 'Anônimo') setTimeout(joinSession, 300);
}

window.dismissRejoin = dismissRejoin;
window.rejoinSession = rejoinSession;

/* ── Page unload cleanup ── */

function unloadCleanup() {
    if (!fbDb || !myId || !roomCode) return;
    const base = FIREBASE_CONFIG.databaseURL;
    const key = FIREBASE_CONFIG.apiKey;
    fetch(`${base}/rooms/${roomCode}/users/${myId}.json?auth=${key}`, { method: 'DELETE', keepalive: true })
        .then(() => fetch(`${base}/rooms/${roomCode}/users.json?auth=${key}`))
        .then(r => r.json())
        .then(data => {
            if (!data) fetch(`${base}/rooms/${roomCode}.json?auth=${key}`, { method: 'DELETE', keepalive: true });
        })
        .catch(() => { });
}
window.addEventListener('beforeunload', unloadCleanup);

/* ── Presence bar ── */

function getPeerUsers() { return window._peerUsers || {}; }

function renderPresenceBar() {
    const list = $('presence-list');
    const users = getPeerUsers();
    list.innerHTML = '';

    Object.entries(users).forEach(([id, user]) => {
        const isMe = id === myId;
        const isHost = id === hostId;

        const chip = document.createElement('div');
        chip.className = `presence-chip${isMe ? ' presence-me' : ''}`;
        chip.title = user.name + (isMe ? ' (você)' : '') + (isHost ? ' · host' : '');

        const av = document.createElement('div');
        av.className = 'presence-avatar';
        renderAvatar(av, user.name, user.color, user.avatarUrl);

        // Host crown indicator
        if (isHost) {
            const crown = document.createElement('span');
            crown.className = 'presence-crown';
            crown.textContent = '★';
            crown.title = 'Host da sessão';
            chip.appendChild(crown);
        }

        const label = document.createElement('span');
        label.textContent = user.name + (isMe ? ' (você)' : '');

        chip.appendChild(av);
        chip.appendChild(label);
        list.appendChild(chip);
    });

    renderDmList();
}

function renderModalParticipants() {
    const list = $('cm-participants-list');
    if (!list) return;
    list.innerHTML = '';

    const users = Object.entries(getPeerUsers());
    if (!users.length) return;

    users.forEach(([id, user]) => {
        const isMe = id === myId;
        const isHost = id === hostId;

        const row = document.createElement('div');
        row.className = 'cm-peer-row';

        const av = document.createElement('div');
        av.className = 'cm-peer-avatar';
        renderAvatar(av, user.name, user.color, user.avatarUrl);
        row.appendChild(av);

        const namePart = document.createElement('span');
        namePart.className = 'cm-peer-name';
        namePart.textContent = user.name;
        row.appendChild(namePart);

        if (isHost) {
            const hostTag = document.createElement('span');
            hostTag.className = 'cm-peer-host';
            hostTag.textContent = 'host';
            row.appendChild(hostTag);
        }
        if (isMe) {
            const youTag = document.createElement('span');
            youTag.className = 'cm-peer-you';
            youTag.textContent = 'você';
            row.appendChild(youTag);
        }

        list.appendChild(row);
    });

    // Show waiting message when only 1 participant
    if (users.length === 1) {
        const wait = document.createElement('div');
        wait.className = 'cm-waiting-row';
        wait.innerHTML = '<span class="cm-spinner"></span><span>Aguardando participantes...</span>';
        list.appendChild(wait);
    }

    // Update session info (time remaining)
    _updateModalSessionInfo();
}

function updateCollabBtnLabel() {
    const count = Object.keys(getPeerUsers()).length;
    const lbl = $('collab-btn').querySelector('.lbl');
    if (lbl) lbl.textContent = count > 0 ? `Colaborar (${count})` : 'Colaborar';
}

function activateSessionUI() {
    window._peerUsers = window._peerUsers || {};
    activeChannel = 'session';
    channelUnread = {};

    $('collab-btn').classList.add('active');
    $('presence-bar').classList.add('active');
    $('chat-toggle-btn').classList.add('vis');
    $('chat-panel').classList.add('pb-active');
    $('pb-room-code').textContent = roomCode;

    renderMyAvatar();
    renderPresenceBar();
    renderChatEmptyState('session');

    document.querySelectorAll('.chat-channel-btn').forEach(b => b.classList.remove('active'));
    $('ch-session').classList.add('active');
}

function copyRoomCode() {
    if (!roomCode) return;
    const url = `${location.origin}${location.pathname}?r=${roomCode}`;
    navigator.clipboard.writeText(url).then(() => showToast('✓ Link da sessão copiado!'));
}

window.openCollabModal = openCollabModal;
window.closeCollabModal = closeCollabModal;
window.closeCollabOnBg = closeCollabOnBg;
window.switchCollabTab = switchCollabTab;
window.hostSession = hostSession;
window.joinSession = joinSession;
window.leaveSession = leaveSession;
window.copyRoomCode = copyRoomCode;


/* ═══════════════════════════════════════════════════════
   16. CHAT — CHANNELS & DMs
═══════════════════════════════════════════════════════ */

let activeChannel = 'session';
let dmListeners = {};
let channelUnread = {};
let chatPanelOpen = false;
let lastChatSenderId = null;
let isLoadingHistory = false;
let pendingImageFile = null;

/* ── Channel switching ── */

function switchChannel(channel) {
    activeChannel = channel;

    document.querySelectorAll('.chat-channel-btn, .dm-btn')
        .forEach(el => el.classList.remove('active'));

    const btnId = channel === 'session'
        ? 'ch-session'
        : `dm-btn-${channel.replace('dm:', '')}`;
    const btn = $(btnId);
    if (btn) btn.classList.add('active');

    channelUnread[channel] = 0;
    renderChannelBadge(channel);
    updateUnreadBadges();

    if (channel === 'session') {
        $('chat-channel-icon').textContent = '#';
        $('chat-channel-name').textContent = 'sessão';
        $('chat-channel-desc').textContent = 'Chat da sessão';
        $('chat-input').placeholder = 'Enviar para #sessão...';
    } else {
        const peerId = channel.replace('dm:', '');
        const user = getPeerUsers()[peerId] || {};
        $('chat-channel-icon').innerHTML = '';
        const miniAvatar = document.createElement('div');
        miniAvatar.style.cssText =
            'width:18px;height:18px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;color:#fff;flex-shrink:0;';
        miniAvatar.style.background = user.color || '#888';
        if (user.avatarUrl) {
            miniAvatar.innerHTML = `<img src="${escHtml(user.avatarUrl)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        } else {
            miniAvatar.textContent = getInitials(user.name || '?');
        }
        $('chat-channel-icon').appendChild(miniAvatar);
        $('chat-channel-name').textContent = user.name || '?';
        $('chat-channel-desc').textContent = 'Mensagem direta';
        $('chat-input').placeholder = `Enviar para ${user.name || '?'}...`;
    }

    $('chat-messages').innerHTML = '';
    lastChatSenderId = null;
    loadChannelHistory(channel);
}

function loadChannelHistory(channel) {
    if (!fbRoom) return;
    const ref = channel === 'session'
        ? fbRoom.child('chat')
        : fbRoom.child(`dm/${dmChannelKey(myId, channel.replace('dm:', ''))}`);

    ref.orderByChild('ts').limitToLast(80).once('value', snap => {
        const messages = [];
        snap.forEach(s => { if (s.val()) messages.push(s.val()); });

        isLoadingHistory = true;
        messages.forEach(msg => appendChatMessage(msg));
        isLoadingHistory = false;

        const container = $('chat-messages');
        container.scrollTop = container.scrollHeight;
        if (!messages.length) renderChatEmptyState(channel);

        channelUnread[channel] = 0;
        renderChannelBadge(channel);
        updateUnreadBadges();
    });
}

/* ── DM list (sidebar) ── */

function renderDmList() {
    const list = $('dm-list');
    if (!list) return;
    list.innerHTML = '';

    Object.entries(getPeerUsers()).forEach(([id, user]) => {
        if (id === myId) return;
        const chKey = `dm:${id}`;

        const btn = document.createElement('button');
        btn.className = `dm-btn${activeChannel === chKey ? ' active' : ''}`;
        btn.id = `dm-btn-${id}`;
        btn.addEventListener('click', () => switchChannel(chKey));

        const av = document.createElement('div');
        av.className = 'dm-btn-avatar';
        renderAvatar(av, user.name, user.color, user.avatarUrl);

        const nm = document.createElement('span');
        nm.className = 'dm-btn-name';
        nm.textContent = user.name || '?';

        const dot = document.createElement('span');
        dot.className = 'dm-online-dot';
        dot.title = 'online';

        const badge = document.createElement('span');
        badge.className = 'dm-ch-badge';
        badge.id = `dm-badge-${id}`;
        const count = channelUnread[chKey] || 0;
        if (count > 0) { badge.textContent = count > 9 ? '9+' : count; badge.classList.add('vis'); }

        btn.append(av, nm, dot, badge);
        list.appendChild(btn);
        subscribeToDm(id);
    });
}

/* ── DM subscription ── */

function subscribeToDm(peerId) {
    if (dmListeners[peerId] || !fbRoom) return;
    const key = dmChannelKey(myId, peerId);
    const ref = fbRoom.child(`dm/${key}`);
    const joinedAt = Date.now();

    const handler = ref.orderByChild('ts').startAt(joinedAt)
        .on('child_added', snap => {
            const msg = snap.val();
            if (!msg) return;
            const chKey = `dm:${peerId}`;
            if (activeChannel === chKey && chatPanelOpen) {
                appendChatMessage(msg);
            } else if (msg.userId !== myId) {
                channelUnread[chKey] = (channelUnread[chKey] || 0) + 1;
                renderChannelBadge(chKey);
                updateUnreadBadges();
                soundDmReceived();
            }
        });

    dmListeners[peerId] = () => ref.off('child_added', handler);
}

/* ── Unread badges ── */

function renderChannelBadge(channel) {
    const count = channelUnread[channel] || 0;
    if (channel === 'session') {
        const b = $('ch-badge-session');
        if (b) { b.textContent = count > 9 ? '9+' : count; b.classList.toggle('vis', count > 0); }
    } else {
        const peerId = channel.replace('dm:', '');
        const b = $(`dm-badge-${peerId}`);
        if (b) { b.textContent = count > 9 ? '9+' : count; b.classList.toggle('vis', count > 0); }
    }
}

function updateUnreadBadges() {
    const total = Object.values(channelUnread).reduce((a, b) => a + b, 0);
    const hasDm = Object.keys(channelUnread).some(k => k.startsWith('dm:') && channelUnread[k] > 0);
    const hasSess = (channelUnread['session'] || 0) > 0;

    const badge = $('chat-badge');
    badge.textContent = total > 9 ? '9+' : total;
    badge.classList.toggle('vis', total > 0);

    if (total === 0) document.title = 'Markdowner | MD Editor & Viewer';
    else if (hasDm && !hasSess) document.title = `(${total}) 🟢 Markdowner | MD Editor & Viewer`;
    else document.title = `(${total}) 🔴 Markdowner | MD Editor & Viewer`;
}

/* ── Chat panel toggle ── */

function toggleChat() {
    chatPanelOpen = !chatPanelOpen;
    $('chat-panel').classList.toggle('open', chatPanelOpen);
    $('chat-toggle-btn').classList.toggle('on', chatPanelOpen);

    if (chatPanelOpen) {
        channelUnread[activeChannel] = 0;
        renderChannelBadge(activeChannel);
        updateUnreadBadges();
        setTimeout(() => {
            const container = $('chat-messages');
            container.scrollTop = container.scrollHeight;
            $('chat-input').focus();
        }, 50);
    }
}

window.toggleChat = toggleChat;
window.switchChannel = switchChannel;

/* ── Send message ── */

function sendChatMessage() {
    const input = $('chat-input');
    const text = input.value.trim();
    const hasImg = pendingImageFile !== null;
    if (!text && !hasImg) return;
    if (!fbRoom) return;

    const msgBase = {
        userId: myId,
        userName: myName,
        userColor: myColor,
        avatarUrl: myAvatarUrl || '',
        ts: firebase.database.ServerValue.TIMESTAMP,
    };

    const targetRef = activeChannel === 'session'
        ? fbRoom.child('chat')
        : fbRoom.child(`dm/${dmChannelKey(myId, activeChannel.replace('dm:', ''))}`);

    if (hasImg) {
        sendImageMessage(targetRef, pendingImageFile, text, msgBase);
        input.value = '';
        clearImagePreview();
        autoResizeChatInput();
        return;
    }

    input.value = '';
    autoResizeChatInput();
    soundMessageSent();
    targetRef.push({ ...msgBase, text }).catch(() => { });
}
window.sendChat = sendChatMessage;

/* ── Append message to DOM ── */

function appendChatMessage(msg) {
    const container = $('chat-messages');
    const empty = container.querySelector('.chat-empty');
    if (empty) empty.remove();

    const isMine = msg.userId === myId;
    const grouped = lastChatSenderId === msg.userId;
    lastChatSenderId = msg.userId;

    const time = new Date(msg.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const div = document.createElement('div');
    div.className = `chat-msg${grouped ? ' grouped' : ''}`;

    const side = document.createElement('div');
    side.className = 'chat-msg-side';

    if (!grouped) {
        const av = document.createElement('div');
        av.className = 'chat-msg-avatar';
        av.style.background = msg.userColor || '#888';
        av.title = msg.userName;
        if (msg.avatarUrl) {
            const img = document.createElement('img');
            img.src = msg.avatarUrl;
            img.onerror = () => { av.removeChild(img); av.textContent = getInitials(msg.userName); };
            av.appendChild(img);
        } else {
            av.textContent = getInitials(msg.userName);
        }
        side.appendChild(av);
    } else {
        const hoverTime = document.createElement('span');
        hoverTime.className = 'chat-msg-hover-time';
        hoverTime.textContent = time;
        side.appendChild(hoverTime);
    }

    const body = document.createElement('div');
    body.className = 'chat-msg-body';

    if (!grouped) {
        const nameColor = isMine ? 'var(--a2)' : (msg.userColor || 'var(--tx2)');
        const meta = document.createElement('div');
        meta.className = 'chat-msg-meta';
        meta.innerHTML =
            `<span class="chat-msg-name" style="color:${nameColor}">${escHtml(msg.userName)}</span>` +
            `<span class="chat-msg-time">${time}</span>`;
        body.appendChild(meta);
    }

    if (msg.type === 'image' && msg.imageData) {
        const wrap = document.createElement('div');
        wrap.className = 'chat-msg-img-wrap';
        const imgEl = document.createElement('img');
        imgEl.className = 'chat-msg-img';
        imgEl.loading = 'lazy';
        imgEl.src = msg.imageData;
        imgEl.alt = 'imagem';
        imgEl.addEventListener('click', () => openLightbox(msg.imageData));
        wrap.appendChild(imgEl);
        if (msg.caption) {
            const cap = document.createElement('div');
            cap.className = 'chat-msg-img-caption';
            cap.textContent = msg.caption;
            wrap.appendChild(cap);
        }
        body.appendChild(wrap);
    } else {
        const textEl = document.createElement('div');
        textEl.className = 'chat-msg-text';
        textEl.textContent = msg.text || '';
        body.appendChild(textEl);
    }

    div.appendChild(side);
    div.appendChild(body);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;

    // Unread tracking — session channel
    if (!isMine && !isLoadingHistory) {
        const isVisible = chatPanelOpen && activeChannel === 'session';
        if (!isVisible) {
            channelUnread['session'] = (channelUnread['session'] || 0) + 1;
            renderChannelBadge('session');
            updateUnreadBadges();
            soundMessageReceived();
        }
    }
}

function renderChatEmptyState(channel) {
    const container = $('chat-messages');
    if (container.children.length) return;
    const isDm = channel?.startsWith('dm:');
    const div = document.createElement('div');
    div.className = 'chat-empty';
    div.innerHTML = `
    <div class="chat-empty-icon">${isDm ? '🔒' : '💬'}</div>
    <div class="chat-empty-title">${isDm ? 'Conversa privada' : 'Nenhuma mensagem ainda'}</div>
    <div>${isDm ? 'As mensagens são visíveis apenas para vocês dois.' : 'Seja o primeiro a dizer oi!'}</div>`;
    container.appendChild(div);
}

function addSystemMessage(text) {
    const container = $('chat-messages');
    const empty = container.querySelector('.chat-empty');
    if (empty) empty.remove();
    const div = document.createElement('div');
    div.className = 'chat-sys-msg';
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    lastChatSenderId = null;
}

/* ── Chat input ── */

$('chat-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
});
$('chat-input').addEventListener('input', autoResizeChatInput);

function autoResizeChatInput() {
    const el = $('chat-input');
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 88) + 'px';
}

/* ── Emoji picker ── */

let emojiPickerOpen = false;

const _picker = $('emoji-picker');
if (_picker) {
    _picker.setAttribute('locale', 'pt');
    _picker.setAttribute('data-source', 'https://cdn.jsdelivr.net/npm/emoji-picker-element-data@1/pt/cldr/data.json');
}

function toggleEmojiPicker() {
    emojiPickerOpen = !emojiPickerOpen;
    $('emoji-picker-wrap').classList.toggle('open', emojiPickerOpen);
    $('emoji-btn').setAttribute('aria-expanded', emojiPickerOpen);
}

document.addEventListener('emoji-click', e => {
    const emoji = e.detail?.unicode;
    if (!emoji) return;
    const ta = $('chat-input');
    const pos = ta.selectionStart ?? ta.value.length;
    ta.value = ta.value.slice(0, pos) + emoji + ta.value.slice(pos);
    ta.selectionStart = ta.selectionEnd = pos + emoji.length;
    ta.focus();
    autoResizeChatInput();
    emojiPickerOpen = false;
    $('emoji-picker-wrap').classList.remove('open');
    $('emoji-btn').setAttribute('aria-expanded', 'false');
});

document.addEventListener('click', e => {
    if (!emojiPickerOpen) return;
    if (!$('emoji-picker-wrap').contains(e.target) && !$('emoji-btn').contains(e.target)) {
        emojiPickerOpen = false;
        $('emoji-picker-wrap').classList.remove('open');
        $('emoji-btn').setAttribute('aria-expanded', 'false');
    }
});
window.toggleEmojiPicker = toggleEmojiPicker;

/* ── Image upload / paste ── */

$('chat-file-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Só imagens são suportadas.'); return; }
    setPendingImage(file);
    e.target.value = '';
});

document.addEventListener('paste', e => {
    if (!chatPanelOpen) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
        if (item.type.startsWith('image/')) {
            e.preventDefault();
            const file = item.getAsFile();
            if (file) setPendingImage(file);
            break;
        }
    }
});

function setPendingImage(file) {
    pendingImageFile = file;
    const reader = new FileReader();
    reader.onload = ev => {
        $('chat-img-preview-img').src = ev.target.result;
        $('chat-img-preview').classList.add('vis');
        $('chat-input').focus();
    };
    reader.readAsDataURL(file);
}

function clearImagePreview() {
    pendingImageFile = null;
    $('chat-img-preview').classList.remove('vis');
    $('chat-img-preview-img').src = '';
}
window.clearImgPreview = clearImagePreview;

/* ── Image compression ── */

function compressImage(file) {
    return new Promise((resolve, reject) => {
        const isScreenshot = file.type === 'image/png';
        const maxPx = isScreenshot ? IMG.maxPxScreen : IMG.maxPxPhoto;
        const quality = isScreenshot ? IMG.qualityScreen : IMG.qualityPhoto;
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            let { width: w, height: h } = img;
            if (w > maxPx || h > maxPx) {
                if (w >= h) { h = Math.round(h * maxPx / w); w = maxPx; }
                else { w = Math.round(w * maxPx / h); h = maxPx; }
            }
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (isScreenshot) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
            ctx.drawImage(img, 0, 0, w, h);

            const b64 = canvas.toDataURL('image/jpeg', quality);
            if (b64.length <= IMG.maxB64) { resolve(b64); return; }

            const b64b = canvas.toDataURL('image/jpeg', isScreenshot ? 0.70 : 0.45);
            if (b64b.length <= IMG.maxB64) { resolve(b64b); return; }

            const c2 = document.createElement('canvas');
            c2.width = Math.round(w * 0.6);
            c2.height = Math.round(h * 0.6);
            c2.getContext('2d').drawImage(canvas, 0, 0, c2.width, c2.height);
            const b64c = c2.toDataURL('image/jpeg', 0.60);
            if (b64c.length <= IMG.maxB64) { resolve(b64c); return; }

            reject(new Error('Imagem muito grande mesmo após compressão. Tente recortar antes de enviar.'));
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não foi possível ler a imagem.')); };
        img.src = url;
    });
}

function sendImageMessage(targetRef, file, caption, msgBase) {
    showToast('⏳ Comprimindo imagem...');
    compressImage(file)
        .then(b64 => targetRef.push({ ...msgBase, type: 'image', imageData: b64, caption: caption || '' }).catch(() => { }))
        .catch(err => showToast(`❌ ${err.message}`));
}


/* ═══════════════════════════════════════════════════════
   17. IMAGE LIGHTBOX
═══════════════════════════════════════════════════════ */

let lbScale = 1;
const LB_MIN = 0.2, LB_MAX = 5;
let lbPan = { x: 0, y: 0 };
let lbDrag = { active: false, moved: false, sx: 0, sy: 0, ox: 0, oy: 0 };

function openLightbox(url) {
    $('img-lightbox-img').src = url;
    lbScale = 1; lbPan = { x: 0, y: 0 };
    applyLightboxTransform();
    $('img-lightbox').classList.add('vis');
}
function closeLightbox() {
    $('img-lightbox').classList.remove('vis');
    $('img-lightbox-img').src = '';
}
function applyLightboxTransform() {
    $('img-lightbox-img').style.transform = `translate(${lbPan.x}px, ${lbPan.y}px) scale(${lbScale})`;
    $('lb-zoom-level').textContent = `${Math.round(lbScale * 100)}%`;
}
function lbZoom(delta) {
    lbScale = Math.min(LB_MAX, Math.max(LB_MIN, lbScale + delta));
    applyLightboxTransform();
}
function lbResetZoom() { lbScale = 1; lbPan = { x: 0, y: 0 }; applyLightboxTransform(); }
function lbDownload() {
    const src = $('img-lightbox-img').src;
    if (!src) return;
    const a = document.createElement('a');
    a.href = src; a.download = `markdowner-chat-${Date.now()}.jpg`;
    a.click();
}

$('img-lightbox').addEventListener('wheel', e => { e.preventDefault(); lbZoom(e.deltaY < 0 ? 0.15 : -0.15); }, { passive: false });
$('lb-img-wrap').addEventListener('click', e => { if (lbDrag.moved) return; if (e.target === $('lb-img-wrap')) closeLightbox(); });
$('lb-img-wrap').addEventListener('mousedown', e => {
    if (e.target !== $('lb-img-wrap') && e.target !== $('img-lightbox-img')) return;
    lbDrag = { active: true, moved: false, sx: e.clientX, sy: e.clientY, ox: lbPan.x, oy: lbPan.y };
    $('lb-img-wrap').classList.add('grabbing');
});
window.addEventListener('mousemove', e => {
    if (!lbDrag.active) return;
    const dx = e.clientX - lbDrag.sx, dy = e.clientY - lbDrag.sy;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) lbDrag.moved = true;
    lbPan.x = lbDrag.ox + dx; lbPan.y = lbDrag.oy + dy;
    applyLightboxTransform();
});
window.addEventListener('mouseup', () => { lbDrag.active = false; $('lb-img-wrap').classList.remove('grabbing'); });

window.lbZoom = lbZoom;
window.lbResetZoom = lbResetZoom;
window.lbDownload = lbDownload;
window.closeLightbox = closeLightbox;


/* ═══════════════════════════════════════════════════════
   18. KEYBOARD SHORTCUTS
═══════════════════════════════════════════════════════ */

document.addEventListener('keydown', e => {
    if ($('img-lightbox').classList.contains('vis')) {
        if (e.key === 'Escape') { closeLightbox(); return; }
        if (e.key === '+' || e.key === '=') { lbZoom(0.25); return; }
        if (e.key === '-') { lbZoom(-0.25); return; }
        if (e.key === '0') { lbResetZoom(); return; }
    }
    if (e.key !== 'Escape') return;
    if ($('profile-backdrop').classList.contains('vis')) { closeProfileModal(); return; }
    if ($('collab-backdrop').classList.contains('vis')) { closeCollabModal(); return; }
    if (chatPanelOpen) { toggleChat(); return; }
});


/* ═══════════════════════════════════════════════════════
   19. COLLAB INPUT QoL
═══════════════════════════════════════════════════════ */

$('cm-join-code').addEventListener('input', function () {
    const val = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    this.value = val;
    if (val.length === 6 && $('cm-join-name').value.trim()) setTimeout(joinSession, 280);
});

$('cm-host-name').addEventListener('keydown', e => { if (e.key === 'Enter') hostSession(); });
$('cm-join-name').addEventListener('keydown', e => { if (e.key === 'Enter') $('cm-join-code').focus(); });
$('cm-join-code').addEventListener('keydown', e => { if (e.key === 'Enter') joinSession(); });


/* ═══════════════════════════════════════════════════════
   20. INITIALISATION
═══════════════════════════════════════════════════════ */

(function init() {
    loadProfile();
    initColors();

    applyTheme(lsGet(STORAGE_KEYS.theme, 'dark') === 'dark');
    applyAccent1(lsGet(STORAGE_KEYS.acc1, '#e8a020'));
    applyAccent2(lsGet(STORAGE_KEYS.acc2, '#2fa88a'));

    editorEl.value = lsGet(STORAGE_KEYS.content, DEFAULT_MD);
    renderPreview();
    updateCharCount();
    saveStatusEl.textContent = 'Salvo';

    if (window.innerWidth <= 700) setView('edit');
    if (!lsGet(STORAGE_KEYS.toured)) setTimeout(showWelcomeModal, 600);

    checkUrlSession();
    checkRejoin();
})();