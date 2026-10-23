// Contatos da loja, num lugar só.
// WhatsApp: "55" + DDD + número, só os dígitos. Ex.: "5521999998888".
// Enquanto estiver vazio, o botão do WhatsApp não aparece no site.
export const WHATSAPP_LOJA = "5521964254308";

export const INSTAGRAM_LOJA = "https://www.instagram.com/atelineatelie";

// Link que abre o WhatsApp da loja já com a mensagem escrita (ou null se não houver número)
export function linkWhatsApp(mensagem: string, numero: string = WHATSAPP_LOJA): string | null {
  const digitos = numero.replace(/\D/g, "");
  if (!digitos) return null;
  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensagem)}`;
}

// A mensagem pronta muda conforme a página em que a cliente está
export function mensagemDaPagina(caminho: string): string {
  const bolo = caminho.match(/^\/bolo\/([^/]+)/);
  if (bolo) return `Olá! Vim pelo site e tenho uma dúvida sobre o bolo ${decodeURIComponent(bolo[1])}.`;
  if (caminho.startsWith("/checkout") || caminho.startsWith("/carrinho")) {
    return "Olá! Estou finalizando uma reserva pelo site e tenho uma dúvida.";
  }
  return "Olá! Vim pelo site da Ateline e tenho uma dúvida.";
}
