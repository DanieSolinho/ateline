import { createClient } from "@supabase/supabase-js";

// Endereço e chave PÚBLICA do projeto (vêm do arquivo .env).
// A chave pública só consegue o que as regras de segurança (RLS) do banco permitem.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !chave) {
  throw new Error("Faltam NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no arquivo .env");
}

export const supabase = createClient(url, chave, {
  auth: {
    persistSession: true, // a cliente continua logada ao fechar e abrir o site
    detectSessionInUrl: true, // ao voltar pelo link do e-mail, o login é lido do endereço
    // "implicit": o link do e-mail funciona mesmo se for aberto em outro navegador do celular
    flowType: "implicit",
  },
});
