import { supabase } from "@/lib/supabase";
import { enderecoDeVolta } from "@/lib/sessao";

// Login com senha: para a equipe (o app do painel no iPhone não recebe o link do e-mail)
// e para as clientes que preferem senha em vez do link.
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
  if (texto.includes("email not confirmed")) {
    return "Falta confirmar o e-mail: abra a mensagem que enviamos e clique no link. Depois entre com a senha.";
  }
  if (texto.includes("already registered") || texto.includes("already been registered")) {
    return "Esse e-mail já tem conta. Entre com a senha ou, se esqueceu, peça uma nova.";
  }
  if (texto.includes("signups not allowed") || texto.includes("signup is disabled")) {
    return "Criar conta com senha está desligado no momento. Use o link por e-mail.";
  }
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

export type ResultadoDoCadastro = { tipo: "logada" } | { tipo: "confirmar" } | { tipo: "erro"; mensagem: string };

// Cria a conta com e-mail e senha.
// Se o Supabase pedir confirmação de e-mail, a conta só vale depois do clique no link ("confirmar").
// Se não pedir, a cliente já sai logada ("logada").
export async function criarContaComSenha(email: string, senha: string): Promise<ResultadoDoCadastro> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password: senha,
    options: { emailRedirectTo: enderecoDeVolta(window.location.origin) },
  });
  if (error) return { tipo: "erro", mensagem: mensagemDeErroDaSenha(error.message) };
  if (data.session) return { tipo: "logada" };
  // Sem sessão e sem "identidades": o e-mail já tinha conta (o Supabase não conta isso, por segurança)
  if (data.user && data.user.identities?.length === 0) {
    return { tipo: "erro", mensagem: mensagemDeErroDaSenha("already registered") };
  }
  return { tipo: "confirmar" };
}

// "Esqueci minha senha": manda um link que faz entrar e leva à parte "Senha" da Minha conta
export async function pedirNovaSenha(email: string): Promise<string | null> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    // "?senha=nova" (e não "#senha"): o Supabase põe o login depois de um "#" no endereço
    redirectTo: `${enderecoDeVolta(window.location.origin)}?senha=nova`,
  });
  if (!error) return null;
  const texto = error.message.toLowerCase();
  if (texto.includes("rate limit") || texto.includes("security purposes")) {
    return "Pedimos muitos e-mails em pouco tempo. Espere alguns minutos e tente de novo.";
  }
  return "Não conseguimos enviar o e-mail agora. Tente de novo em instantes.";
}
