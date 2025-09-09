document.addEventListener("DOMContentLoaded", () => {
  const logado = localStorage.getItem("usuarioLogado");
  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
  const usuarioAtual = usuarios.find(u => u.usuario === logado);

  if (!usuarioAtual || usuarioAtual.nivel !== "editor") {
    document.body.innerHTML = `
      <main style="text-align:center; padding:40px;">
        <h2 style="color:#d32f2f;">⚠️ Acesso negado</h2>
        <p>Você precisa fazer login como <strong>editor</strong> para acessar esta página.</p>
        <a href="login.html" style="color:#4a148c; font-weight:bold;">🔐 Ir para login</a>
      </main>
    `;
    return;
  }

  const titulo = document.getElementById("titulo-editor");
  const lista = document.getElementById("produtos-lista");
  const total = document.getElementById("total-produtos");
  const filtroCategorias = document.getElementById("filtro-categorias");
  const buscaNome = document.getElementById("busca-nome");

  if (titulo) {
    titulo.textContent = `👋 Bem-vindo, ${logado}`;
  }

  const produtos = JSON.parse(localStorage.getItem("produtos")) || [];

  function renderizarProdutos(listaProdutos) {
    lista.innerHTML = "";

    listaProdutos.forEach((produto) => {
      const nome = produto.nome || "Produto sem nome";
      const descricao = produto.descricao || "Descrição não informada";
      const categoria = produto.categoria || "Categoria não definida";
      const preco = typeof produto.preco === "number" ? produto.preco : 0;
      const imagem = produto.imagem || "imagens/placeholder.jpg";

      const card = document.createElement("div");
      card.className = "produto-card";

      card.innerHTML = `
        <img src="${imagem}" alt="${nome}" class="produto-img"
             onerror="this.src='imagens/placeholder.jpg'; this.alt='Imagem não disponível';"><br>
        <strong>${nome}</strong><br>
        <em>${descricao}</em><br>
        <span>Categoria: ${categoria}</span><br>
        <span>Preço: R$ ${preco.toFixed(2)}</span>
      `;

      lista.appendChild(card);
    });

    if (total) {
      total.textContent = `Total de produtos: ${listaProdutos.length}`;
    }
  }

  function popularFiltroCategorias() {
    if (!filtroCategorias) return;

    const categorias = [...new Set(produtos.map(p => p.categoria))];
    filtroCategorias.innerHTML = '<option value="todos">Todas as categorias</option>';

    categorias.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      filtroCategorias.appendChild(option);
    });
  }

  function aplicarFiltros() {
    const categoriaSelecionada = filtroCategorias?.value || "todos";
    const termoBusca = buscaNome?.value.toLowerCase() || "";

    const filtrados = produtos.filter(p => {
      const correspondeCategoria = categoriaSelecionada === "todos" || p.categoria === categoriaSelecionada;
      const correspondeBusca = p.nome.toLowerCase().includes(termoBusca);
      return correspondeCategoria && correspondeBusca;
    });

    renderizarProdutos(filtrados);
  }

  if (filtroCategorias) {
    filtroCategorias.addEventListener("change", aplicarFiltros);
  }

  if (buscaNome) {
    buscaNome.addEventListener("input", aplicarFiltros);
  }

  popularFiltroCategorias();
  aplicarFiltros();

  function atualizarRelogio() {
    const agora = new Date();
    const horas = agora.getHours().toString().padStart(2, '0');
    const minutos = agora.getMinutes().toString().padStart(2, '0');
    const segundos = agora.getSeconds().toString().padStart(2, '0');
    const relogio = document.getElementById("relogio");
    if (relogio) {
      relogio.textContent = `${horas}:${minutos}:${segundos}`;
    }
  }

  setInterval(atualizarRelogio, 1000);
  atualizarRelogio();
});

// 🚪 Logout
function logout() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "login.html";
}

const btnTema = document.getElementById("toggle-tema");
if (btnTema) {
  btnTema.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const modoAtual = document.body.classList.contains("dark-mode") ? "dark" : "light";
    localStorage.setItem("temaPreferido", modoAtual);
  });

  // Aplica tema salvo
  const temaSalvo = localStorage.getItem("temaPreferido");
  if (temaSalvo === "dark") {
    document.body.classList.add("dark-mode");
  }
}