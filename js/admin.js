document.addEventListener("DOMContentLoaded", () => {
  const logado = localStorage.getItem("usuarioLogado");
  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
  const usuarioAtual = usuarios.find(u => u.usuario === logado);

  if (!usuarioAtual || usuarioAtual.nivel !== "admin") {
    document.body.innerHTML = `
      <main style="text-align:center; padding:40px;">
        <h2 style="color:#d32f2f;">⚠️ Acesso negado</h2>
        <p>Você precisa fazer login como <strong>administrador</strong> para acessar esta página.</p>
        <a href="login.html" style="color:#4a148c; font-weight:bold;">🔐 Ir para login</a>
      </main>
    `;
    return;
  }

  const titulo = document.getElementById("titulo-admin");
  const lista = document.getElementById("produtos-lista");
  const total = document.getElementById("total-produtos");
  const filtro = document.getElementById("filtro-categorias");
  const busca = document.getElementById("busca-nome");

  if (titulo) {
    titulo.textContent = `📦 Painel Administrativo (${logado})`;
  }

  let todosProdutos = [];

  function carregarProdutos() {
    const produtosLocal = JSON.parse(localStorage.getItem("produtos"));
    if (produtosLocal && produtosLocal.length) {
      todosProdutos = produtosLocal;
      popularFiltroCategorias(todosProdutos);
      aplicarFiltros();
    } else {
      fetch("data/produtos.json")
        .then(res => res.json())
        .then(produtos => {
          localStorage.setItem("produtos", JSON.stringify(produtos));
          todosProdutos = produtos;
          popularFiltroCategorias(todosProdutos);
          aplicarFiltros();
        })
        .catch(err => {
          console.error("Erro ao carregar produtos:", err);
          lista.innerHTML = `<p style="color:#d32f2f;">❌ Erro ao carregar produtos.</p>`;
        });
    }
  }

  function popularFiltroCategorias(produtos) {
    if (!filtro) return;
    const categorias = [...new Set(produtos.map(p => p.categoria))];
    filtro.innerHTML = '<option value="todos">Todas as categorias</option>';
    categorias.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      filtro.appendChild(option);
    });
  }

  function aplicarFiltros() {
    const categoriaSelecionada = filtro?.value || "todos";
    const termoBusca = busca?.value.toLowerCase() || "";

    const filtrados = todosProdutos.filter(p => {
      const correspondeCategoria = categoriaSelecionada === "todos" || p.categoria === categoriaSelecionada;
      const correspondeBusca = p.nome.toLowerCase().includes(termoBusca);
      return correspondeCategoria && correspondeBusca;
    });

    renderizarProdutos(filtrados);
  }

  if (filtro) filtro.addEventListener("change", aplicarFiltros);
  if (busca) busca.addEventListener("input", aplicarFiltros);

  function renderizarProdutos(listaProdutos) {
    lista.innerHTML = "";

    if (total) {
      total.textContent = `Total de produtos: ${listaProdutos.length}`;
    }

    listaProdutos.forEach((produto, index) => {
      const nome = produto.nome || "";
      const descricao = produto.descricao || "";
      const categoria = produto.categoria || "Sublimação";
      const preco = typeof produto.preco === "number" ? produto.preco : 0;
      const imagem = produto.imagem || "imagens/placeholder.jpg";

      const card = document.createElement("div");
      card.className = "produto-card";

      card.innerHTML = `
        <img src="${imagem}" alt="Imagem do produto" class="produto-img"
             onerror="this.src='imagens/placeholder.jpg'; this.alt='Imagem não disponível';">
        <label>Nome:</label>
        <input type="text" data-campo="nome" value="${nome}" />
        <label>Descrição:</label>
        <textarea data-campo="descricao" rows="3">${descricao}</textarea>
        <label>Categoria:</label>
        <select data-campo="categoria">
          <option value="Sublimação" ${categoria === "Sublimação" ? "selected" : ""}>Sublimação</option>
          <option value="Personalizados" ${categoria === "Personalizados" ? "selected" : ""}>Personalizados</option>
          <option value="Convites Digitais" ${categoria === "Convites Digitais" ? "selected" : ""}>Convites Digitais</option>
        </select>
        <label>Preço:</label>
        <input type="number" data-campo="preco" step="0.01" value="${preco}" />
        <label>Imagem (URL):</label>
        <input type="text" data-campo="imagem" value="${imagem}" />
        <button class="salvar-btn">💾 Salvar</button>
        <button class="excluir-btn">🗑️ Excluir</button>
      `;

      const nomeInput = card.querySelector('[data-campo="nome"]');
      const descInput = card.querySelector('[data-campo="descricao"]');
      const catSelect = card.querySelector('[data-campo="categoria"]');
      const precoInput = card.querySelector('[data-campo="preco"]');
      const imgInput = card.querySelector('[data-campo="imagem"]');

      card.querySelector(".salvar-btn").addEventListener("click", () => {
        todosProdutos[index] = {
          nome: nomeInput.value.trim(),
          descricao: descInput.value.trim(),
          categoria: catSelect.value,
          preco: parseFloat(precoInput.value),
          imagem: imgInput.value.trim()
        };
        localStorage.setItem("produtos", JSON.stringify(todosProdutos));
        aplicarFiltros();
      });

      card.querySelector(".excluir-btn").addEventListener("click", () => {
        if (confirm(`Excluir produto "${nome}"?`)) {
          todosProdutos.splice(index, 1);
          localStorage.setItem("produtos", JSON.stringify(todosProdutos));
          aplicarFiltros();
        }
      });

      lista.appendChild(card);
    });
  }

  const btnExportar = document.getElementById("btn-exportar-json");
  if (btnExportar) {
    btnExportar.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(todosProdutos, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "produtos.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  const inputImportar = document.getElementById("input-json");
  if (inputImportar) {
    inputImportar.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const produtosImportados = JSON.parse(e.target.result);
          if (!Array.isArray(produtosImportados)) throw new Error("Formato inválido");

          todosProdutos = produtosImportados;
          localStorage.setItem("produtos", JSON.stringify(todosProdutos));
          popularFiltroCategorias(todosProdutos);
          aplicarFiltros();
          alert("✅ Produtos importados com sucesso!");
        } catch (err) {
          console.error("Erro ao importar JSON:", err);
          alert("❌ Erro ao importar o arquivo. Verifique o formato.");
        }
      };
      reader.readAsText(file);
    });
  }

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

  function logout() {
    localStorage.removeItem("usuarioLogado");
    window.location.href = "login.html";
  }

  window.logout = logout;

  carregarProdutos();
});