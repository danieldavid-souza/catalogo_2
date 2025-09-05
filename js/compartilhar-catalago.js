document.addEventListener("DOMContentLoaded", () => {
  const btnCompartilhar = document.getElementById("btn-compartilhar-catalogo");
  const menuCompartilhar = document.getElementById("menu-compartilhar-catalogo");

  const emojisPorCampanha = {
    geral: [String.fromCodePoint(0x1F6D2), String.fromCodePoint(0x2728)], // 🛒✨
    presentes: [String.fromCodePoint(0x1F381), String.fromCodePoint(0x1F49D)], // 🎁💝
    amor: [String.fromCodePoint(0x1F496), String.fromCodePoint(0x2764)], // 💖❤️
    infantil: [String.fromCodePoint(0x1F3AA), String.fromCodePoint(0x1F9F8)], // 🎪🧸
    festa: [String.fromCodePoint(0x1F389), String.fromCodePoint(0x1F973)], // 🎉🥳
    cuidados: [String.fromCodePoint(0x1F6C0), String.fromCodePoint(0x1F9FC)], // 🛀🧼
    personalizados: [String.fromCodePoint(0x1F58C), String.fromCodePoint(0x1FA84)], // 🖌️🪄
    doces: [String.fromCodePoint(0x1F36F), String.fromCodePoint(0x1F9C1)], // 🍯🧁
    convites: [String.fromCodePoint(0x1F4E9), String.fromCodePoint(0x1F4DD)], // 📩📝
  };

  function gerarLinkCompartilhamento({ plataforma, campanha, url }) {
    const emojiSet = emojisPorCampanha[campanha] || emojisPorCampanha.geral;
    const titulo = `Confira o catálogo Lima Calixto! ${emojiSet.join(" ")}`;
    const mensagem = `${titulo}\n${url}`;
    const textoCodificado = encodeURIComponent(mensagem);

    switch (plataforma) {
      case "whatsapp":
        return `https://wa.me/?text=${textoCodificado}`;
      case "telegram":
        return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(titulo)}`;
      case "email":
        return `mailto:?subject=${encodeURIComponent(titulo)}&body=${textoCodificado}`;
      default:
        alert("Plataforma não reconhecida.");
        return null;
    }
  }

  btnCompartilhar.addEventListener("click", () => {
    menuCompartilhar.classList.toggle("visible");
  });

  document.querySelectorAll("#menu-compartilhar-catalogo button[data-campanha]").forEach(btn => {
    btn.addEventListener("click", () => {
      const campanha = btn.getAttribute("data-campanha");
      const plataforma = btn.getAttribute("data-plataforma");
      const link = gerarLinkCompartilhamento({ plataforma, campanha, url: window.location.href });
      if (link) window.open(link, "_blank");
      menuCompartilhar.classList.remove("visible");
    });
  });

  document.getElementById("fechar-menu-compartilhar").addEventListener("click", () => {
    menuCompartilhar.classList.remove("visible");
  });

  document.addEventListener("click", (e) => {
    if (!btnCompartilhar.contains(e.target) && !menuCompartilhar.contains(e.target)) {
      menuCompartilhar.classList.remove("visible");
    }
  });
});