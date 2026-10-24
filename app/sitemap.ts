import type { MetadataRoute } from "next";
import { getVitrine } from "@/lib/catalogo";
import { urlCompleta } from "@/lib/site";

// O site é estático: o sitemap.xml é gerado uma vez, na hora de publicar
export const dynamic = "force-static";

// Lista para o Google das páginas que valem a pena aparecer na busca
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paginas = ["/", "/alugar", "/encomenda", "/comprar", "/como-funciona", "/contrato", "/cancelamento"];
  const bolos = await getVitrine();

  return [
    ...paginas.map((caminho) => ({ url: urlCompleta(caminho), priority: caminho === "/" ? 1 : 0.7 })),
    ...bolos.map((bolo) => ({ url: urlCompleta(`/bolo/${bolo.codigo}`), priority: 0.8 })),
  ];
}
