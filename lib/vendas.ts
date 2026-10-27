import { supabase } from "@/lib/supabase";

// Códigos das peças vendidas, ou guardadas para uma compra que espera o sinal.
// Devolve null se a busca falhar.
export async function buscarVendidos(): Promise<string[] | null> {
  const { data, error } = await supabase.from("vendas").select("codigo");
  if (error || !data) {
    console.warn("Não deu para buscar as vendas no Supabase:", error?.message);
    return null;
  }
  return [...new Set(data.map((linha) => linha.codigo as string))];
}

// Na hora de publicar, a página já sai sem as peças vendidas naquele momento
export async function getVendidos(): Promise<string[]> {
  return (await buscarVendidos()) ?? [];
}
