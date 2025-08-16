// 🔐 Cria política Trusted Types com DOMPurify para evitar XSS
let trustedHTMLPolicy;

if (window.trustedTypes && trustedTypes.createPolicy) {
  trustedHTMLPolicy = trustedTypes.createPolicy('default', {
    createHTML: (input) => DOMPurify.sanitize(input)
  });
} else {
  // 🧯 Fallback caso Trusted Types não seja suportado
  trustedHTMLPolicy = {
    createHTML: (input) => DOMPurify.sanitize(input)
  };
}

// 🕒 Exibe o loading antes de iniciar o carregamento de produtos
document.getElementById('loading').classList.remove('hidden');

// 📦 Carrega os produtos do JSON e executa funcionalidades principais
fetch('data/produtos.json')
  .then(res => res.json())
  .then(produtos => {
    window.todosProdutos = produtos; // Permite acesso global para filtros

    renderizarCategorias(produtos);
    popularFiltroCategorias(produtos);
    inicializarFiltros(produtos);

    // ✅ Oculta o loading após o carregamento
    document.getElementById('loading').classList.add('hidden');
  })
  .catch(err => {
    console.error('Erro ao carregar produtos:', err);
    document.getElementById('loading').textContent = 'Erro ao carregar produtos.';
  });

/**
 * 🧱 Renderiza os produtos organizados por categoria
 * @param {Array} produtos - lista de objetos do catálogo
 */
function renderizarCategorias(produtos) {
  const seções = {
    'Sublimação': document.getElementById('sublimacao-grid'),
    'Personalizados': document.getElementById('personalizados-grid'),
    'Convites Digitais': document.getElementById('convites-digitais-grid')
  };

  // 🧹 Limpa conteúdo anterior das seções
  Object.values(seções).forEach(secao => secao.innerHTML = '');

  produtos.forEach((produto, index) => {
    const card = document.createElement('div');
    card.className = 'card';

    // 🔧 Configurações dinâmicas para rastreamento e idioma
    const numeroVendedor = '5532991657472';
    const idioma = 'pt';
    const tags = ['cat-' + produto.categoria.toLowerCase().replace(/\s/g, '-')];

    // 🔗 Gera link com parâmetros personalizados
    const linkWhatsApp = gerarLinkWhatsApp(produto, numeroVendedor, idioma, tags);

    // ✨ Conteúdo do card com Trusted Types e otimização de imagem
    const htmlContent = `
      <img src="${produto.imagem}" alt="${produto.nome}" width="300" height="300" loading="lazy" fetchpriority="${index === 0 ? 'high' : 'auto'}">
      <h3>${produto.nome}</h3>
      <p>${produto.descricao}</p>
      <p class="preco">R$ ${produto.preco.toFixed(2)}</p>
      <a class="whatsapp-btn" href="${linkWhatsApp}" target="_blank">
        <img src="icons/whatsapp.svg" alt="WhatsApp"> Falar no WhatsApp
      </a>
    `;

    // 🛡️ Sanitiza e injeta o HTML no card
    card.innerHTML = trustedHTMLPolicy.createHTML(htmlContent);

    // 🖱️ Evento de clique no card abre o lightbox com detalhes
    card.addEventListener('click', () => abrirLightbox(produto));

    // 🛑 Impede que o botão de WhatsApp propague o clique para o card
    const whatsappBtn = card.querySelector('.whatsapp-btn');
    whatsappBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Impede o clique no card
      e.preventDefault();  // Impede o redirecionamento interno
      window.open(linkWhatsApp, '_blank'); // Abre em nova aba
    });

    // 📥 Adiciona o card à seção correspondente
    seções[produto.categoria]?.appendChild(card);
  });
}

/**
 * 🧮 Gera link do WhatsApp com parâmetros personalizados
 * @param {Object} produto - produto atual
 * @param {string} numeroVendedor - número do vendedor
 * @param {string} idioma - idioma da mensagem
 * @param {Array} tags - tags para rastreamento
 * @returns {string} - URL do WhatsApp
 */
function gerarLinkWhatsApp(produto, numeroVendedor, idioma = 'pt', tags = []) {
  const mensagemBase = `Olá Marli! Gostaria de saber mais sobre o produto "${produto.nome}" - ${produto.descricao}`;
  const mensagemComTags = tags.length
    ? `${mensagemBase}\n\nTags: ${tags.join(', ')}`
    : mensagemBase;

  return `https://wa.me/${numeroVendedor}?text=${encodeURIComponent(mensagemComTags)}&lang=${idioma}`;
}

/**
 * 🧭 Popula o filtro de categorias dinamicamente
 * @param {Array} produtos - lista de produtos
 */
function popularFiltroCategorias(produtos) {
  const categorias = [...new Set(produtos.map(p => p.categoria))];
  const filtro = document.getElementById('filtro-categorias');

  filtro.innerHTML = '<option value="todos">Todos</option>';
  categorias.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    filtro.appendChild(option);
  });
}

/**
 * 🧪 Inicializa o filtro de categorias
 * @param {Array} produtos - lista de produtos
 */
function inicializarFiltros(produtos) {
  const filtro = document.getElementById('filtro-categorias');
  filtro.addEventListener('change', () => {
    const categoriaSelecionada = filtro.value;
    const filtrados = categoriaSelecionada === 'todos'
      ? produtos
      : produtos.filter(p => p.categoria === categoriaSelecionada);
    renderizarCategorias(filtrados);
  });
}