// Regras do comando "npm run fotos" que dá para testar sem mexer em arquivos

const EXTENSOES_ACEITAS = [".jpg", ".jpeg", ".png", ".webp"];

// Nome da pasta → código: " abelhinha_001 " → "ABELHINHA_001"; "Arca de Noe 002" → "ARCA_DE_NOE_002"
export function codigoDaPasta(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // tira acentos
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function ehFoto(arquivo: string): boolean {
  const nome = arquivo.toLowerCase();
  return !nome.startsWith(".") && EXTENSOES_ACEITAS.some((ext) => nome.endsWith(ext));
}

// Foto do iPhone no formato HEIC: o comando avisa para exportar como JPG
export function ehHeic(arquivo: string): boolean {
  return /\.(heic|heif)$/i.test(arquivo);
}

// Ordem das fotos: pelo número no nome, como uma pessoa leria (-2 antes de -10)
export function ordenarFotos(arquivos: string[]): string[] {
  return [...arquivos].sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" }));
}
