import { z } from "zod";
import { errosDoEndereco } from "@/lib/endereco";
import { cpfValido, somenteDigitos, telefoneValido } from "@/lib/validacao";

const texto = z.string().trim().optional();

// O que o pedido tem decide quais campos são obrigatórios
export type ConteudoDoPedido = { temAluguel: boolean; temCompra: boolean };

// As regras do formulário de checkout. O zod confere tudo e devolve as mensagens de erro.
export function criarEsquemaCheckout({ temAluguel, temCompra }: ConteudoDoPedido) {
  return z
    .object({
      nome: z.string().trim().min(3, { error: "Escreva seu nome completo." }),
      cpf: z.string().refine(cpfValido, { error: "CPF inválido. Confira os números." }),
      whatsapp: z.string().refine(telefoneValido, { error: "Coloque o WhatsApp com DDD." }),
      email: z.email({ error: "E-mail inválido." }),
      pagamento: z.enum(["pix", "cartao"], { error: "Escolha Pix ou cartão." }),

      // Aluguel
      chavePix: texto, // para devolver a taxa de segurança
      entrega: z.enum(["retirada", "entrega"]).optional(),
      endereco: texto, // pedidos antigos: endereço da entrega num campo só
      aceite: z.literal("sim").optional(),

      // Compra
      recebimento: z.enum(["retirada", "envio"]).optional(),
      cep: texto,
      rua: texto,
      numero: texto,
      complemento: texto,
      bairro: texto,
      cidade: texto,
      uf: texto,
    })
    .superRefine((dados, contexto) => {
      const erro = (campo: string, mensagem: string) =>
        contexto.addIssue({ code: "custom", path: [campo], message: mensagem });

      if (temAluguel) {
        if ((dados.chavePix ?? "").length < 5) erro("chavePix", "Coloque a chave Pix para a devolução da taxa de segurança.");
        if (!dados.entrega) erro("entrega", "Escolha como vai buscar o bolo alugado.");
        if (dados.aceite !== "sim") erro("aceite", "Para reservar, aceite o contrato de locação.");
      }

      if (temCompra && !dados.recebimento) erro("recebimento", "Escolha como quer receber a compra.");

      // Endereço: sempre no aluguel (vai no contrato) e no envio da compra
      if (temAluguel || dados.recebimento === "envio") {
        for (const [campo, mensagem] of Object.entries(errosDoEndereco(dados))) erro(campo, mensagem);
      }
    })
    .transform((dados) => ({
      ...dados,
      cpf: somenteDigitos(dados.cpf),
      whatsapp: somenteDigitos(dados.whatsapp),
      cep: dados.cep ? somenteDigitos(dados.cep) : undefined,
      uf: dados.uf?.toUpperCase(),
    }));
}

export type DadosCheckout = z.output<ReturnType<typeof criarEsquemaCheckout>>;
export type CampoCheckout = keyof z.input<ReturnType<typeof criarEsquemaCheckout>>;
