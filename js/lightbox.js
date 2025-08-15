// 🎯 Elementos principais do lightbox
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxDesc = document.getElementById('lightbox-desc');
const closeBtn = document.querySelector('.close-btn');
const contador = document.getElementById('contadorLightbox');
const btnAnterior = document.getElementById('btnAnterior');
const btnProximo = document.getElementById('btnProximo');

// 🔁 Estado atual do lightbox
let produtoAtualIndex = 0;
let produtosLightbox = [];

/**
 * 🔓 Abre o lightbox com o produto clicado
 * @param {Object} produto - Produto selecionado
 */
function abrirLightbox(produto) {
  produtosLightbox = window.todosProdutos;
  produtoAtualIndex = produtosLightbox.findIndex(p => p.nome === produto.nome);
  atualizarLightbox(produtosLightbox[produtoAtualIndex]);
}

/**
 * 🔄 Atualiza imagem, descrição e contador do lightbox
 * @param {Object} produto - Produto a ser exibido
 */
function atualizarLightbox(produto) {
  lightboxImg.src = produto.imagem;
  lightboxImg.alt = produto.nome || 'Imagem do produto';
  lightboxDesc.textContent = produto.descricao;
  contador.textContent = `Imagem ${produtoAtualIndex + 1} de ${produtosLightbox.length}`;
  lightbox.classList.remove('hidden');
}

/**
 * ❌ Fecha o lightbox
 */
function fecharLightbox() {
  lightbox.classList.add('hidden');
  produtoAtualIndex = null;
}

// ⌨️ Navegação por teclado
document.addEventListener('keydown', (e) => {
  if (lightbox.classList.contains('hidden')) return;

  switch (e.key) {
    case 'Escape':
      fecharLightbox();
      break;
    case 'ArrowRight':
      produtoAtualIndex = (produtoAtualIndex + 1) % produtosLightbox.length;
      atualizarLightbox(produtosLightbox[produtoAtualIndex]);
      break;
    case 'ArrowLeft':
      produtoAtualIndex = (produtoAtualIndex - 1 + produtosLightbox.length) % produtosLightbox.length;
      atualizarLightbox(produtosLightbox[produtoAtualIndex]);
      break;
  }
});

// 🖱️ Botões visuais de navegação
btnAnterior.addEventListener('click', () => {
  produtoAtualIndex = (produtoAtualIndex - 1 + produtosLightbox.length) % produtosLightbox.length;
  atualizarLightbox(produtosLightbox[produtoAtualIndex]);
});

btnProximo.addEventListener('click', () => {
  produtoAtualIndex = (produtoAtualIndex + 1) % produtosLightbox.length;
  atualizarLightbox(produtosLightbox[produtoAtualIndex]);
});

// 🖱️ Fecha ao clicar fora da imagem
closeBtn.addEventListener('click', fecharLightbox);
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) fecharLightbox();
});

// 📱 Swipe para mobile
let touchStartX = 0;
let touchEndX = 0;

lightbox.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

lightbox.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipeGesture();
});

/**
 * 📲 Detecta gesto de swipe e navega entre produtos
 */
function handleSwipeGesture() {
  if (lightbox.classList.contains('hidden')) return;

  const swipeThreshold = 50;

  if (touchEndX < touchStartX - swipeThreshold) {
    produtoAtualIndex = (produtoAtualIndex + 1) % produtosLightbox.length;
    atualizarLightbox(produtosLightbox[produtoAtualIndex]);
  } else if (touchEndX > touchStartX + swipeThreshold) {
    produtoAtualIndex = (produtoAtualIndex - 1 + produtosLightbox.length) % produtosLightbox.length;
    atualizarLightbox(produtosLightbox[produtoAtualIndex]);
  }
}