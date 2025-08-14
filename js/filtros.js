// Aplica os filtros de busca, preço e categoria
function aplicarFiltros() {
  // Captura os valores dos campos de filtro
  const busca = document.getElementById('busca').value.toLowerCase();
  const precoMin = parseFloat(document.getElementById('preco-min').value) || 0;
  const precoMax = parseFloat(document.getElementById('preco-max').value) || Infinity;
  const categoria = document.getElementById('categoria').value;

  // Filtra os produtos com base nos critérios
  const filtrados = window.todosProdutos.filter(p => {
    const texto = (p.nome + ' ' + p.descricao).toLowerCase();
    const dentroDoTexto = texto.includes(busca);
    const dentroDoPreco = p.preco >= precoMin && p.preco <= precoMax;
    const dentroDaCategoria = categoria === 'Todos' || p.categoria === categoria;
    return dentroDoTexto && dentroDoPreco && dentroDaCategoria;
  });

  // Exibe os produtos filtrados
  renderizarCategorias(filtrados);
}

// Preenche o <select> de categorias com base nos produtos disponíveis
function popularFiltroCategorias(produtos) {
  const select = document.getElementById('categoria');

  // Limpa opções antigas e adiciona a opção padrão
  select.innerHTML = '<option value="Todos">Todas as Categorias</option>';

  // Extrai categorias únicas dos produtos
  const categorias = [...new Set(produtos.map(p => p.categoria))];

  // Adiciona cada categoria como uma opção no <select>
  categorias.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}

// Inicializa os filtros após carregar os produtos
function inicializarFiltros(produtos) {
  // Salva os produtos globalmente para uso nos filtros
  window.todosProdutos = produtos;

  // Preenche o filtro de categorias
  popularFiltroCategorias(produtos);

  // Aplica os filtros iniciais (sem nenhum critério)
  aplicarFiltros();

  // Adiciona os listeners para os campos de filtro
  document.querySelectorAll('#busca, #preco-min, #preco-max, #categoria').forEach(el => {
    el.addEventListener('input', aplicarFiltros);
  });
}