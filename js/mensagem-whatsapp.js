function gerarLinkWhatsApp(produto, numeroVendedor, idioma = 'pt', tags = []) {
  const mensagemBase = `Olá Marli! Gostaria de saber mais sobre o produto "${produto.nome}" - ${produto.descricao}`;
  const mensagemComTags = tags.length
    ? `${mensagemBase}\n\nTags: ${tags.join(', ')}`
    : mensagemBase;

  const url = `https://wa.me/${numeroVendedor}?text=${encodeURIComponent(mensagemComTags)}&lang=${idioma}`;
  return url;
}

// 📞 Mapeamento de números por categoria
const vendedoresPorCategoria = {
  'Sublimação': '5532991657472',
  'Personalizados': '5532991657472',
  'Convites Digitais': '5532991657472'
};

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

    // 📞 Número do vendedor por categoria
    const numeroVendedor = vendedoresPorCategoria[produto.categoria] || '5532991657472';

    // 🌍 Idioma da mensagem
    const idioma = 'pt';

    // 🏷️ Hashtags para rastreamento
    const tags = [
      'cat-' + produto.categoria.toLowerCase().replace(/\s/g, '-'),
      'produto-' + produto.nome.toLowerCase().replace(/\s/g, '-')
    ];

    // 🔗 Link personalizado
    const linkWhatsApp = gerarLinkWhatsApp(produto, numeroVendedor, idioma, tags);

    // ✨ Conteúdo do card com Trusted Types
    const htmlContent = `
      <img src="${produto.imagem}" alt="${produto.nome}" loading="lazy">
      <h3>${produto.nome}</h3>
      <p>${produto.descricao}</p>
      <p class="preco">R$ ${produto.preco.toFixed(2)}</p>
      <a class="whatsapp-btn" href="${linkWhatsApp}" target="_blank">
        <img src="icons/whatsapp.svg" alt="WhatsApp"> Falar no WhatsApp
      </a>
    `;

    card.innerHTML = trustedHTMLPolicy.createHTML(htmlContent);
    card.addEventListener('click', () => abrirLightbox(produto));
    seções[produto.categoria]?.appendChild(card);
  });
}