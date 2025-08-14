// Mostra o loading antes de iniciar o fetch
document.getElementById('loading').classList.remove('hidden');

// Carrega os produtos e renderiza os cards por categoria
fetch('data/produtos.json')
  .then(res => res.json())
  .then(produtos => {
    window.todosProdutos = produtos; // Disponível globalmente
    renderizarCategorias(produtos);
    popularFiltroCategorias(produtos);

      inicializarFiltros(produtos);

    // Esconde o loading após o carregamento
    document.getElementById('loading').classList.add('hidden');
  })
  .catch(err => {
    console.error('Erro ao carregar produtos:', err);
    document.getElementById('loading').textContent = 'Erro ao carregar produtos.';
  });

// Renderiza os cards em suas respectivas seções
function renderizarCategorias(produtos) {
  const seções = {
    'Sublimação': document.getElementById('sublimacao-grid'),
    'Personalizados': document.getElementById('personalizados-grid'),
    'Convites Digitais': document.getElementById('convites-digitais-grid')
  };

  Object.values(seções).forEach(secao => secao.innerHTML = '');

  produtos.forEach((produto, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${produto.imagem}" alt="${produto.nome}">
      <h3>${produto.nome}</h3>
      <p>${produto.descricao}</p>
      <p class="preco">R$ ${produto.preco.toFixed(2)}</p>
      <a class="whatsapp-btn" href="${gerarLinkWhatsApp(produto)}" target="_blank">
        <img src="icons/whatsapp.svg" alt="WhatsApp"> Falar no WhatsApp
      </a>
    `;
    card.addEventListener('click', () => abrirLightbox(produto));
    seções[produto.categoria]?.appendChild(card);
  });
}