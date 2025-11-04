/**
 * script.js — Lima Calixto Catalogo (com product codes e suporte contato-whatsapp.json)
 *
 * Mantém todas as funcionalidades anteriores e adiciona:
 * - assignProductCodes(products): cria campo `code` por produto (ex: "CD-0001")
 * - usa product.code também nas mensagens geradas para WhatsApp
 */

/* ===================== KEYS / CONSTANTS ===================== */
const LS_PRODUCTS_KEY = 'lc_products_v1';
const LS_WA_KEY = 'lc_waNumber';
const LS_THEME_KEY = 'lc_theme';

/* ===================== HELPERS ===================== */
/** placeholder SVG data URI */
function placeholder(label = 'Produto') {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'><rect width='100%' height='100%' fill='#141924'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Inter, sans-serif' font-size='48'>${String(label)}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
function escapeHtml(s) {
  return String(s || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}
function formatBRL(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/* ===================== PRODUCT CODES HELPERS ===================== */
/** zero pad num to width (e.g. 1 -> "0001") */
function zeroPad(num, width = 4) {
  const s = String(num);
  return s.length >= width ? s : '0'.repeat(width - s.length) + s;
}

/** cria acrônimo da categoria (até 3 letras) */
function categoryAcronym(cat) {
  if (!cat) return 'PRD';
  const words = String(cat).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'PRD';
  if (words.length === 1) {
    const filtered = words[0].replace(/[^A-Za-zÀ-ÿ]/g, '');
    return (filtered.slice(0, 3).toUpperCase() || 'PRD');
  }
  return words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
}

/**
 * assignProductCodes(products)
 * - products: array já normalizado [{id,name,category,...}, ...]
 * Aplica o campo `code` a cada produto de forma determinística e amigável.
 */
function assignProductCodes(products) {
  if (!Array.isArray(products)) return;
  const seen = new Map(); // codeBase -> count (para suffix)
  for (let i = 0; i < products.length; i++) {
    const p = products[i];

    let baseNum = null;
    if (p.id !== undefined && p.id !== null) {
      const m = String(p.id).match(/(\d+)/);
      if (m) baseNum = Number(m[1]);
    }
    if (baseNum === null || Number.isNaN(baseNum)) baseNum = i + 1;

    const prefix = categoryAcronym(p.category || 'PRD');
    const core = zeroPad(baseNum, 4);
    let candidateBase = `${prefix}-${core}`;
    let candidate = candidateBase;

    if (seen.has(candidateBase)) {
      const n = seen.get(candidateBase) + 1;
      seen.set(candidateBase, n);
      const suffix = String.fromCharCode(64 + n);
      candidate = `${candidateBase}-${suffix}`;
    } else {
      seen.set(candidateBase, 0);
    }

    p.code = candidate;
  }
}

/* ===================== STATE ===================== */
const state = {
  products: [],      // array normalized
  query: '',
  category: 'todas',
  minPrice: null,
  maxPrice: null,
  sort: 'default',   // use 'default' internally to match the <select> values
  waNumber: localStorage.getItem(LS_WA_KEY) || '' // may be empty; loadWhatsAppConfig can populate
};

/* ===================== THEME ===================== */
function applyTheme(theme) {
  try {
    if (!theme) theme = 'dark';
    document.body.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
    const t = document.getElementById('themeToggle');
    if (t) t.setAttribute('aria-pressed', String(theme === 'light'));
    try { localStorage.setItem(LS_THEME_KEY, theme); } catch (e) { /* ignore */ }
    console.log('[LimaCalixto] applyTheme ->', theme);
  } catch (e) { console.error('[LimaCalixto] applyTheme error', e); }
}
function readTheme() {
  try { return localStorage.getItem(LS_THEME_KEY) || 'dark'; } catch (e) { return 'dark'; }
}

/* ===================== NORMALIZE PRODUCTS ===================== */
/**
 * Accepts array of objects and returns normalized array with fields:
 * { id, name, description, category, price, image }
 * Accepts both english and portuguese keys.
 */
function normalizeProductsArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((it, idx) => {
    const id = it.id ?? it.ID ?? it._id ?? `ext-${idx}`;
    const name = it.name ?? it.nome ?? it.title ?? `Produto ${idx + 1}`;
    const description = it.description ?? it.descricao ?? it.desc ?? '';
    const category = it.category ?? it.categoria ?? 'Personalizados';
    const price = Number(it.price ?? it.preco ?? it.valor ?? 0) || 0;
    const image = (it.image ?? it.imagem ?? it.photo ?? '').toString().trim() || '';
    return { id, name, description, category, price, image };
  });
}

/* ===================== LOCALSTORAGE HELPERS ===================== */
function saveProductsToLocalStorage(products) {
  try {
    localStorage.setItem(LS_PRODUCTS_KEY, JSON.stringify(products));
    console.log('[LimaCalixto] produtos salvos no localStorage');
  } catch (e) {
    console.error('[LimaCalixto] erro ao salvar localStorage', e);
  }
}
function readProductsFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LS_PRODUCTS_KEY);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return null;
    const normalized = normalizeProductsArray(arr);
    assignProductCodes(normalized);
    return normalized;
  } catch (e) {
    console.error('[LimaCalixto] erro lendo localStorage', e);
    return null;
  }
}

/* ===================== EXPORT / IMPORT ===================== */
function exportProductsToFile(products, filename = 'produtos.json') {
  try {
    const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
    alert('Erro ao exportar produtos.');
  }
}
async function loadFromUrl(url) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('JSON precisa ser um array');
    state.products = normalizeProductsArray(data);
    assignProductCodes(state.products);
    saveProductsToLocalStorage(state.products);
    render();
    alert('Produtos carregados via URL');
  } catch (e) {
    console.error(e);
    alert('Erro ao carregar URL: ' + (e.message || e));
  }
}
function parseCSVToProducts(txt) {
  const lines = txt.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const items = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const obj = {};
    for (let j = 0; j < headers.length; j++) obj[headers[j]] = cols[j] ?? '';
    items.push(obj);
  }
  return normalizeProductsArray(items);
}
function loadFromFile(file) {
  if (!file) return alert('Arquivo inválido');
  const r = new FileReader();
  r.onload = (ev) => {
    try {
      const txt = ev.target.result;
      if (file.name.toLowerCase().endsWith('.json')) {
        const j = JSON.parse(txt);
        if (!Array.isArray(j)) throw new Error('JSON precisa ser um array');
        state.products = normalizeProductsArray(j);
        assignProductCodes(state.products);
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        state.products = parseCSVToProducts(txt);
        assignProductCodes(state.products);
      } else {
        throw new Error('Formato não suportado');
      }
      saveProductsToLocalStorage(state.products);
      render();
      alert('Produtos carregados do arquivo');
    } catch (err) {
      console.error(err);
      alert('Erro ao processar arquivo: ' + (err.message || err));
    }
  };
  r.onerror = (e) => { console.error(e); alert('Erro ao ler arquivo'); };
  r.readAsText(file, 'UTF-8');
}

/* ===================== LOAD produtos.json (relative) ===================== */
async function loadProdutosJsonAuto() {
  try {
    const res = await fetch('produtos.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('produtos.json não é um array');
    state.products = normalizeProductsArray(data);
    assignProductCodes(state.products);
    saveProductsToLocalStorage(state.products);
    console.log('[LimaCalixto] produtos carregados de produtos.json');
    return true;
  } catch (e) {
    console.warn('[LimaCalixto] load produtos.json failed:', e.message || e);
    return false;
  }
}

/* ===================== INITIAL LOAD ===================== */
async function initialLoadProducts() {
  const ok = await loadProdutosJsonAuto();
  if (ok) { render(); return; }
  const saved = readProductsFromLocalStorage();
  if (saved && saved.length) {
    state.products = saved;
    console.log('[LimaCalixto] produtos carregados do localStorage');
    render(); return;
  }
  const embedded = [
    { id: 1, name: 'Caneca de Porcelana 325ml', category: 'Sublimação', price: 35.9, description: 'Personalize com fotos, nomes ou frases.', image: '' },
    { id: 2, name: 'Camiseta Poliéster', category: 'Sublimação', price: 49.9, description: 'Estampa de alta definição.', image: '' },
    { id: 3, name: 'Chaveiro Acrílico', category: 'Personalizados', price: 15.0, description: 'Chaveiros exclusivos.', image: '' },
    { id: 4, name: 'Convite Digital Casamento', category: 'Convites Digitais', price: 49.9, description: 'Layout elegante.', image: '' }
  ];
  state.products = normalizeProductsArray(embedded);
  assignProductCodes(state.products);
  render();
}

/* ===================== NEW: WHATSAPP CONFIG LOADER ===================== */
async function loadWhatsAppConfig() {
  try {
    const saved = localStorage.getItem(LS_WA_KEY);
    if (saved && saved.trim()) {
      state.waNumber = saved.trim();
      const footerPhone = document.getElementById('footerPhone');
      if (footerPhone) footerPhone.href = `https://wa.me/${state.waNumber}`;
      console.log('[LimaCalixto] WhatsApp via localStorage ->', state.waNumber);
      return;
    }

    try {
      const res = await fetch('contato-whatsapp.json', { cache: 'no-store' });
      if (!res.ok) {
        console.log('[LimaCalixto] contato-whatsapp.json não encontrado (HTTP ' + res.status + ')');
        return;
      }
      const data = await res.json();
      let number = '';

      if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        number = first.whatsapp ?? first.wa ?? first.number ?? first.tel ?? '';
      } else if (data && typeof data === 'object') {
        number = data.whatsapp ?? data.wa ?? data.number ?? data.tel ?? '';
      }

      if (number && String(number).trim()) {
        state.waNumber = String(number).replace(/\D/g, '').trim();
        const footerPhone = document.getElementById('footerPhone');
        if (footerPhone) footerPhone.href = `https://wa.me/${state.waNumber}`;
        console.log('[LimaCalixto] WhatsApp via contato-whatsapp.json ->', state.waNumber);
      } else {
        console.log('[LimaCalixto] contato-whatsapp.json carregado mas sem número válido');
      }
    } catch (e) {
      console.warn('[LimaCalixto] erro carregando contato-whatsapp.json:', e.message || e);
    }
  } catch (e) {
    console.error('[LimaCalixto] loadWhatsAppConfig error', e);
  }
}

/* ===================== STATE -> URL (sharing filters) ===================== */
function writeStateToUrl() {
  try {
    const params = new URLSearchParams();
    if (state.query) params.set('q', state.query);
    if (state.category && state.category !== 'todas') params.set('category', state.category);
    if (state.minPrice != null) params.set('min', String(state.minPrice));
    if (state.maxPrice != null) params.set('max', String(state.maxPrice));
    if (state.sort && state.sort !== 'default') params.set('sort', state.sort);
    const qs = params.toString();
    const newUrl = qs ? `${location.pathname}?${qs}` : location.pathname;
    history.replaceState(null, '', newUrl);
  } catch (e) {
    console.error(e);
  }
}
function readStateFromUrlOnInit() {
  try {
    const params = new URLSearchParams(location.search);
    if (params.has('q')) state.query = params.get('q') ?? '';
    if (params.has('category')) state.category = params.get('category') ?? 'todas';
    if (params.has('min')) state.minPrice = Number(params.get('min')) || null;
    if (params.has('max')) state.maxPrice = Number(params.get('max')) || null;
    if (params.has('sort')) state.sort = params.get('sort') ?? 'default';
  } catch (e) { /* ignore */ }
}

/* ===================== FILTERS & SORT ===================== */
function applyFilters(list) {
  return list.filter(p => {
    if (!p) return false;
    const categoryOk = state.category === 'todas' || String(p.category) === String(state.category);
    const minOk = state.minPrice == null || p.price >= state.minPrice;
    const maxOk = state.maxPrice == null || p.price <= state.maxPrice;
    const q = state.query || '';
    const textOk = !q || ((p.name || '').toLowerCase().includes(q)) || ((p.description || '').toLowerCase().includes(q));
    return categoryOk && minOk && maxOk && textOk;
  });
}
function applySort(list) {
  if (state.sort === 'price-asc') return list.slice().sort((a, b) => a.price - b.price);
  if (state.sort === 'price-desc') return list.slice().sort((a, b) => b.price - a.price);
  return list;
}

/* ===================== RENDER ===================== */
function render() {
  const grid = document.getElementById('productsGrid');
  const countEl = document.getElementById('resultsCount');
  const activeEl = document.getElementById('activeFilters');
  if (!grid) {
    console.warn('[LimaCalixto] productsGrid not found');
    return;
  }

  let list = applyFilters(state.products || []);
  list = applySort(list);

  if (countEl) countEl.textContent = `${list.length} produto${list.length === 1 ? '' : 's'} encontrado${list.length === 1 ? '.' : '.'}`;

  if (activeEl) {
    const noSearch = !state.query;
    const defaultSort = !state.sort || state.sort === 'default';
    if (noSearch && defaultSort) {
      activeEl.textContent = 'Nenhuma busca ou ordenação aplicada.';
    } else {
      let sortLabel = 'Padrão';
      if (state.sort === 'price-asc') sortLabel = 'Menor preço';
      else if (state.sort === 'price-desc') sortLabel = 'Maior preço';
      const catLabel = state.category === 'todas' ? 'Todas' : state.category;
      const buscaLabel = state.query ? `"${state.query}"` : 'Ainda não foi feita nenhuma busca!';
      activeEl.textContent = `Categoria: ${catLabel} • Ordenação: ${sortLabel} • Busca: ${buscaLabel}`;
    }
  }

  grid.innerHTML = '';
  if (!list || list.length === 0) {
    grid.innerHTML = `<div class="product-card" role="listitem" style="grid-column:span 12;"><div class="product-body"><div class="product-title">Nenhum resultado</div><div class="product-desc">Tente ajustar os filtros.</div></div></div>`;
    return;
  }

  const frag = document.createDocumentFragment();
  for (const p of list) {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.setAttribute('role', 'listitem');

    const imgSrc = p.image && String(p.image).trim() !== '' ? p.image : placeholder(p.name);

    // waUrl depende de state.waNumber (localStorage dev OR contato-whatsapp.json prod)
    const waUrl = state.waNumber ? makeWhatsAppLink(state.waNumber, p) : null;

    card.innerHTML = `
      <div class="product-media">
        <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(p.name)}" loading="lazy" decoding="async" />
      </div>
      <div class="product-body">
        <div class="product-title">${escapeHtml(p.name)}</div>
        <div class="product-code">Código: <strong>${escapeHtml(p.code || '')}</strong></div>
        <div class="product-desc">${escapeHtml(p.description)}</div>
        <div class="product-meta">
          <span class="badge">${escapeHtml(p.category)}</span>
          <span class="price">${formatBRL(p.price)}</span>
        </div>
        <div class="card-actions">
          <button class="btn details" data-action="details" data-id="${escapeHtml(p.id)}" data-image="${escapeHtml(imgSrc)}" type="button">Detalhes</button>
          <button class="btn primary" data-action="quote" data-id="${escapeHtml(p.id)}" type="button">Pedir orçamento</button>
        </div>
        <div style="margin-top:8px;">
          ${waUrl ? `<a class="btn whatsapp" href="${escapeHtml(waUrl)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>` : `<button class="btn whatsapp" disabled title="Configure o número WhatsApp">WhatsApp</button>`}
        </div>
      </div>
    `;
    frag.appendChild(card);
  }
  grid.appendChild(frag);
}

/* ===================== MODAL ===================== */
function openProductModal(product, imageSrcOptional) {
  try {
    let modal = document.getElementById('lcModal');

    // cria markup se ainda não existir
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'lcModal';
      modal.innerHTML = `
        <div class="lc-modal-card" role="dialog" aria-modal="true" aria-labelledby="lcModalTitle">
          <div class="lc-modal-header">
            <h3 id="lcModalTitle" style="margin:0;font-size:1.05rem"></h3>
            <div>
              <button id="lcModalClose" class="btn ghost" aria-label="Fechar modal">Fechar</button>
            </div>
          </div>
          <div class="lc-modal-body" id="lcModalBody">
            <div id="lcModalMedia" style="display:block; width:100%;"></div>
            <p id="lcModalDesc" class="lc-modal-desc"></p>
          </div>
          <div class="lc-modal-footer">
            <button id="lcModalQuote" class="btn primary">Pedir orçamento (WhatsApp)</button>
            <button id="lcModalShare" class="btn ghost" style="display:none;">Compartilhar</button>
          </div>
        </div>
      `;
      // append overlay to body
      document.body.appendChild(modal);

      // fechar modal
      const closeBtn = document.getElementById('lcModalClose');
      if (closeBtn) closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });

      // fechar clicando fora do card (overlay)
      modal.addEventListener('click', (ev) => {
        if (ev.target === modal) modal.style.display = 'none';
      });

      // ação Pedir orçamento (botão no footer)
      const quoteBtn = document.getElementById('lcModalQuote');
      if (quoteBtn) {
        quoteBtn.addEventListener('click', () => {
          const pid = modal.getAttribute('data-product-id');
          const prod = state.products.find(px => String(px.id) === String(pid));
          if (!prod) return alert('Produto não encontrado');
          if (!state.waNumber) return alert('Configure o número do WhatsApp no cabeçalho');
          window.open(makeWhatsAppLink(state.waNumber, prod), '_blank', 'noopener');
        });
      }
    }

    // popula conteúdo do modal
    const resolvedImg = imageSrcOptional || product.image || placeholder(product.name);
    modal.setAttribute('data-product-id', product.id);

    const titleEl = document.getElementById('lcModalTitle');
    if (titleEl) titleEl.textContent = product.name || '';

    const mediaEl = document.getElementById('lcModalMedia');
    if (mediaEl) {
      // coloca a imagem dentro do container; ela respeitará o CSS (.lc-modal-body img)
      mediaEl.innerHTML = `<img src="${escapeHtml(resolvedImg)}" alt="${escapeHtml(product.name)}" />`;
    }

    const descEl = document.getElementById('lcModalDesc');
    if (descEl) descEl.textContent = product.description || '';

    // garante que o body comece no topo do conteúdo ao abrir (útil se já tinha scroll)
    const bodyEl = document.getElementById('lcModalBody');
    if (bodyEl) bodyEl.scrollTop = 0;

    // exibe o modal (flexível)
    modal.style.display = 'grid';
    modal.style.placeItems = 'center';
  } catch (e) {
    console.error('[LimaCalixto] openProductModal error', e);
  }
}

/* ===================== WhatsApp helper (ATUALIZADA) ===================== */
/**
 * Agora inclui o código do produto (product.code) na mensagem, se disponível.
 * Exemplo de mensagem resultante:
 * Olá! Tenho interesse no produto "Caneca X" (Código: CD-0001). Pode me enviar informações e orçamento?
 */
function makeWhatsAppLink(number, product) {
  const codePart = product && product.code ? ` (Código: ${product.code})` : '';
  const text = `Olá! Tenho interesse no produto "${product.name}"${codePart}. Pode me enviar informações e orçamento?`;
  return `https://wa.me/${encodeURIComponent(number)}?text=${encodeURIComponent(text)}`;
}

/* ===================== BIND UI ===================== */
function bindUI() {
  const searchInput = document.getElementById('searchInput');
  const categorySelect = document.getElementById('categorySelect');
  const minPriceInput = document.getElementById('minPrice');
  const maxPriceInput = document.getElementById('maxPrice');
  const sortSelect = document.getElementById('sortSelect');
  const applyBtn = document.getElementById('applyFiltersBtn');
  const clearBtn = document.getElementById('clearFiltersBtn');

  const externalUrl = document.getElementById('externalUrl');
  const loadUrlBtn = document.getElementById('loadUrlBtn');
  const fileInput = document.getElementById('fileInput');
  const loadFileBtn = document.getElementById('loadFileBtn');
  const resetBtn = document.getElementById('resetToDefaultBtn');
  const exportBtn = document.getElementById('exportBtn');

  const waInput = document.getElementById('waNumberInput');
  const saveWaBtn = document.getElementById('saveWaBtn');

  const themeToggle = document.getElementById('themeToggle');

  readStateFromUrlOnInit();
  if (searchInput) searchInput.value = state.query || '';
  if (categorySelect) categorySelect.value = state.category || 'todas';
  if (minPriceInput && state.minPrice != null) minPriceInput.value = state.minPrice;
  if (maxPriceInput && state.maxPrice != null) maxPriceInput.value = state.maxPrice;
  if (sortSelect) sortSelect.value = state.sort || 'default';

  if (searchInput) searchInput.addEventListener('input', (e) => {
    state.query = (e.target.value || '').trim().toLowerCase();
    writeStateToUrl(); render();
  });

  if (categorySelect) categorySelect.addEventListener('change', (e) => {
    state.category = e.target.value;
    writeStateToUrl(); render();
  });

  if (sortSelect) sortSelect.addEventListener('change', (e) => {
    state.sort = e.target.value;
    writeStateToUrl(); render();
  });

  if (applyBtn) applyBtn.addEventListener('click', () => {
    state.minPrice = (minPriceInput && minPriceInput.value !== '') ? Number(minPriceInput.value) : null;
    state.maxPrice = (maxPriceInput && maxPriceInput.value !== '') ? Number(maxPriceInput.value) : null;
    writeStateToUrl(); render();
  });

  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (categorySelect) categorySelect.value = 'todas';
    if (minPriceInput) minPriceInput.value = '';
    if (maxPriceInput) maxPriceInput.value = '';
    if (sortSelect) sortSelect.value = 'default';
    state.query = ''; state.category = 'todas'; state.minPrice = null; state.maxPrice = null; state.sort = 'default';
    writeStateToUrl(); render();
  });

  if (loadUrlBtn && externalUrl) loadUrlBtn.addEventListener('click', () => {
    const url = (externalUrl.value || '').trim();
    if (!url) return alert('Informe uma URL válida para JSON');
    loadFromUrl(url);
  });

  if (loadFileBtn && fileInput) loadFileBtn.addEventListener('click', () => {
    if (!fileInput.files || fileInput.files.length === 0) return alert('Selecione um arquivo JSON ou CSV');
    loadFromFile(fileInput.files[0]);
  });

  if (resetBtn) resetBtn.addEventListener('click', async () => {
    const ok = await loadProdutosJsonAuto();
    if (ok) { alert('Produtos recarregados de produtos.json'); render(); }
    else { alert('produtos.json não disponível — usando produtos internos'); initialLoadProducts(); }
  });

  if (exportBtn) exportBtn.addEventListener('click', () => {
    exportProductsToFile(state.products);
  });

  if (saveWaBtn && waInput) saveWaBtn.addEventListener('click', () => {
    const cleaned = (waInput.value || '').replace(/\D/g, '');
    if (cleaned.length < 8) return alert('Número WhatsApp inválido');
    state.waNumber = cleaned;
    try { localStorage.setItem(LS_WA_KEY, cleaned); } catch (e) { /* ignore */ }
    const footerPhone = document.getElementById('footerPhone');
    if (footerPhone) footerPhone.href = `https://wa.me/${cleaned}`;
    alert('Número salvo (developer override)');
  });

  if (themeToggle) {
    themeToggle.addEventListener('click', (ev) => {
      ev.stopPropagation && ev.stopPropagation();
      const cur = document.body.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      applyTheme(cur === 'light' ? 'dark' : 'light');
    });
  }

  if (waInput && state.waNumber) waInput.value = state.waNumber;

  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest && ev.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    const product = state.products.find(p => String(p.id) === String(id));
    if (action === 'details') {
      if (!product) { alert('Produto não encontrado'); return; }
      let imageFromBtn = btn.getAttribute('data-image');
      if (!imageFromBtn) {
        const cardEl = btn.closest && btn.closest('.product-card');
        const imgEl = cardEl ? cardEl.querySelector('img') : null;
        imageFromBtn = imgEl ? imgEl.src : null;
      }
      openProductModal(product, imageFromBtn);
    } else if (action === 'quote') {
      if (!product) return alert('Produto não encontrado');
      if (!state.waNumber) return alert('Configure o número do WhatsApp no cabeçalho');
      window.open(makeWhatsAppLink(state.waNumber, product), '_blank', 'noopener');
    }
  });
}

/* ===================== UTIL ===================== */
function updateYear() {
  const el = document.getElementById('yearNow');
  if (el) el.textContent = new Date().getFullYear();
}

/* ===================== ADMIN CONTROLS VISIBILITY (dev only) ===================== */
function toggleAdminControlsVisibility() {
  try {
    const adminContainer = document.querySelector('.external-load');
    const waConfig = document.querySelector('.whatsapp-config');

    if (!adminContainer && !waConfig) return;

    const host = location.hostname || '';
    const protocol = location.protocol || '';

    const forced = localStorage.getItem('lc_show_admin') === '1';
    const isLocalhost = host === 'localhost' || host === '127.0.0.1' || protocol === 'file:';
    const shouldShow = isLocalhost || forced;

    if (adminContainer) {
      if (shouldShow) {
        adminContainer.classList.add('admin-visible');
        adminContainer.removeAttribute('aria-hidden');
        console.log('[LimaCalixto] admin controls: VISIBLE (dev mode)');
      } else {
        adminContainer.classList.remove('admin-visible');
        adminContainer.setAttribute('aria-hidden', 'true');
        console.log('[LimaCalixto] admin controls: HIDDEN (prod mode)');
      }
    }

    if (waConfig) {
      if (shouldShow) {
        waConfig.classList.add('admin-visible');
        waConfig.removeAttribute('aria-hidden');
        console.log('[LimaCalixto] whatsapp-config: VISIBLE (dev mode)');
      } else {
        waConfig.classList.remove('admin-visible');
        waConfig.setAttribute('aria-hidden', 'true');
        console.log('[LimaCalixto] whatsapp-config: HIDDEN (prod mode)');
      }
    }
  } catch (e) {
    console.error('[LimaCalixto] toggleAdminControlsVisibility error', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(toggleAdminControlsVisibility, 50);
});

/* ===================== INIT ===================== */
document.addEventListener('DOMContentLoaded', async () => {
  try { applyTheme(readTheme()); } catch (e) { console.error(e); }
  try { await initialLoadProducts(); } catch (e) { console.error(e); }
  try { await loadWhatsAppConfig(); } catch (e) { console.error('[LimaCalixto] loadWhatsAppConfig error', e); }
  try { bindUI(); } catch (e) { console.error(e); }
  try { updateYear(); } catch (e) { /* ignore */ }
  try { render(); } catch (e) { console.error(e); }
});

/* ===================== Expose debug helpers ===================== */
window._lc = {
  state,
  render,
  loadFromUrl,
  loadFromFile,
  saveProductsToLocalStorage,
  readProductsFromLocalStorage,
  applyTheme,
  loadWhatsAppConfig,
  assignProductCodes
};