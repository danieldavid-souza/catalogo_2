document.addEventListener("DOMContentLoaded", () => {
  const lista = document.getElementById("produtos-lista");
  const produtos = JSON.parse(localStorage.getItem("produtos")) || [];

  function renderizarProdutos() {
    lista.innerHTML = "";
    produtos.forEach((produto, index) => {
      const card = document.createElement("div");
      card.className = "produto-card";

      card.innerHTML = `
        <img src="${produto.imagem}" alt="Imagem do produto">
        <label>Nome:</label>
        <input type="text" value="${produto.nome}" />
        <label>Descrição:</label>
        <textarea rows="3">${produto.descricao}</textarea>
        <label>Categoria:</label>
        <select>
          <option value="Sublimação" ${produto.categoria === "Sublimação" ? "selected" : ""}>Sublimação</option>
          <option value="Personalizados" ${produto.categoria === "Personalizados" ? "selected" : ""}>Personalizados</option>
          <option value="Convites Digitais" ${produto.categoria === "Convites Digitais" ? "selected" : ""}>Convites Digitais</option>
        </select>
        <label>Preço:</label>
        <input type="number" step="0.01" value="${produto.preco}" />
        <label>Imagem (URL):</label>
        <input type="text" value="${produto.imagem}" />
        <button class="salvar-btn">💾 Salvar</button>
        <button class="excluir-btn">🗑️ Excluir</button>
      `;

      const [nomeInput, descInput, catSelect, precoInput, imgInput] = card.querySelectorAll("input, textarea, select");

      card.querySelector(".salvar-btn").addEventListener("click", () => {
        produtos[index] = {
          nome: nomeInput.value.trim(),
          descricao: descInput.value.trim(),
          categoria: catSelect.value,
          preco: parseFloat(precoInput.value),
          imagem: imgInput.value.trim()
        };
        localStorage.setItem("produtos", JSON.stringify(produtos));
        renderizarProdutos();
      });

      card.querySelector(".excluir-btn").addEventListener("click", () => {
        produtos.splice(index, 1);
        localStorage.setItem("produtos", JSON.stringify(produtos));
        renderizarProdutos();
      });

      lista.appendChild(card);
    });
  }

  renderizarProdutos();

  document.getElementById("btn-exportar-json").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(produtos, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "produtos.json";
    a.click();
    URL.revokeObjectURL(url);
  });
});
