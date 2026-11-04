import { formatarPreco } from "@/lib/formatar";
import type { Post } from "@/lib/instagram";

// Monta a imagem do post (1080 × 1350, o formato retrato do feed do Instagram) com as cores da Ateline.
// Enquanto as fotos dos bolos não chegam, a imagem é um cartão com texto.
const LARGURA = 1080;
const ALTURA = 1350;
const COR = { fundo: "#fbefef", cartao: "#ffffff", texto: "#2b1a22", suave: "#5e4a53", destaque: "#b8294f", rosa: "#f3dde0" };
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// As fontes do site (Outfit e Nunito Sans), com as reservas do sistema
function fontes() {
  const estilo = getComputedStyle(document.documentElement);
  const titulo = estilo.getPropertyValue("--font-outfit").trim() || "system-ui";
  const texto = estilo.getPropertyValue("--font-nunito").trim() || "system-ui";
  return { titulo: `${titulo}, system-ui, sans-serif`, texto: `${texto}, system-ui, sans-serif` };
}

let logo: Promise<HTMLImageElement | null> | null = null;
function carregarLogo() {
  logo ??= new Promise((resolver) => {
    const imagem = new Image();
    imagem.onload = () => resolver(imagem);
    imagem.onerror = () => resolver(null);
    imagem.src = `${base}/logo-ateline.png`;
  });
  return logo;
}

// Quebra o texto em linhas que cabem na largura; devolve onde terminou
function escrever(
  ctx: CanvasRenderingContext2D,
  texto: string,
  x: number,
  y: number,
  larguraMaxima: number,
  alturaDaLinha: number,
  maximoDeLinhas = 6,
): number {
  const palavras = texto.split(/\s+/);
  let linha = "";
  let linhas = 0;
  for (const palavra of palavras) {
    const teste = linha ? `${linha} ${palavra}` : palavra;
    if (ctx.measureText(teste).width > larguraMaxima && linha) {
      ctx.fillText(linha, x, y);
      y += alturaDaLinha;
      linha = palavra;
      if (++linhas === maximoDeLinhas - 1) break;
    } else {
      linha = teste;
    }
  }
  if (linha) {
    ctx.fillText(linha, x, y);
    y += alturaDaLinha;
  }
  return y;
}

export async function desenharPost(post: Pick<Post, "tipo" | "titulo" | "dados">): Promise<HTMLCanvasElement> {
  await document.fonts?.ready;
  const { titulo: fonteTitulo, texto: fonteTexto } = fontes();
  const tela = document.createElement("canvas");
  tela.width = LARGURA;
  tela.height = ALTURA;
  const ctx = tela.getContext("2d")!;

  // Fundo e cartão branco
  ctx.fillStyle = COR.fundo;
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  ctx.fillStyle = COR.cartao;
  ctx.beginPath();
  ctx.roundRect(60, 60, LARGURA - 120, ALTURA - 120, 48);
  ctx.fill();

  // Logo
  const imagem = await carregarLogo();
  if (imagem) {
    const larguraDoLogo = 260;
    const alturaDoLogo = (imagem.height / imagem.width) * larguraDoLogo;
    ctx.drawImage(imagem, (LARGURA - larguraDoLogo) / 2, 110, larguraDoLogo, alturaDoLogo);
  }

  const margem = 140;
  const largura = LARGURA - margem * 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const centro = LARGURA / 2;

  // Título
  ctx.fillStyle = COR.texto;
  ctx.font = `700 76px ${fonteTitulo}`;
  let y = escrever(ctx, post.titulo, centro, 360, largura, 88, 3) + 40;

  // Corpo, conforme o tipo
  if (post.tipo === "livres" && post.dados.bolos) {
    ctx.font = `600 44px ${fonteTexto}`;
    for (const bolo of post.dados.bolos) {
      ctx.fillStyle = COR.rosa;
      ctx.beginPath();
      ctx.roundRect(margem, y, largura, 84, 42);
      ctx.fill();
      ctx.fillStyle = COR.texto;
      ctx.fillText(bolo.nome, centro, y + 18, largura - 60);
      y += 104;
    }
  } else if (post.tipo === "destaque" && post.dados.bolos?.[0]) {
    ctx.fillStyle = COR.suave;
    ctx.font = `500 46px ${fonteTexto}`;
    y = escrever(ctx, `Tema ${post.dados.bolos[0].tema}`, centro, y, largura, 60) + 30;
    if (post.dados.preco !== undefined) {
      ctx.fillStyle = COR.destaque;
      ctx.font = `700 64px ${fonteTitulo}`;
      ctx.fillText(`Aluguel a partir de ${formatarPreco(post.dados.preco).replace(/\s/g, " ")}`, centro, y, largura);
      y += 100;
    }
  } else if (post.tipo === "como-funciona") {
    ctx.font = `600 44px ${fonteTexto}`;
    const passos = ["Escolha o bolo e a data no site", "Garanta com o sinal de 50%", "Retire na véspera e aproveite a festa"];
    passos.forEach((passo, indice) => {
      ctx.fillStyle = COR.destaque;
      ctx.beginPath();
      ctx.arc(margem + 40, y + 40, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = `700 44px ${fonteTitulo}`;
      ctx.fillText(String(indice + 1), margem + 40, y + 16);
      ctx.fillStyle = COR.texto;
      ctx.font = `600 42px ${fonteTexto}`;
      ctx.textAlign = "left";
      escrever(ctx, passo, margem + 110, y + 12, largura - 110, 52, 2);
      ctx.textAlign = "center";
      y += 140;
    });
  } else if (post.dados.texto) {
    ctx.fillStyle = COR.suave;
    ctx.font = `500 50px ${fonteTexto}`;
    y = escrever(ctx, post.dados.texto, centro, y, largura, 66, 7);
  }

  // Rodapé
  ctx.fillStyle = COR.destaque;
  ctx.font = `700 46px ${fonteTitulo}`;
  ctx.fillText("Reserve pelo site · link na bio", centro, ALTURA - 250);
  ctx.fillStyle = COR.suave;
  ctx.font = `500 38px ${fonteTexto}`;
  ctx.fillText("@atelineatelie · Praça Seca, Rio de Janeiro", centro, ALTURA - 180);
  return tela;
}

export function nomeDaImagem(post: Pick<Post, "id" | "titulo">): string {
  const simples = post.titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `ateline-post-${post.id}-${simples || "instagram"}.png`;
}
