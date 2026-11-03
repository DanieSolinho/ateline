"use client";

import { useEffect, useId, useState } from "react";
import { Camera, X } from "lucide-react";
import { diaEHora } from "@/lib/calendario";
import { apagarFoto, buscarFotos, enviarFoto, type Foto, type Momento } from "@/lib/fotos";

const NOME_DO_MOMENTO: Record<Momento, string> = { retirada: "saída", devolucao: "volta" };

type Props = {
  pasta: string;
  momento: Momento;
  podeEnviar?: boolean; // false: só mostra (ex.: as fotos da saída no cartão de devolução)
};

// Fotos de um aluguel num momento (saída ou volta): tirar, ver e apagar
export function FotosDaPeca({ pasta, momento, podeEnviar = true }: Props) {
  const [fotos, setFotos] = useState<Foto[] | null>(null); // null = carregando
  const [versao, setVersao] = useState(0);
  const [enviando, setEnviando] = useState(0); // quantas fotos ainda estão subindo
  const [erro, setErro] = useState("");
  const idDoCampo = useId();

  useEffect(() => {
    let ativo = true;
    buscarFotos(pasta, momento).then((achadas) => {
      if (!ativo) return;
      if (achadas === null) setErro("Não deu para carregar as fotos.");
      setFotos(achadas ?? []);
    });
    return () => {
      ativo = false;
    };
  }, [pasta, momento, versao]);

  async function aoEscolher(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = [...(evento.target.files ?? [])];
    evento.target.value = ""; // deixa escolher a mesma foto de novo
    if (arquivos.length === 0) return;
    setErro("");
    setEnviando(arquivos.length);
    for (const [indice, arquivo] of arquivos.entries()) {
      const falha = await enviarFoto(pasta, momento, arquivo, indice);
      if (falha) setErro(falha);
      setEnviando((atual) => atual - 1);
    }
    setVersao((atual) => atual + 1);
  }

  async function apagar(foto: Foto) {
    const falha = await apagarFoto(foto.caminho);
    if (falha) return setErro(falha);
    setVersao((atual) => atual + 1);
  }

  const titulo = `Fotos da ${NOME_DO_MOMENTO[momento]}`;
  if (!podeEnviar && fotos?.length === 0) return null; // nada para comparar

  return (
    <section aria-label={titulo} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold">
          {titulo}
          {fotos && fotos.length > 0 && ` (${fotos.length})`}
        </span>
        {podeEnviar && (
          <>
            <input
              id={idDoCampo}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={aoEscolher}
              className="peer sr-only"
            />
            <label
              htmlFor={idDoCampo}
              className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border-2 border-ameixa px-3 text-sm font-bold hover:bg-blush peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-framboesa"
            >
              <Camera size={18} aria-hidden /> Tirar foto
            </label>
          </>
        )}
      </div>

      <div aria-live="polite" className="text-sm">
        {fotos === null && <span className="text-ameixa-suave">Carregando fotos…</span>}
        {enviando > 0 && <span className="text-ameixa-suave">Enviando {enviando === 1 ? "1 foto" : `${enviando} fotos`}…</span>}
        {erro && <span className="font-semibold text-alerta">{erro}</span>}
        {podeEnviar && fotos?.length === 0 && enviando === 0 && !erro && (
          <span className="text-ameixa-suave">
            Fotografe cada peça de vários lados{momento === "retirada" ? " antes de entregar" : " ao receber"}.
          </span>
        )}
      </div>

      {fotos && fotos.length > 0 && (
        <ul className="grid grid-cols-4 gap-2">
          {fotos.map((foto, indice) => (
            <li key={foto.caminho} className="relative">
              <a href={foto.url} target="_blank" rel="noopener" className="block">
                {/* Link temporário do Storage: não passa pelo otimizador de imagens */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto.url}
                  alt={`Foto ${indice + 1} da ${NOME_DO_MOMENTO[momento]}${foto.tiradaEm ? `, ${diaEHora(foto.tiradaEm)}` : ""}`}
                  loading="lazy"
                  className="aspect-square w-full rounded-lg object-cover"
                />
              </a>
              {podeEnviar && (
                <button
                  type="button"
                  onClick={() => apagar(foto)}
                  aria-label={`Apagar a foto ${indice + 1}`}
                  className="absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-white/90 text-alerta shadow"
                >
                  <X size={16} aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
