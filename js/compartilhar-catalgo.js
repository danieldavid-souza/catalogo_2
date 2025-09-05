const btnCompartilhar = document.getElementById("btn-compartilhar-catalogo");
  const menuCompartilhar = document.getElementById("menu-compartilhar-catalogo");
  const urlCatalogo = window.location.href;

  btnCompartilhar.addEventListener("click", () => {
    menuCompartilhar.classList.toggle("hidden");
  });

  document.getElementById("compartilhar-whatsapp").addEventListener("click", () => {
    const mensagem = `Confira o catálogo Lima Calixto! 💖\n${urlCatalogo}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, "_blank");
    menuCompartilhar.classList.add("hidden");
  });

  document.getElementById("compartilhar-copiar").addEventListener("click", () => {
    navigator.clipboard.writeText(urlCatalogo).then(() => {
      alert("✅ Link copiado para a área de transferência!");
    });
    menuCompartilhar.classList.add("hidden");
  });

  document.getElementById("compartilhar-nativo").addEventListener("click", () => {
    if (navigator.share) {
      navigator.share({
        title: "Catálogo Lima Calixto",
        text: "Confira os produtos personalizados!",
        url: urlCatalogo
      });
    } else {
      alert("⚠️ Compartilhamento nativo não suportado neste navegador.");
    }
    menuCompartilhar.classList.add("hidden");
  });

  // Fecha o menu se clicar fora
  document.addEventListener("click", (e) => {
    if (!btnCompartilhar.contains(e.target) && !menuCompartilhar.contains(e.target)) {
      menuCompartilhar.classList.add("hidden");
    }
  });

  document.getElementById("fechar-menu-compartilhar").addEventListener("click", () => {
  menuCompartilhar.classList.add("hidden");
});