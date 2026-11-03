"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { montarContrato } from "@/lib/contrato";
import type { Pedido } from "@/types/pedido";

// Botão que gera e baixa o contrato de locação do pedido em PDF
export function BotaoContrato({ pedido, destaque = false }: { pedido: Pedido; destaque?: boolean }) {
  const [situacao, setSituacao] = useState<"" | "gerando" | "erro">("");
  const contrato = montarContrato(pedido);
  if (!contrato) return null;

  async function baixar() {
    setSituacao("gerando");
    try {
      const { baixarContrato } = await import("@/lib/contratoPdf");
      await baixarContrato(contrato!);
      setSituacao("");
    } catch (erro) {
      console.warn("Não deu para gerar o contrato:", erro);
      setSituacao("erro");
    }
  }

  return (
    <span className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={baixar}
        disabled={situacao === "gerando"}
        aria-label={`${situacao === "gerando" ? "Gerando…" : "Baixar contrato (PDF)"}, pedido ${pedido.numero}`}
        className={
          destaque
            ? "flex h-12 items-center gap-2 rounded-xl border-2 border-ameixa px-5 font-bold hover:bg-blush disabled:opacity-60"
            : "flex h-11 items-center gap-2 rounded-xl px-3 font-bold text-framboesa hover:bg-blush disabled:opacity-60"
        }
      >
        <FileDown size={18} aria-hidden />
        {situacao === "gerando" ? "Gerando…" : "Baixar contrato (PDF)"}
      </button>
      {situacao === "erro" && (
        <span role="alert" className="text-sm font-semibold text-alerta">
          Não deu para gerar o PDF. Tente de novo.
        </span>
      )}
    </span>
  );
}
