const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxDesc = document.getElementById('lightbox-desc');
const closeBtn = document.querySelector('.close-btn');

let produtoAtualIndex = 0;
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

/*=======================================================================================================*/
// Detecta gestos de swipe em dispositivos móveis
//const lightbox = document.getElementById('lightbox');
//const lightboxImagem = document.getElementById('lightboxImagem');
//const contadorLightbox = document.getElementById('contadorLightbox');
//const produtosLightbox = [/* array com URLs das imagens */];
//let produtoAtualIndex = 0;

// Atualiza imagem e contador
function atualizarLightbox(imagemUrl) {
  lightboxImagem.src = imagemUrl;
  contadorLightbox.textContent = `Imagem ${produtoAtualIndex + 1} de ${produtosLightbox.length}`;
}

// Abrir lightbox
function abrirLightbox(index) {
  produtoAtualIndex = index;
  atualizarLightbox(produtosLightbox[index]);
  lightbox.classList.remove('hidden');
}

// Fechar com ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    lightbox.classList.add('hidden');
  }
});

// Navegação por teclado
document.addEventListener('keydown', (e) => {
  if (lightbox.classList.contains('hidden')) return;

  if (e.key === 'ArrowRight') {
    produtoAtualIndex = (produtoAtualIndex + 1) % produtosLightbox.length;
    atualizarLightbox(produtosLightbox[produtoAtualIndex]);
  } else if (e.key === 'ArrowLeft') {
    produtoAtualIndex = (produtoAtualIndex - 1 + produtosLightbox.length) % produtosLightbox.length;
    atualizarLightbox(produtosLightbox[produtoAtualIndex]);
  }
});

// Botões visuais
document.getElementById('btnAnterior').addEventListener('click', () => {
  produtoAtualIndex = (produtoAtualIndex - 1 + produtosLightbox.length) % produtosLightbox.length;
  atualizarLightbox(produtosLightbox[produtoAtualIndex]);
});

document.getElementById('btnProximo').addEventListener('click', () => {
  produtoAtualIndex = (produtoAtualIndex + 1) % produtosLightbox.length;
  atualizarLightbox(produtosLightbox[produtoAtualIndex]);
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
