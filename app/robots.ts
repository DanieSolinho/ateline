import type { MetadataRoute } from "next";
import { urlCompleta } from "@/lib/site";

export const dynamic = "force-static";

// Carrinho, checkout e conta são pessoais: não precisam aparecer no Google
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: ["/carrinho/", "/checkout/", "/conta/"] },
    sitemap: urlCompleta("/sitemap.xml").replace(/\/$/, ""),
  };
}
