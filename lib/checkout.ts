import { z } from "zod";
import { cpfValido, somenteDigitos, telefoneValido } from "@/lib/validacao";

// As regras do formulário de checkout. O zod confere tudo e devolve as mensagens de erro.
export const esquemaCheckout = z
  .object({
    nome: z.string().trim().min(3, { error: "Escreva seu nome completo." }),
    cpf: z.string().refine(cpfValido, { error: "CPF inválido. Confira os números." }),
    whatsapp: z.string().refine(telefoneValido, { error: "Coloque o WhatsApp com DDD." }),
    email: z.email({ error: "E-mail inválido." }),
    // Para devolver a taxa de segurança depois que a peça volta
    chavePix: z.string().trim().min(5, { error: "Coloque a chave Pix para a devolução da taxa de segurança." }),
    entrega: z.enum(["retirada", "entrega"]),
    endereco: z.string().trim().optional(),
    pagamento: z.enum(["pix", "cartao"], { error: "Escolha Pix ou cartão." }),
    aceite: z.literal("sim", { error: "Para reservar, aceite o contrato de locação." }),
  })
  // Endereço só é obrigatório quando a cliente escolhe entrega
  .refine((dados) => dados.entrega === "retirada" || (dados.endereco ?? "").length >= 10, {
    error: "Escreva o endereço completo para a entrega, com bairro e CEP.",
    path: ["endereco"],
  })
  .transform((dados) => ({
    ...dados,
    cpf: somenteDigitos(dados.cpf),
    whatsapp: somenteDigitos(dados.whatsapp),
  }));

export type DadosCheckout = z.output<typeof esquemaCheckout>;
export type CampoCheckout = keyof z.input<typeof esquemaCheckout>;