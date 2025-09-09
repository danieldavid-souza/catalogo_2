document.addEventListener("DOMContentLoaded", () => {
  const logado = localStorage.getItem("usuarioLogado");
  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  const lista = document.getElementById("usuarios-lista");
  const relogio = document.getElementById("relogio");

  if (!logado) {
    document.body.innerHTML = `
      <main style="text-align:center; padding:40px;">
        <h2 style="color:#d32f2f;">⚠️ Acesso negado</h2>
        <p>Você precisa estar logado para acessar esta página.</p>
        <a href="login.html" style="color:#4a148c; font-weight:bold;">🔐 Ir para login</a>
      </main>
    `;
    return;
  }

  function renderizarUsuarios() {
    lista.innerHTML = "";

    usuarios.forEach((usuario, index) => {
      const card = document.createElement("div");
      card.className = "produto-card";

      card.innerHTML = `
        <strong>Usuário:</strong> ${usuario.usuario}<br>
        <span>Nível: ${usuario.nivel}</span><br>
        ${usuario.usuario !== logado ? `<button class="excluir-btn">🗑️ Excluir</button>` : `<em>(Você)</em>`}
      `;

      if (usuario.usuario !== logado) {
        card.querySelector(".excluir-btn").addEventListener("click", () => {
          if (confirm(`Excluir o usuário "${usuario.usuario}"?`)) {
            usuarios.splice(index, 1);
            localStorage.setItem("usuarios", JSON.stringify(usuarios));
            renderizarUsuarios();
          }
        });
      }

      lista.appendChild(card);
    });
  }

  function atualizarRelogio() {
    const agora = new Date();
    const horas = agora.getHours().toString().padStart(2, '0');
    const minutos = agora.getMinutes().toString().padStart(2, '0');
    const segundos = agora.getSeconds().toString().padStart(2, '0');
    if (relogio) {
      relogio.textContent = `${horas}:${minutos}:${segundos}`;
    }
  }

  setInterval(atualizarRelogio, 1000);
  atualizarRelogio();

  renderizarUsuarios();

  document.getElementById("form-novo-usuario").addEventListener("submit", (e) => {
    e.preventDefault();

    const novoUsuario = document.getElementById("novo-usuario").value.trim();
    const novaSenha = document.getElementById("nova-senha").value.trim();
    const novoNivel = document.getElementById("novo-nivel").value;
    const mensagem = document.getElementById("mensagem-usuario");

    if (!novoUsuario || !novaSenha || !novoNivel) {
        mensagem.textContent = "❌ Preencha todos os campos.";
        mensagem.style.color = "#d32f2f";
        return;
    }

    const existe = usuarios.find(u => u.usuario === novoUsuario);
    if (existe) {
        mensagem.textContent = "❌ Usuário já existe.";
        mensagem.style.color = "#d32f2f";
        return;
    }

    usuarios.push({ usuario: novoUsuario, senha: novaSenha, nivel: novoNivel });
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    renderizarUsuarios();

    mensagem.textContent = "✅ Usuário cadastrado com sucesso!";
    mensagem.style.color = "#2e7d32";
    e.target.reset();
    });
});

function logout() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "login.html";
}