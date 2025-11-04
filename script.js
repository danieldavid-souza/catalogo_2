/**
 * script.js — Lima Calixto Catalogo (versão completa e robusta)
 *
 * Funcionalidades:
 * - Tenta carregar produtos.json (caminho relativo) ao iniciar
 * - Fallback: localStorage (se houve edição) -> embedded fallback
 * - Normaliza campos (pt/en): nome/name, descricao/description, categoria/category, preco/price, imagem/image
 * - Render de cards (imagem com placeholder se necessário)
 * - Botões: Detalhes (modal com imagem), Pedir orçamento (delegation), WhatsApp (anchor <a> com href)
 * - Filtros: categoria, min/max price, busca por texto, ordenação
 * - Salva filtros na URL para compartilhamento
 * - Upload JSON/CSV e exportar JSON (download)
 * - Persistência temporária de produtos no localStorage para edição em navegador
 * - Tema dark/light com persistência (localStorage)
 *
 * Observações:
 * - assume que index.html possui IDs e classes:
 *   #productsGrid, #resultsCount, #activeFilters,
 *   #searchInput, #categorySelect, #minPrice, #maxPrice, #sortSelect,
 *   #applyFiltersBtn, #clearFiltersBtn,
 *   #externalUrl, #loadUrlBtn, #fileInput, #loadFileBtn, #resetToDefaultBtn, #exportBtn,
 *   #waNumberInput, #saveWaBtn, #footerPhone, #themeToggle
 *
 * - Se algum ID não existir, o script não falhará; muitas operações serão ignoradas graciosamente.
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

/* ===================== STATE ===================== */
const state = {
  products: [],      // array normalized
  query: '',
  category: 'todas',
  minPrice: null,
  maxPrice: null,
  sort: 'default',   // use 'default' internally to match the <select> values
  waNumber: localStorage.getItem(LS_WA_KEY) || ''
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
    return normalizeProductsArray(arr);
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
    saveProductsToLocalStorage(state.products);
    render();
    alert('Produtos carregados via URL');
  } catch (e) {
    console.error(e);
    alert('Erro ao carregar URL: ' + (e.message || e));
  }
}
function parseCSVToProducts(txt) {
  // very small CSV parser (expects header row)
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
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        state.products = parseCSVToProducts(txt);
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
    const res = await fetch('data/produtos.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('produtos.json não é um array');
    state.products = normalizeProductsArray(data);
    // save a copy to localStorage for editing convenience
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
  // embedded fallback
  const embedded = [
    { id: 1, name: 'Caneca de Porcelana 325ml', category: 'Sublimação', price: 35.9, description: 'Personalize com fotos, nomes ou frases.', image: '' },
    { id: 2, name: 'Camiseta Poliéster', category: 'Sublimação', price: 49.9, description: 'Estampa de alta definição.', image: '' },
    { id: 3, name: 'Chaveiro Acrílico', category: 'Personalizados', price: 15.0, description: 'Chaveiros exclusivos.', image: '' },
    { id: 4, name: 'Convite Digital Casamento', category: 'Convites Digitais', price: 49.9, description: 'Layout elegante.', image: '' }
  ];
  state.products = normalizeProductsArray(embedded);
  render();
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

  // apply filters & sort
  let list = applyFilters(state.products || []);
  list = applySort(list);

  if (countEl) countEl.textContent = `${list.length} produto${list.length === 1 ? '' : 's'} encontrado${list.length === 1 ? '.' : '.'}`;

  // --- TRANSLATED / HUMANIZED ACTIVE FILTERS MESSAGE ---
  if (activeEl) {
    const noSearch = !state.query;
    const defaultSort = !state.sort || state.sort === 'default';
    if (noSearch && defaultSort) {
      // when nothing applied
      activeEl.textContent = 'Nenhuma busca ou ordenação aplicada.';
    } else {
      // translate sort values to human labels
      let sortLabel = 'Padrão';
      if (state.sort === 'price-asc') sortLabel = 'Menor preço';
      else if (state.sort === 'price-desc') sortLabel = 'Maior preço';

      const catLabel = state.category === 'todas' ? 'Todas' : state.category;
      const buscaLabel = state.query ? `"${state.query}"` : '—';

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

    // resolve image source used in the card (prefer explicit non-empty, otherwise placeholder)
    const imgSrc = p.image && String(p.image).trim() !== '' ? p.image : placeholder(p.name);

    // create innerHTML (details button includes data-image with the effective imgSrc)
    const waUrl = state.waNumber ? makeWhatsAppLink(state.waNumber, p) : null;

    card.innerHTML = `
      <div class="product-media">
        <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(p.name)}" loading="lazy" decoding="async" />
      </div>
      <div class="product-body">
        <div class="product-title">${escapeHtml(p.name)}</div>
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
/**
 * openProductModal(product, imageSrcOptional)
 * - imageSrcOptional: prefer this (from card data-image or <img>), fallback to product.image, fallback to placeholder
 */
function openProductModal(product, imageSrcOptional) {
  try {
    let modal = document.getElementById('lcModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'lcModal';
      modal.innerHTML = `<div class="card" role="dialog" aria-modal="true" aria-labelledby="lcModalTitle">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h3 id="lcModalTitle"></h3>
          <button id="lcModalClose" class="btn ghost" aria-label="Fechar modal">Fechar</button>
        </div>
        <div id="lcModalMedia" style="height:360px;margin-top:12px;display:flex;align-items:center;justify-content:center;overflow:hidden"></div>
        <p id="lcModalDesc" style="color:var(--muted);margin-top:12px"></p>
        <div style="margin-top:12px">
          <button id="lcModalQuote" class="btn primary">Pedir orçamento (WhatsApp)</button>
        </div>
      </div>`;
      document.body.appendChild(modal);

      const closeBtn = document.getElementById('lcModalClose');
      if (closeBtn) closeBtn.addEventListener('click', () => modal.remove());

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

    // resolve image
    const resolvedImg = imageSrcOptional || product.image || placeholder(product.name);
    modal.setAttribute('data-product-id', product.id);

    const titleEl = document.getElementById('lcModalTitle');
    if (titleEl) titleEl.textContent = product.name;

    const mediaEl = document.getElementById('lcModalMedia');
    if (mediaEl) {
      mediaEl.innerHTML = `<img src="${escapeHtml(resolvedImg)}" alt="${escapeHtml(product.name)}" style="width:100%;height:100%;object-fit:contain" />`;
    }
    const descEl = document.getElementById('lcModalDesc');
    if (descEl) descEl.textContent = product.description || '';

    modal.style.display = 'grid';
    modal.style.position = 'fixed';
    modal.style.inset = 0;
    modal.style.placeItems = 'center';
    modal.style.background = 'rgba(0,0,0,0.6)';
    modal.style.zIndex = '99999';
  } catch (e) {
    console.error('[LimaCalixto] openProductModal error', e);
  }
}

/* ===================== WhatsApp helper ===================== */
function makeWhatsAppLink(number, product) {
  const text = `Olá! Tenho interesse no produto *${product.name}* (ID:${product.id}). Pode me enviar informações e orçamento?`;
  return `https://wa.me/${encodeURIComponent(number)}?text=${encodeURIComponent(text)}`;
}

/* ===================== BIND UI ===================== */
function bindUI() {
  // find elements safely
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

  // initialize UI from state / URL
  readStateFromUrlOnInit();
  if (searchInput) searchInput.value = state.query || '';
  if (categorySelect) categorySelect.value = state.category || 'todas';
  if (minPriceInput && state.minPrice != null) minPriceInput.value = state.minPrice;
  if (maxPriceInput && state.maxPrice != null) maxPriceInput.value = state.maxPrice;
  if (sortSelect) sortSelect.value = state.sort || 'default';

  // search
  if (searchInput) searchInput.addEventListener('input', (e) => {
    state.query = (e.target.value || '').trim().toLowerCase();
    writeStateToUrl(); render();
  });

  // category
  if (categorySelect) categorySelect.addEventListener('change', (e) => {
    state.category = e.target.value;
    writeStateToUrl(); render();
  });

  // sorting
  if (sortSelect) sortSelect.addEventListener('change', (e) => {
    state.sort = e.target.value;
    writeStateToUrl(); render();
  });

  // apply filters (min/max)
  if (applyBtn) applyBtn.addEventListener('click', () => {
    state.minPrice = (minPriceInput && minPriceInput.value !== '') ? Number(minPriceInput.value) : null;
    state.maxPrice = (maxPriceInput && maxPriceInput.value !== '') ? Number(maxPriceInput.value) : null;
    writeStateToUrl(); render();
  });

  // clear filters
  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (categorySelect) categorySelect.value = 'todas';
    if (minPriceInput) minPriceInput.value = '';
    if (maxPriceInput) maxPriceInput.value = '';
    if (sortSelect) sortSelect.value = 'default';
    state.query = ''; state.category = 'todas'; state.minPrice = null; state.maxPrice = null; state.sort = 'default';
    writeStateToUrl(); render();
  });

  // load URL JSON
  if (loadUrlBtn && externalUrl) loadUrlBtn.addEventListener('click', () => {
    const url = (externalUrl.value || '').trim();
    if (!url) return alert('Informe uma URL válida para JSON');
    loadFromUrl(url);
  });

  // load file
  if (loadFileBtn && fileInput) loadFileBtn.addEventListener('click', () => {
    if (!fileInput.files || fileInput.files.length === 0) return alert('Selecione um arquivo JSON ou CSV');
    loadFromFile(fileInput.files[0]);
  });

  // reset to produtos.json if available
  if (resetBtn) resetBtn.addEventListener('click', async () => {
    const ok = await loadProdutosJsonAuto();
    if (ok) { alert('Produtos recarregados de produtos.json'); render(); }
    else { alert('produtos.json não disponível — usando produtos internos'); initialLoadProducts(); }
  });

  // export
  if (exportBtn) exportBtn.addEventListener('click', () => {
    exportProductsToFile(state.products);
  });

  // save whatsapp number
  if (saveWaBtn && waInput) saveWaBtn.addEventListener('click', () => {
    const cleaned = (waInput.value || '').replace(/\D/g, '');
    if (cleaned.length < 8) return alert('Número WhatsApp inválido');
    state.waNumber = cleaned;
    try { localStorage.setItem(LS_WA_KEY, cleaned); } catch (e) { /* ignore */ }
    const footerPhone = document.getElementById('footerPhone');
    if (footerPhone) footerPhone.href = `https://wa.me/${cleaned}`;
    alert('Número salvo');
  });

  // theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('click', (ev) => {
      ev.stopPropagation && ev.stopPropagation();
      const cur = document.body.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      applyTheme(cur === 'light' ? 'dark' : 'light');
    });
  }

  // show saved waNumber in input
  if (waInput && state.waNumber) waInput.value = state.waNumber;

  // delegation for product-level actions (details, quote). WhatsApp is an <a> and opens normally.
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest && ev.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    const product = state.products.find(p => String(p.id) === String(id));
    if (action === 'details') {
      if (!product) { alert('Produto não encontrado'); return; }
      // try data-image first
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
/**
 * Mostra/oculta a área de upload/carregar/exportar JSON quando:
 * - hostname for "localhost" ou "127.0.0.1"
 * - protocolo for "file:" (abrindo localmente)
 * - ou quando localStorage.lc_show_admin === "1" (forçar)
 *
 * Busca o container .external-load (mesmo markup do index.html) e ajusta display + aria-hidden.
 * Também controla .whatsapp-config (visível apenas em dev).
 */
function toggleAdminControlsVisibility() {
  try {
    const adminContainer = document.querySelector('.external-load');
    const waConfig = document.querySelector('.whatsapp-config'); // área do WhatsApp no cabeçalho

    // se não existir nenhum dos dois, nada a fazer
    if (!adminContainer && !waConfig) return;

    const host = location.hostname || '';
    const protocol = location.protocol || '';

    // condição de "dev": localhost, 127.0.0.1, file:, ou forçar via localStorage
    const forced = localStorage.getItem('lc_show_admin') === '1';
    const isLocalhost = host === 'localhost' || host === '127.0.0.1' || protocol === 'file:';
    const shouldShow = isLocalhost || forced;

    // ADMIN: upload / export controls
    if (adminContainer) {
      if (shouldShow) {
        adminContainer.style.display = ''; // deixa o CSS original cuidar do layout
        adminContainer.removeAttribute('aria-hidden');
        adminContainer.classList.add('admin-visible');
        console.log('[LimaCalixto] admin controls: VISIBLE (dev mode)');
      } else {
        adminContainer.style.display = 'none';
        adminContainer.setAttribute('aria-hidden', 'true');
        adminContainer.classList.remove('admin-visible');
        console.log('[LimaCalixto] admin controls: HIDDEN (prod mode)');
      }
    }

    // WHATSAPP CONFIG: mostrar apenas em dev (mesma regra)
    if (waConfig) {
      if (shouldShow) {
        waConfig.style.display = '';
        waConfig.removeAttribute('aria-hidden');
        waConfig.classList.add('admin-visible');
        console.log('[LimaCalixto] whatsapp-config: VISIBLE (dev mode)');
      } else {
        waConfig.style.display = 'none';
        waConfig.setAttribute('aria-hidden', 'true');
        waConfig.classList.remove('admin-visible');
        console.log('[LimaCalixto] whatsapp-config: HIDDEN (prod mode)');
      }
    }
  } catch (e) {
    console.error('[LimaCalixto] toggleAdminControlsVisibility error', e);
  }
}

// chama a função ao iniciar (depois de bindUI)
document.addEventListener('DOMContentLoaded', () => {
  // chama assíncrono para garantir que bindUI() já executou (se bindUI for chamado em DOMContentLoaded)
  setTimeout(toggleAdminControlsVisibility, 50);
});

/* Helper: comando para forçar mostrar admin em qualquer ambiente (útil para testes)
   Execução no console do navegador:
     localStorage.setItem('lc_show_admin', '1'); location.reload();
   Para desfazer:
     localStorage.removeItem('lc_show_admin'); location.reload();
*/

/* ===================== INIT ===================== */
document.addEventListener('DOMContentLoaded', async () => {
  try { applyTheme(readTheme()); } catch (e) { console.error(e); }
  try { await initialLoadProducts(); } catch (e) { console.error(e); }
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
  applyTheme
};