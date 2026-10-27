// Copia os preços do catálogo (data/catalogo.json) e as regras do contrato para o Supabase.
// Roda sozinho no GitHub a cada push. Precisa da chave SECRETA, que fica só nos "Secrets" do GitHub.
// Uso manual (raro): SUPABASE_SECRET_KEY=sb_secret_... npm run sincronizar
import { createClient } from "@supabase/supabase-js";
import dados from "@/data/catalogo.json";
import { linhasDePreco } from "@/lib/importar/precos";
import { PERCENTUAL_SINAL, TAXA_SEGURANCA } from "@/lib/regras";
import type { Catalogo } from "@/types/catalogo";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const segredo = process.env.SUPABASE_SECRET_KEY;
  if (!url || !segredo) {
    console.error("❌ Falta a chave SUPABASE_SECRET_KEY. No GitHub: Settings > Secrets and variables > Actions.");
    process.exit(1);
  }

  // A chave secreta passa por cima das regras de segurança (RLS): só use em script, nunca no site
  const supabase = createClient(url, segredo, { auth: { persistSession: false } });
  const agora = new Date().toISOString();

  const linhas = linhasDePreco(dados as Catalogo).map((linha) => ({ ...linha, atualizado_em: agora }));
  const { error: erroPrecos } = await supabase.from("precos").upsert(linhas);
  if (erroPrecos) throw new Error(`Preços: ${erroPrecos.message}`);

  // O que saiu da planilha fica inativo (não apagamos, para os pedidos antigos continuarem fazendo sentido)
  const codigos = linhas.map((linha) => `"${linha.codigo}"`).join(",");
  const { error: erroAntigos } = await supabase
    .from("precos")
    .update({ ativo: false, atualizado_em: agora })
    .not("codigo", "in", `(${codigos})`);
  if (erroAntigos) throw new Error(`Preços antigos: ${erroAntigos.message}`);

  const { error: erroRegras } = await supabase.from("regras").upsert([
    { chave: "TAXA_SEGURANCA", valor: TAXA_SEGURANCA, atualizado_em: agora },
    { chave: "PERCENTUAL_SINAL", valor: PERCENTUAL_SINAL, atualizado_em: agora },
  ]);
  if (erroRegras) throw new Error(`Regras: ${erroRegras.message}`);

  const ativos = linhas.filter((linha) => linha.ativo).length;
  console.log(`✅ Preços sincronizados: ${linhas.length} itens (${ativos} no site) e 2 regras.`);
}

main().catch((erro) => {
  console.error("❌", erro.message);
  process.exit(1);
});
