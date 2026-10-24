// Endereço público do site e dados da loja usados no SEO
export const ORIGEM = "https://daniesolinho.github.io";
export const URL_DO_SITE = `${ORIGEM}/ateline`;

// Imagem que aparece quando alguém compartilha um link do site (WhatsApp, Instagram, Facebook)
export const IMAGEM_DE_COMPARTILHAR = {
  url: `${URL_DO_SITE}/opengraph-image.png`,
  width: 1200,
  height: 630,
  alt: "Ateline: bolos cenográficos para alugar, comprar ou encomendar",
};

export const LOJA = {
  nome: "Ateline Ateliê",
  rua: "Rua Cândido Benício, 2967, bloco P, loja G",
  bairro: "Praça Seca",
  cidade: "Rio de Janeiro",
  uf: "RJ",
};

// "/alugar" → "https://daniesolinho.github.io/ateline/alugar/"
export function urlCompleta(caminho: string): string {
  const semBarraNoFim = caminho.replace(/\/$/, "");
  return `${URL_DO_SITE}${semBarraNoFim}/`;
}
