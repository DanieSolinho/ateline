import type { Metadata } from "next";
import { PaginaDeTexto } from "@/components/PaginaDeTexto";

export const metadata: Metadata = { title: "Política de cancelamento | Ateline" };

export default function CancelamentoPage() {
  return (
    <PaginaDeTexto
      titulo="Política de cancelamento"
      resumo="O que acontece se você precisar cancelar ou mudar a data da festa."
    >
      <section>
        <h2>Cancelamento</h2>
        <p>
          Em caso de cancelamento, o valor de entrada (sinal) não é devolvido. A taxa de segurança, se já tiver
          sido paga, é devolvida.
        </p>
      </section>

      <section>
        <h2>Mudança de data</h2>
        <p>
          Pelo contrato, em caso de adiamento o valor de entrada também não é devolvido. Mas fale com a gente:
          avaliamos cada caso, conforme a disponibilidade do bolo na nova data.
        </p>
      </section>
    </PaginaDeTexto>
  );
}
