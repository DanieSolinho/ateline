import type {
  Acessorio,
  BoloCatalogo,
  Catalogo,
  OpcaoAluguel,
  Personalizacao,
  StatusPeca,
  TipoTopo,
} from "@/types/catalogo";

// Uma linha da planilha: { "Código do bolo": "SAFARI_001", "Andares mín.": 3, ... }
export type Linha = Record<string, string | number | null>;

export type Resultado = { catalogo: Catalogo; erros: string[]; avisos: string[] };

// "  Em Manutenção " → "em manutenção"
function chave(texto: unknown): string {
  return String(texto ?? "").trim().toLowerCase();
}

function texto(valor: unknown): string {
  return String(valor ?? "").trim();
}

function numero(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const n = typeof valor === "number" ? valor : Number(String(valor).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

const STATUS: Record<string, StatusPeca> = {
  "disponível": "disponivel",
  alugado: "alugado",
  "em manutenção": "manutencao",
  inativo: "inativo",
};

const PERSONALIZACAO: Record<string, Personalizacao> = {
  "não": "nenhuma",
  "": "nenhuma",
  nome: "nome",
  idade: "idade",
  "nome e idade": "nome_idade",
  inicial: "inicial",
};

const TIPO_TOPO: Record<string, TipoTopo> = {
  fixo: "fixo",
  opcional: "opcional",
  "sem topo": "sem_topo",
  "": "sem_topo",
};

// "TOPO_001, TOPO_003" → ["TOPO_001", "TOPO_003"]
export function listaDeCodigos(valor: unknown): string[] {
  return texto(valor)
    .split(/[,;]/)
    .map((codigo) => codigo.trim().toUpperCase())
    .filter(Boolean);
}

export function converterCatalogo(planilha: {
  bolos: Linha[];
  opcoes: Linha[];
  topos: Linha[];
  bases: Linha[];
}): Resultado {
  const erros: string[] = [];
  const avisos: string[] = [];

  function status(valor: unknown, onde: string): StatusPeca {
    const convertido = STATUS[chave(valor)];
    if (!convertido) erros.push(`${onde}: status "${texto(valor)}" não existe.`);
    return convertido ?? "inativo";
  }

  // ---------- Bolos ----------
  const bolos: BoloCatalogo[] = [];
  for (const linha of planilha.bolos) {
    const codigo = texto(linha["Código do bolo"]).toUpperCase();
    if (!codigo) continue; // linha vazia
    const onde = `Bolo ${codigo}`;

    const andaresMin = numero(linha["Andares mín."]);
    const andaresMax = numero(linha["Andares máx."]);
    if (andaresMin === null || andaresMax === null) erros.push(`${onde}: preencha andares mín. e máx.`);

    const personalizacao = PERSONALIZACAO[chave(linha["Personalização (inclusa no aluguel)"])];
    if (!personalizacao) erros.push(`${onde}: personalização "${texto(linha["Personalização (inclusa no aluguel)"])}" não existe.`);

    const tipoTopo = TIPO_TOPO[chave(linha["Tipo de topo"])];
    if (!tipoTopo) erros.push(`${onde}: tipo de topo "${texto(linha["Tipo de topo"])}" não existe.`);

    bolos.push({
      codigo,
      nome: texto(linha["Nome"]),
      tema: texto(linha["Tema"]),
      andaresMin: andaresMin ?? 0,
      andaresMax: andaresMax ?? 0,
      tipoTopo: tipoTopo ?? "sem_topo",
      toposCompativeis: listaDeCodigos(linha["Topos compatíveis"]),
      aceitaBaseDourada: chave(linha["Aceita base dourada?"]) === "sim",
      personalizacao: personalizacao ?? "nenhuma",
      status: status(linha["Status"], onde),
      previsaoVolta: texto(linha["Previsão de volta"]) || null,
      podeSerRefeito: chave(linha["Pode ser refeito?"]) === "sim",
    });
  }

  // ---------- Opções de aluguel ----------
  const opcoes: OpcaoAluguel[] = [];
  for (const linha of planilha.opcoes) {
    const codigo = texto(linha["Código da opção"]).toUpperCase();
    if (!codigo) continue;
    const onde = `Opção ${codigo}`;

    const codigoBolo = texto(linha["Código do bolo"]).toUpperCase();
    const bolo = bolos.find((b) => b.codigo === codigoBolo);
    if (!bolo) erros.push(`${onde}: o bolo "${codigoBolo}" não está na aba Bolos.`);

    const andares = numero(linha["Andares"]);
    const precoLocacao = numero(linha["Preço aluguel (R$)"]);
    const precoVenda = numero(linha["Preço venda (R$)"]);
    if (andares === null) erros.push(`${onde}: preencha o número de andares.`);
    if (!precoLocacao || precoLocacao <= 0) erros.push(`${onde}: preencha o preço de aluguel.`);
    if (precoVenda === null) avisos.push(`${onde}: sem preço de venda.`);

    if (bolo && andares !== null && (andares < bolo.andaresMin || andares > bolo.andaresMax)) {
      avisos.push(`${onde}: ${andares} andares está fora do limite do bolo (${bolo.andaresMin} a ${bolo.andaresMax}).`);
    }

    opcoes.push({
      codigo,
      codigoBolo,
      decoracao: texto(linha["Decoração"]) || null,
      andares: andares ?? 0,
      precoLocacao: precoLocacao ?? 0,
      precoVenda,
      precoEncomendaNova: numero(linha["Preço encomenda nova (R$)"]),
    });
  }

  // ---------- Topos e bases ----------
  function acessorios(linhas: Linha[], colunaCodigo: string, nomeDaAba: string): Acessorio[] {
    const lista: Acessorio[] = [];
    for (const linha of linhas) {
      const codigo = texto(linha[colunaCodigo]).toUpperCase();
      if (!codigo) continue;
      const onde = `${nomeDaAba} ${codigo}`;
      const preco = numero(linha["Preço aluguel (R$)"]);
      if (!preco || preco <= 0) erros.push(`${onde}: preencha o preço de aluguel.`);
      lista.push({
        codigo,
        nome: texto(linha["Nome"]),
        descricao: texto(linha["Descrição"]),
        precoLocacao: preco ?? 0,
        status: status(linha["Status"], onde),
        previsaoVolta: texto(linha["Previsão de volta"]) || null,
      });
    }
    return lista;
  }

  const topos = acessorios(planilha.topos, "Código", "Topo");
  const bases = acessorios(planilha.bases, "Código da unidade", "Base");

  // ---------- Conferências entre abas ----------
  const todosOsCodigos = [...bolos, ...opcoes, ...topos, ...bases].map((item) => item.codigo);
  const repetidos = todosOsCodigos.filter((codigo, i) => todosOsCodigos.indexOf(codigo) !== i);
  for (const codigo of new Set(repetidos)) erros.push(`O código ${codigo} aparece mais de uma vez.`);

  for (const bolo of bolos) {
    if (!opcoes.some((opcao) => opcao.codigoBolo === bolo.codigo)) {
      avisos.push(`Bolo ${bolo.codigo}: não tem nenhuma opção de aluguel, então não aparece no site.`);
    }
    for (const codigoTopo of bolo.toposCompativeis) {
      if (!topos.some((topo) => topo.codigo === codigoTopo)) {
        erros.push(`Bolo ${bolo.codigo}: o topo ${codigoTopo} não está na aba Topos.`);
      }
    }
  }

  return { catalogo: { bolos, opcoes, topos, bases }, erros, avisos };
}