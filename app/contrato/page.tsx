import type { Metadata } from "next";
import { PaginaDeTexto } from "@/components/PaginaDeTexto";
import { urlCompleta } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contrato de locação",
  description:
    "Os principais pontos do contrato de locação de bolos cenográficos da Ateline.",
  alternates: { canonical: urlCompleta("/contrato") },
};

export default function ContratoPage() {
  return (
    <PaginaDeTexto
      titulo="Contrato de locação"
      resumo="Os principais pontos do contrato que você aceita ao reservar. A versão completa, com seus dados e datas, chega por e-mail depois da reserva."
    >
      <section>
        <h2>Retirada e devolução</h2>
        <ul>
          <li>A retirada e a devolução são feitas na loja, na Rua Cândido Benício, 2967, bloco P, loja G — Praça Seca.</li>
          <li>Não aceitamos aplicativos de entrega.</li>
          <li>Não entramos em contato para lembrar da retirada. Se a peça não for retirada, o valor pago não é devolvido.</li>
        </ul>
      </section>

      <section>
        <h2>Pagamento</h2>
        <ul>
          <li>Sinal de 50% do aluguel no momento da reserva.</li>
          <li>Restante e taxa de segurança até o dia da retirada, ou nele.</li>
        </ul>
      </section>

      <section>
        <h2>Taxa de segurança</h2>
        <ul>
          <li>Não é devolvida em caso de devolução fora do prazo ou de avarias como furos, cola e sujeira.</li>
          <li>Se o bolo tiver vela acoplada e ela não voltar, são descontados R$ 10,00.</li>
          <li>A devolução é feita por Pix, na chave informada na reserva, depois que a peça é conferida.</li>
        </ul>
      </section>

      <section>
        <h2>Cuidados com a peça</h2>
        <ul>
          <li>Não use cola, água, tinta ou outro material nas peças.</li>
          <li>Devolva a peça limpa e em bom estado.</li>
          <li>Havendo dano, é feito um orçamento do conserto, pago por quem alugou.</li>
          <li>Atraso na devolução: multa de 30% por dia sobre o valor total.</li>
          <li>Em caso de perda, é cobrado o valor integral da peça, informado no contrato.</li>
        </ul>
      </section>
    </PaginaDeTexto>
  );
}
