document.getElementById("form-login").addEventListener("submit", (e) => {
  e.preventDefault();

  const usuario = document.getElementById("usuario").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const erro = document.getElementById("erro-login");

  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
  const valido = usuarios.find(u => u.usuario === usuario && u.senha === senha);

  if (valido) {
    localStorage.setItem("usuarioLogado", valido.usuario);
    if (erro) erro.classList.add("hidden");

    if (valido.nivel === "admin") {
      window.location.href = "admin.html";
    } else if (valido.nivel === "editor") {
      window.location.href = "editor.html";
    } else {
      alert("⚠️ Nível de acesso desconhecido.");
    }
  } else {
    if (erro) erro.classList.remove("hidden");
  }
});
