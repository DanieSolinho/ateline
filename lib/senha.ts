import { supabase } from "@/lib/supabase";

// Senha da equipe: serve para entrar no painel instalado no celular.
// No iPhone, o app instalado não recebe o login feito pelo link do e-mail (ele abre no Safari).
export const SENHA_MINIMA = 8;

// Confere a senha nova antes de mandar ao Supabase. Devolve null se estiver tudo certo.
export function problemaDaSenha(senha: string, confirmacao: string): string | null {
  if (senha.length < SENHA_MINIMA) return `Use pelo menos ${SENHA_MINIMA} caracteres.`;
  if (senha.trim() !== senha) return "Tire os espaços do começo e do fim da senha.";
  if (senha !== confirmacao) return "As duas senhas estão diferentes. Digite de novo.";
  return null;
}

// Traduz as mensagens do Supabase
export function mensagemDeErroDaSenha(mensagem: string): string {
  const texto = mensagem.toLowerCase();
  if (texto.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (texto.includes("email not confirmed")) return "Esse e-mail ainda não foi confirmado. Entre pelo link do e-mail.";
  if (texto.includes("different from the old")) return "Essa já é a sua senha atual. Escolha outra.";
  if (texto.includes("reauthentication") || texto.includes("recent")) {
    return "Por segurança, entre de novo pelo link do e-mail e crie a senha logo em seguida.";
  }
  if (texto.includes("weak") || texto.includes("at least") || texto.includes("characters")) {
    return "Senha fraca. Use mais caracteres, misturando letras e números.";
  }
  if (texto.includes("rate limit") || texto.includes("too many")) {
    return "Muitas tentativas em pouco tempo. Espere alguns minutos e tente de novo.";
  }
  return "Não deu certo agora. Confira a internet e tente de novo.";
}

// Devolve null se entrou, ou a mensagem de erro
export async function entrarComSenha(email: string, senha: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: senha });
  return error ? mensagemDeErroDaSenha(error.message) : null;
}

// Cria ou troca a senha de quem está logada. Devolve null se deu certo, ou a mensagem de erro.
export async function definirSenha(senha: string): Promise<string | null> {
  const { error } = await supabase.auth.updateUser({ password: senha });
  return error ? mensagemDeErroDaSenha(error.message) : null;
}
