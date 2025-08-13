// Aplica filtros por nome, descrição, preço e categoria
document.querySelectorAll('#busca, #preco-min, #preco-max, #categoria').forEach(el => {
  el.addEventListener('input', aplicarFiltros);
});

function aplicarFiltros() {
  const busca = document.getElementById('busca').value.toLowerCase();
  const precoMin = parseFloat(document.getElementById('preco-min').value) || 0;
  const precoMax = parseFloat(document.getElementById('preco-max').value) || Infinity;
  const categoria = document.getElementById('categoria').value;

  const filtrados = window.todosProdutos.filter(p => {
    const texto = (p.nome + ' ' + p.descricao).toLowerCase();
    const dentroDoTexto = texto.includes(busca);
    const dentroDoPreco = p.preco >= precoMin && p.preco <= precoMax;
    const dentroDaCategoria = categoria === 'Todos' || p.categoria === categoria;
    return dentroDoTexto && dentroDoPreco && dentroDaCategoria;
  });

  renderizarCategorias(filtrados);
}

// Preenche o select de categorias dinamicamente
function popularFiltroCategorias(produtos) {
  const select = document.getElementById('categoria');
  const categorias = [...new Set(produtos.map(p => p.categoria))];
  categorias.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}