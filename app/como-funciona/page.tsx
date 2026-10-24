import type { Metadata } from "next";
import Link from "next/link";
import { ComoFunciona } from "@/components/home/ComoFunciona";
import { PaginaDeTexto } from "@/components/PaginaDeTexto";
import { formatarPreco } from "@/lib/formatar";
import { TAXA_SEGURANCA } from "@/lib/regras";
import { urlCompleta } from "@/lib/site";

export const metadata: Metadata = {
  title: "Como funciona",
  description:
    "Como funciona o aluguel de bolos cenográficos na Ateline: reserva com 50% de sinal, retirada, taxa de segurança e devolução.",
  alternates: { canonical: urlCompleta("/como-funciona") },
};

export default function ComoFuncionaPage() {
  return (
    <>
      <PaginaDeTexto
        titulo="Como funciona o aluguel"
        resumo="Você escolhe e reserva pelo site. Na loja, só retira e devolve."
      >
        <section>
          <h2>Datas de retirada e devolução</h2>
          <p>
            A retirada é no último dia em que a loja abre antes da festa, e a devolução no primeiro dia em que
            ela abre depois. A loja abre de terça a sábado e fecha domingo e segunda.
          </p>
          <ul>
            <li>Festa no sábado ou no domingo: retirada no sábado (ou na sexta) e devolução na terça.</li>
            <li>Festa na sexta: retirada na quinta e devolução no sábado.</li>
            <li>Terça a sexta: retirada a partir das 14h e devolução a partir das 10h. Sábado: das 10h às 14h.</li>
          </ul>
          <p>O site calcula as datas para você assim que você escolhe o dia da festa.</p>
        </section>

        <section>
          <h2>Pagamento</h2>
          <ul>
            <li>Na reserva: sinal de 50% do aluguel, por Pix ou cartão.</li>
            <li>Na retirada: os outros 50% e a taxa de segurança de {formatarPreco(TAXA_SEGURANCA)} por bolo.</li>
          </ul>
        </section>

        <section>
          <h2>Taxa de segurança</h2>
          <p>
            Os {formatarPreco(TAXA_SEGURANCA)} voltam para você na devolução, se o bolo voltar no prazo e sem avarias.
            Descontos: R$ 10 se a vela acoplada não voltar, 30% do aluguel por dia de atraso e o conserto de
            avarias como furos, cola ou sujeira.
          </p>
        </section>

        <section>
          <h2>Personalização</h2>
          <p>
            Nome, idade ou inicial já estão inclusos no aluguel, conforme o bolo. Você escreve na página do bolo,
            na hora de reservar.
          </p>
        </section>

        <p>
          Ficou alguma dúvida? Leia o <Link href="/contrato" className="font-bold text-framboesa underline">contrato
          de locação</Link> ou a <Link href="/cancelamento" className="font-bold text-framboesa underline">política
          de cancelamento</Link>.
        </p>
      </PaginaDeTexto>
      <ComoFunciona />
    </>
  );
}
