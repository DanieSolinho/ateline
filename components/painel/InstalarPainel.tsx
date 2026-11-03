"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { abertoComoApp, eIosOuIpad } from "@/lib/instalar";

// O evento que o Chrome (Android e computador) dispara quando o site pode ser instalado
type PedidoDeInstalacao = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const CHAVE_DISPENSADO = "ateline-painel-instalar-dispensado";
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type Modo = "nada" | "botao" | "ios";

// Convite para instalar o painel na tela inicial do celular
export function InstalarPainel() {
  const [modo, setModo] = useState<Modo>("nada");
  const [pedido, setPedido] = useState<PedidoDeInstalacao | null>(null);

  useEffect(() => {
    // O service worker deixa o painel instalável e mostra uma página amigável quando estiver sem internet
    navigator.serviceWorker
      ?.register(`${base}/painel-sw.js`, { scope: `${base}/painel/` })
      .catch((erro) => console.warn("Service worker não registrado:", erro));

    let dispensado = false;
    try {
      dispensado = localStorage.getItem(CHAVE_DISPENSADO) === "sim";
    } catch {
      // armazenamento bloqueado: mostra o convite mesmo assim
    }
    if (dispensado || abertoComoApp(window)) return;

    const aoPoderInstalar = (evento: Event) => {
      evento.preventDefault(); // guarda o pedido para mostrar o nosso botão
      setPedido(evento as PedidoDeInstalacao);
      setModo("botao");
    };
    const aoInstalar = () => setModo("nada");
    window.addEventListener("beforeinstallprompt", aoPoderInstalar);
    window.addEventListener("appinstalled", aoInstalar);

    // No iPhone não há botão: mostra o caminho pelo Safari (depois da primeira pintura da tela)
    const espera = eIosOuIpad(navigator.userAgent, navigator.maxTouchPoints)
      ? setTimeout(() => setModo("ios"), 0)
      : undefined;

    return () => {
      window.removeEventListener("beforeinstallprompt", aoPoderInstalar);
      window.removeEventListener("appinstalled", aoInstalar);
      clearTimeout(espera);
    };
  }, []);

  function dispensar() {
    try {
      localStorage.setItem(CHAVE_DISPENSADO, "sim");
    } catch {
      // sem armazenamento: some só até recarregar
    }
    setModo("nada");
  }

  async function instalar() {
    if (!pedido) return;
    await pedido.prompt();
    const { outcome } = await pedido.userChoice;
    if (outcome === "accepted") setModo("nada");
    setPedido(null);
  }

  if (modo === "nada") return null;

  return (
    <aside
      aria-label="Instalar o painel no celular"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-framboesa/40 bg-white p-4"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <strong>Use o painel como app</strong>
        {modo === "botao" ? (
          <p className="text-sm text-ameixa-suave">Fica um ícone na tela inicial e o painel abre em tela cheia.</p>
        ) : (
          <p className="text-sm text-ameixa-suave">
            No Safari, toque em <Share size={14} aria-label="Compartilhar" className="inline align-[-2px]" /> e depois em{" "}
            <strong>Adicionar à Tela de Início</strong>.
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        {modo === "botao" && (
          <button
            type="button"
            onClick={instalar}
            className="flex h-11 items-center gap-2 rounded-xl bg-framboesa px-4 font-bold text-white hover:bg-framboesa-escura"
          >
            <Download size={18} aria-hidden /> Instalar
          </button>
        )}
        <button
          type="button"
          onClick={dispensar}
          aria-label="Não mostrar de novo"
          className="grid size-11 place-items-center rounded-full hover:bg-blush"
        >
          <X size={18} aria-hidden />
        </button>
      </div>
    </aside>
  );
}
