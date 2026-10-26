import type { MetadataRoute } from "next";
import { urlCompleta } from "@/lib/site";

export const dynamic = "force-static";

// Carrinho, checkout, conta e painel são pessoais: não precisam aparecer no Google
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: ["/carrinho/", "/checkout/", "/conta/", "/entrar/", "/painel/"] },
    sitemap: urlCompleta("/sitemap.xml").replace(/\/$/, ""),
  };
}
