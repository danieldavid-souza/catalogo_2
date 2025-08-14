// Elementos do lightbox
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxDesc = document.getElementById('lightbox-desc');
const closeBtn = document.querySelector('.close-btn');
const contador = document.getElementById('contadorLightbox');
const btnAnterior = document.getElementById('btnAnterior');
const btnProximo = document.getElementById('btnProximo');

let produtoAtualIndex = 0;
let produtosLightbox = [];

// Abre o lightbox com o produto clicado
function abrirLightbox(produto) {
  produtosLightbox = window.todosProdutos;
  produtoAtualIndex = produtosLightbox.findIndex(p => p.nome === produto.nome);
  atualizarLightbox(produtosLightbox[produtoAtualIndex]);
}

// Atualiza imagem, descrição e contador
function atualizarLightbox(produto) {
  lightboxImg.src = produto.imagem;
  lightboxDesc.textContent = produto.descricao;
  contador.textContent = `Imagem ${produtoAtualIndex + 1} de ${produtosLightbox.length}`;
  lightbox.classList.remove('hidden');
}

// Fecha o lightbox
function fecharLightbox() {
  lightbox.classList.add('hidden');
  produtoAtualIndex = null;
}

// Navegação por teclado
document.addEventListener('keydown', (e) => {
  if (lightbox.classList.contains('hidden')) return;

  if (e.key === 'Escape') {
    fecharLightbox();
  } else if (e.key === 'ArrowRight') {
    produtoAtualIndex = (produtoAtualIndex + 1) % produtosLightbox.length;
    atualizarLightbox(produtosLightbox[produtoAtualIndex]);
  } else if (e.key === 'ArrowLeft') {
    produtoAtualIndex = (produtoAtualIndex - 1 + produtosLightbox.length) % produtosLightbox.length;
    atualizarLightbox(produtosLightbox[produtoAtualIndex]);
  }
});

// Botões visuais
btnAnterior.addEventListener('click', () => {
  produtoAtualIndex = (produtoAtualIndex - 1 + produtosLightbox.length) % produtosLightbox.length;
  atualizarLightbox(produtosLightbox[produtoAtualIndex]);
});

btnProximo.addEventListener('click', () => {
  produtoAtualIndex = (produtoAtualIndex + 1) % produtosLightbox.length;
  atualizarLightbox(produtosLightbox[produtoAtualIndex]);
});

// Fechar ao clicar fora da imagem
closeBtn.addEventListener('click', fecharLightbox);
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) fecharLightbox();
});

// Swipe para mobile
let touchStartX = 0;
let touchEndX = 0;

lightbox.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

lightbox.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipeGesture();
});

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

lightboxImg.alt = produto.nome || 'Imagem do produto';