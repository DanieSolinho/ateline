import type { Metadata } from "next";
import { PaginaDeTexto } from "@/components/PaginaDeTexto";
import { urlCompleta } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de cancelamento",
  description:
    "Cancelamento e adiamento de reservas de bolos cenográficos na Ateline.",
  alternates: { canonical: urlCompleta("/cancelamento") },
};

export default function CancelamentoPage() {
  return (
    <PaginaDeTexto
      titulo="Política de cancelamento"
      resumo="O que acontece se você precisar cancelar ou mudar a data da festa."
    >
      <section>
        <h2>Cancelamento</h2>
        <p>
          Em caso de cancelamento, o valor de entrada (sinal) não é devolvido. Por cortesia, a Ateline deixa esse
          valor como crédito na loja por 90 dias, para usar em outra locação ou em qualquer produto da loja. A taxa
          de segurança, se já tiver sido paga, é devolvida integralmente.
        </p>
        <p>
          Quem tem conta no site cancela um aluguel em Minha conta, e o crédito aparece lá na hora. Pedidos com
          compra são cancelados pelo WhatsApp.
        </p>
      </section>

      <section>
        <h2>Compra de bolo</h2>
        <p>
          O prazo é de no mínimo 20 dias para produção e despacho, e pode mudar conforme a agenda da loja. Em caso de
          desistência, o sinal não é devolvido; por cortesia, ele fica como crédito na loja por 90 dias.
        </p>
        <p>
          No envio, a Ateline não se responsabiliza por avarias ou furto durante o transporte. A transportadora
          oferece seguro para esses casos.
        </p>
      </section>

      <section>
        <h2>Mudança de data</h2>
        <p>
          Com o sinal pago e pelo menos 15 dias antes da festa, você pode mudar a data em Minha conta, se o bolo
          estiver livre no novo dia. O sinal pago continua valendo para a nova data.
        </p>
        <p>
          Com menos de 15 dias, fale com a gente pelo WhatsApp: avaliamos cada caso, conforme a disponibilidade do
          bolo. Pelo contrato, nesse caso o valor de entrada não é devolvido.
        </p>
      </section>
    </PaginaDeTexto>
  );
}
