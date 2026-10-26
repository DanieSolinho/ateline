import { supabase } from "@/lib/supabase";

// Para onde o link do e-mail leva de volta (no Mac: localhost; no ar: o GitHub Pages)
export function enderecoDeVolta(origem: string, basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""): string {
  return `${origem}${basePath}/conta/`;
}

// Traduz as mensagens de erro mais comuns do login
export function mensagemDeErroDoLogin(mensagem: string): string {
  const texto = mensagem.toLowerCase();
  if (texto.includes("rate limit") || texto.includes("security purposes")) {
    return "Pedimos muitos links em pouco tempo. Espere alguns minutos e tente de novo.";
  }
  if (texto.includes("invalid") && texto.includes("email")) return "Esse e-mail parece inválido. Confira e tente de novo.";
  return "Não conseguimos enviar o link agora. Tente de novo em instantes.";
}

// Envia o "link mágico": a cliente clica no e-mail e entra, sem senha.
// Devolve null se deu certo, ou a mensagem de erro.
export async function enviarLinkDeEntrada(email: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: enderecoDeVolta(window.location.origin) },
  });
  return error ? mensagemDeErroDoLogin(error.message) : null;
}

export async function sair() {
  await supabase.auth.signOut();
}
