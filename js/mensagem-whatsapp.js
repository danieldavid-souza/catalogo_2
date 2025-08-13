// Gera link de WhatsApp com mensagem personalizada
function gerarLinkWhatsApp(produto) {
  const mensagem = `Olá! Marli. Tenho interesse no produto "${produto.nome}" (${produto.descricao}) por R$ ${produto.preco.toFixed(2)}.`;
  return `https://wa.me/5532991657472?text=${encodeURIComponent(mensagem)}`;
}