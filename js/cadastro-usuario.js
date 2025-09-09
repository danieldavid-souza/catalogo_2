document.getElementById("form-cadastro-usuario").addEventListener("submit", (e) => {
  e.preventDefault();

  const usuario = document.getElementById("usuario").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const nivel = document.getElementById("nivel").value;
  const sucesso = document.getElementById("mensagem-sucesso");
  const erro = document.getElementById("mensagem-erro");

  if (!usuario || !senha || !nivel) {
    erro.textContent = "❌ Preencha todos os campos corretamente.";
    erro.classList.remove("hidden");
    sucesso.classList.add("hidden");
    return;
  }

  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
  const existe = usuarios.find(u => u.usuario === usuario);

  if (existe) {
    erro.textContent = "❌ Usuário já existe.";
    erro.classList.remove("hidden");
    sucesso.classList.add("hidden");
    return;
  }

  usuarios.push({ usuario, senha, nivel });
  localStorage.setItem("usuarios", JSON.stringify(usuarios));

  sucesso.classList.remove("hidden");
  erro.classList.add("hidden");

  document.getElementById("form-cadastro-usuario").reset();
});
