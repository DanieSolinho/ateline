import { supabase } from "@/lib/supabase";
import type { GrupoDaAgenda } from "@/lib/painel";

// Fotos das peças na retirada e na devolução, guardadas no Storage do Supabase (pasta privada da equipe).
// Caminho: reserva-<id>/<momento>/<data e hora>.jpg
export const PASTA_DAS_FOTOS = "fotos-pecas";
export type Momento = "retirada" | "devolucao";
export type Foto = { caminho: string; url: string; tiradaEm: string | null };

const LADO_MAIOR = 1600; // px: dá para ver arranhões e manchas, e a foto fica com uns 300 KB
const QUALIDADE = 0.8;

// As peças de um aluguel saem e voltam juntas: as fotos ficam na pasta da primeira reserva do grupo.
// O id da reserva não muda num adiamento, então a pasta continua a mesma.
export function pastaDoGrupo(grupo: Pick<GrupoDaAgenda, "ids">): string {
  return `reserva-${Math.min(...grupo.ids)}`;
}

// "2026-11-03T19:25:07.123Z" → "2026-11-03T19-25-07-123Z.jpg" (sem ":" no nome do arquivo)
export function nomeDaFoto(agora: Date, extra = ""): string {
  return `${agora.toISOString().replace(/[:.]/g, "-")}${extra}.jpg`;
}

// O contrário: lê a data e hora no nome do arquivo (null se o nome não seguir o padrão)
export function quandoFoiTirada(nome: string): string | null {
  const achado = nome.match(/^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/);
  if (!achado) return null;
  const [, dia, hora, minuto, segundo, milesimo] = achado;
  return `${dia}T${hora}:${minuto}:${segundo}.${milesimo}Z`;
}

// Calcula o tamanho reduzido, mantendo a proporção
export function tamanhoReduzido(largura: number, altura: number, maximo = LADO_MAIOR) {
  const escala = Math.min(1, maximo / Math.max(largura, altura));
  return { largura: Math.round(largura * escala), altura: Math.round(altura * escala) };
}

// Reduz a foto do celular (que pode ter 5 MB ou mais) antes de enviar
export async function reduzirFoto(arquivo: Blob): Promise<Blob> {
  const imagem = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
  const { largura, altura } = tamanhoReduzido(imagem.width, imagem.height);
  const tela = document.createElement("canvas");
  tela.width = largura;
  tela.height = altura;
  tela.getContext("2d")!.drawImage(imagem, 0, 0, largura, altura);
  imagem.close();
  return new Promise((resolver, rejeitar) =>
    tela.toBlob((blob) => (blob ? resolver(blob) : rejeitar(new Error("Foto inválida"))), "image/jpeg", QUALIDADE),
  );
}

// Envia uma foto. Devolve null se deu certo, ou a mensagem de erro.
export async function enviarFoto(pasta: string, momento: Momento, arquivo: Blob, indice = 0): Promise<string | null> {
  try {
    const foto = await reduzirFoto(arquivo);
    const caminho = `${pasta}/${momento}/${nomeDaFoto(new Date(), indice ? `-${indice}` : "")}`;
    const { error } = await supabase.storage.from(PASTA_DAS_FOTOS).upload(caminho, foto, { contentType: "image/jpeg" });
    if (error) {
      console.warn("Não deu para enviar a foto:", error.message);
      return "Não conseguimos enviar a foto. Confira a internet e tente de novo.";
    }
    return null;
  } catch (erro) {
    console.warn("Não deu para ler a foto:", erro);
    return "Não conseguimos ler essa foto. Tente tirar de novo.";
  }
}

// As fotos de um momento, da mais antiga para a mais nova, com um link temporário (1 hora) para ver
export async function buscarFotos(pasta: string, momento: Momento): Promise<Foto[] | null> {
  const armazenamento = supabase.storage.from(PASTA_DAS_FOTOS);
  const { data, error } = await armazenamento.list(`${pasta}/${momento}`, { sortBy: { column: "name", order: "asc" } });
  if (error) {
    console.warn("Não deu para buscar as fotos:", error.message);
    return null;
  }
  const nomes = (data ?? []).map((arquivo) => arquivo.name).filter((nome) => nome.endsWith(".jpg"));
  if (nomes.length === 0) return [];
  const caminhos = nomes.map((nome) => `${pasta}/${momento}/${nome}`);
  const { data: links, error: erroDosLinks } = await armazenamento.createSignedUrls(caminhos, 60 * 60);
  if (erroDosLinks || !links) {
    console.warn("Não deu para abrir as fotos:", erroDosLinks?.message);
    return null;
  }
  return caminhos.map((caminho, indice) => ({
    caminho,
    url: links[indice]?.signedUrl ?? "",
    tiradaEm: quandoFoiTirada(nomes[indice]),
  }));
}

export async function apagarFoto(caminho: string): Promise<string | null> {
  const { error } = await supabase.storage.from(PASTA_DAS_FOTOS).remove([caminho]);
  if (error) {
    console.warn("Não deu para apagar a foto:", error.message);
    return "Não conseguimos apagar a foto agora.";
  }
  return null;
}
