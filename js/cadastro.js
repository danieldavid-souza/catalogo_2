document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-produto");
  const preview = document.getElementById("preview");
  const imagemInput = document.getElementById("imagem");
  const mensagemSucesso = document.getElementById("mensagem-sucesso");

  imagemInput.addEventListener("input", () => {
    const url = imagemInput.value.trim();
    preview.innerHTML = url ? `<img src="${url}" alt="Preview da imagem">` : "";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const novoProduto = {
      nome: document.getElementById("nome").value.trim(),
      descricao: document.getElementById("descricao").value.trim(),
      categoria: document.getElementById("categoria").value,
      preco: parseFloat(document.getElementById("preco").value),
      imagem: document.getElementById("imagem").value.trim()
    };

    // Simula salvamento no localStorage
    const produtos = JSON.parse(localStorage.getItem("produtos")) || [];
    produtos.push(novoProduto);
    localStorage.setItem("produtos", JSON.stringify(produtos));

    form.reset();
    preview.innerHTML = "";
    mensagemSucesso.classList.remove("hidden");

    setTimeout(() => {
      mensagemSucesso.classList.add("hidden");
    }, 3000);
  });
});

document.getElementById("btn-exportar-json").addEventListener("click", () => {
  const produtos = JSON.parse(localStorage.getItem("produtos")) || [];

  const blob = new Blob([JSON.stringify(produtos, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "produtos.json";
  a.click();

  URL.revokeObjectURL(url);
});