const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxDesc = document.getElementById('lightbox-desc');
const closeBtn = document.querySelector('.close-btn');

let produtoAtualIndex = null;
let produtosLightbox = [];

// Abre o lightbox com base no índice do produto
function abrirLightbox(produto) {
  // Armazena a lista completa e o índice atual
  produtosLightbox = window.todosProdutos;
  produtoAtualIndex = produtosLightbox.findIndex(p => p.nome === produto.nome);

  atualizarLightbox(produtosLightbox[produtoAtualIndex]);
}

// Atualiza o conteúdo do lightbox
function atualizarLightbox(produto) {
  lightboxImg.src = produto.imagem;
  lightboxDesc.textContent = produto.descricao;
  lightbox.classList.remove('hidden');
}

// Fecha o lightbox
function fecharLightbox() {
  lightbox.classList.add('hidden');
  produtoAtualIndex = null;
}

// Eventos de clique
closeBtn.addEventListener('click', fecharLightbox);
lightbox.addEventListener('click', e => {
  if (e.target === lightbox) fecharLightbox();
});

// Eventos de teclado
document.addEventListener('keydown', e => {
  if (lightbox.classList.contains('hidden')) return;

  if (e.key === 'Escape') {
    fecharLightbox();
  } else if (e.key === 'ArrowRight') {
    // Avança para o próximo produto
    produtoAtualIndex = (produtoAtualIndex + 1) % produtosLightbox.length;
    atualizarLightbox(produtosLightbox[produtoAtualIndex]);
  } else if (e.key === 'ArrowLeft') {
    // Volta para o produto anterior
    produtoAtualIndex = (produtoAtualIndex - 1 + produtosLightbox.length) % produtosLightbox.length;
    atualizarLightbox(produtosLightbox[produtoAtualIndex]);
  }
});