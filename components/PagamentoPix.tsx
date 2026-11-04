"use client";

import { useEffect, useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { diaEHora } from "@/lib/calendario";
import { linkWhatsApp } from "@/lib/contato";
import { formatarPreco } from "@/lib/formatar";
import { pixCopiaECola } from "@/lib/pix";

type Props = {
  numero: string; // número do pedido (vai no Pix para a loja achar)
  valor: number;
  guardadoAte?: string | null;
};

// Pagamento do sinal por Pix direto na conta da loja: QR Code + copia e cola
export function PagamentoPix({ numero, valor, guardadoAte }: Props) {
  const codigo = pixCopiaECola({ valor, pedido: numero });
  const [qr, setQr] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let ativo = true;
    // A biblioteca do QR Code só é baixada aqui, na hora de pagar
    import("qrcode")
      .then(({ toString }) =>
        toString(codigo, { type: "svg", margin: 1, errorCorrectionLevel: "M" }),
      )
      .then((svg) => {
        if (ativo) setQr(svg);
      })
      .catch(() => {
        // sem QR Code: o copia e cola continua funcionando
      });
    return () => {
      ativo = false;
    };
  }, [codigo]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
    } catch {
      // sem permissão: o código continua visível para copiar à mão
    }
  }

  const comprovante = linkWhatsApp(
    `Olá! Paguei o sinal de ${formatarPreco(valor)} do pedido ${numero} por Pix. Segue o comprovante.`,
  );

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-start gap-5">
        {qr ? (
          <div
            role="img"
            aria-label={`QR Code do Pix de ${formatarPreco(valor)} para a Ateline`}
            className="size-48 shrink-0 rounded-xl border border-linha bg-white p-2 [&>svg]:size-full"
            dangerouslySetInnerHTML={{ __html: qr }}
          />
        ) : (
          <div className="grid size-48 shrink-0 place-items-center rounded-xl bg-blush text-sm text-ameixa-suave">
            Gerando QR Code…
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
          <dl className="flex flex-col gap-1">
            <div>
              <dt className="inline text-ameixa-suave">Valor: </dt>
              <dd className="inline font-display text-2xl font-bold">
                {formatarPreco(valor)}
              </dd>
            </div>
            <div>
              <dt className="inline text-ameixa-suave">Recebedor: </dt>
              <dd className="inline font-semibold">
                Ateline Ateliê · CNPJ 28.809.419/0001-08
              </dd>
            </div>
            <div>
              <dt className="inline text-ameixa-suave">Pedido: </dt>
              <dd className="inline font-semibold">{numero}</dd>
            </div>
            {guardadoAte && (
              <div>
                <dt className="inline text-ameixa-suave">Pague até: </dt>
                <dd className="inline font-semibold">
                  {diaEHora(guardadoAte)}
                </dd>
              </div>
            )}
          </dl>
          <p className="text-ameixa-suave">
            No app do seu banco, escolha <strong>Pix → Ler QR Code</strong> ou{" "}
            <strong>Pix copia e cola</strong>. O valor já vem preenchido.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`pix-${numero}`} className="text-sm font-bold">
          Pix copia e cola
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id={`pix-${numero}`}
            readOnly
            value={codigo}
            onFocus={(evento) => evento.target.select()}
            className="h-12 min-w-0 flex-1 rounded-xl border border-ameixa/30 bg-white px-3 font-mono text-xs"
          />
          <button
            type="button"
            onClick={copiar}
            className="flex h-12 items-center gap-2 rounded-xl bg-framboesa px-5 font-bold text-white hover:bg-framboesa-escura"
          >
            {copiado ? (
              <Check size={18} aria-hidden />
            ) : (
              <Copy size={18} aria-hidden />
            )}
            {copiado ? "Código copiado" : "Copiar código"}
          </button>
        </div>
        <span role="status" className="sr-only">
          {copiado ? "Código do Pix copiado" : ""}
        </span>
      </div>

      {comprovante && (
        <a
          href={comprovante}
          target="_blank"
          rel="noopener"
          className="flex items-center gap-2 self-start text-sm font-bold text-folha underline"
        >
          <MessageCircle size={16} aria-hidden /> Já paguei: mandar o
          comprovante pelo WhatsApp
        </a>
      )}
      <p className="text-xs text-ameixa-suave">
        A Ateline confere o Pix e confirma o seu pedido. A confirmação aparece
        em Minha conta.
      </p>
    </div>
  );
}
