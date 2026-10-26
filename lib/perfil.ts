import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { cpfValido, somenteDigitos, telefoneValido } from "@/lib/validacao";

// Os dados que a cliente guarda na conta (o e-mail fica no próprio login)
export type Perfil = {
  nome: string;
  cpf: string;
  whatsapp: string;
  chavePix: string;
};

// Uma linha da tabela "perfis" do Supabase (o banco usa nomes_com_underline)
export type LinhaDePerfil = {
  nome: string | null;
  cpf: string | null;
  whatsapp: string | null;
  chave_pix: string | null;
};

export function perfilDaLinha(linha: LinhaDePerfil): Perfil {
  return {
    nome: linha.nome ?? "",
    cpf: linha.cpf ?? "",
    whatsapp: linha.whatsapp ?? "",
    chavePix: linha.chave_pix ?? "",
  };
}

export function linhaDoPerfil(id: string, perfil: Perfil) {
  return {
    id,
    nome: perfil.nome || null,
    cpf: perfil.cpf || null,
    whatsapp: perfil.whatsapp || null,
    chave_pix: perfil.chavePix || null,
  };
}

// As regras do formulário "Meus dados"
export const esquemaPerfil = z
  .object({
    nome: z.string().trim().min(3, { error: "Escreva seu nome completo." }),
    cpf: z.string().refine(cpfValido, { error: "CPF inválido. Confira os números." }),
    whatsapp: z.string().refine(telefoneValido, { error: "Coloque o WhatsApp com DDD." }),
    chavePix: z.string().trim(),
  })
  .transform((dados) => ({ ...dados, cpf: somenteDigitos(dados.cpf), whatsapp: somenteDigitos(dados.whatsapp) }));

export async function buscarPerfil(id: string): Promise<Perfil | null> {
  const { data, error } = await supabase
    .from("perfis")
    .select("nome, cpf, whatsapp, chave_pix")
    .eq("id", id)
    .maybeSingle();
  if (error) console.warn("Não deu para buscar o perfil:", error.message);
  return data ? perfilDaLinha(data) : null;
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
