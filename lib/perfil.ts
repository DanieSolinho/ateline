import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { CAMPOS_DO_ENDERECO, errosDoEndereco, temAlgumCampo, type Endereco } from "@/lib/endereco";
import { cpfValido, somenteDigitos, telefoneValido } from "@/lib/validacao";

// Os dados que a cliente guarda na conta (o e-mail fica no próprio login)
export type Perfil = {
  nome: string;
  cpf: string;
  whatsapp: string;
  chavePix: string;
} & Endereco;

// Uma linha da tabela "perfis" do Supabase (o banco usa nomes_com_underline)
export type LinhaDePerfil = {
  nome: string | null;
  cpf: string | null;
  whatsapp: string | null;
  chave_pix: string | null;
} & Partial<Record<keyof Endereco, string | null>>;

const COLUNAS = ["nome", "cpf", "whatsapp", "chave_pix", ...CAMPOS_DO_ENDERECO].join(", ");

export function perfilDaLinha(linha: LinhaDePerfil): Perfil {
  return {
    nome: linha.nome ?? "",
    cpf: linha.cpf ?? "",
    whatsapp: linha.whatsapp ?? "",
    chavePix: linha.chave_pix ?? "",
    cep: linha.cep ?? "",
    rua: linha.rua ?? "",
    numero: linha.numero ?? "",
    complemento: linha.complemento ?? "",
    bairro: linha.bairro ?? "",
    cidade: linha.cidade ?? "",
    uf: linha.uf ?? "",
  };
}

export function linhaDoPerfil(id: string, perfil: Perfil) {
  return {
    id,
    nome: perfil.nome || null,
    cpf: perfil.cpf || null,
    whatsapp: perfil.whatsapp || null,
    chave_pix: perfil.chavePix || null,
    cep: perfil.cep ? somenteDigitos(perfil.cep) : null,
    rua: perfil.rua || null,
    numero: perfil.numero || null,
    complemento: perfil.complemento || null,
    bairro: perfil.bairro || null,
    cidade: perfil.cidade || null,
    uf: perfil.uf ? perfil.uf.toUpperCase() : null,
  };
}

const texto = z.string().trim().optional().default("");

// As regras do formulário "Meus dados". O endereço é opcional, mas se começar a preencher, tem que completar.
export const esquemaPerfil = z
  .object({
    nome: z.string().trim().min(3, { error: "Escreva seu nome completo." }),
    cpf: z.string().refine(cpfValido, { error: "CPF inválido. Confira os números." }),
    whatsapp: z.string().refine(telefoneValido, { error: "Coloque o WhatsApp com DDD." }),
    chavePix: z.string().trim(),
    cep: texto,
    rua: texto,
    numero: texto,
    complemento: texto,
    bairro: texto,
    cidade: texto,
    uf: texto,
  })
  .superRefine((dados, contexto) => {
    if (!temAlgumCampo(dados)) return;
    for (const [campo, mensagem] of Object.entries(errosDoEndereco(dados))) {
      contexto.addIssue({ code: "custom", path: [campo], message: mensagem });
    }
  })
  .transform((dados) => ({
    ...dados,
    cpf: somenteDigitos(dados.cpf),
    whatsapp: somenteDigitos(dados.whatsapp),
    cep: somenteDigitos(dados.cep),
    uf: dados.uf.toUpperCase(),
  }));

export async function buscarPerfil(id: string): Promise<Perfil | null> {
  const { data, error } = await supabase.from("perfis").select(COLUNAS).eq("id", id).maybeSingle();
  if (error) console.warn("Não deu para buscar o perfil:", error.message);
  return data ? perfilDaLinha(data as unknown as LinhaDePerfil) : null;
}

// Cria ou atualiza o perfil (upsert). Devolve null se deu certo, ou a mensagem de erro.
export async function salvarPerfil(id: string, perfil: Perfil): Promise<string | null> {
  const { error } = await supabase.from("perfis").upsert(linhaDoPerfil(id, perfil));
  if (error) {
    console.warn("Não deu para salvar o perfil:", error.message);
    return "Não conseguimos salvar seus dados agora. Tente de novo em instantes.";
  }
  return null;
}
