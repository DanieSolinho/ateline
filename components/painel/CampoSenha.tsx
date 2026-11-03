"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = {
  id: string;
  rotulo: string;
  autoComplete: "current-password" | "new-password";
  valor: string;
  aoMudar: (valor: string) => void;
  invalido?: boolean;
  descricao?: string; // id do texto de erro ou de ajuda
};

// Campo de senha com o botão de mostrar/esconder (ajuda muito digitando no celular)
export function CampoSenha({ id, rotulo, autoComplete, valor, aoMudar, invalido, descricao }: Props) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-bold">
        {rotulo}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visivel ? "text" : "password"}
          autoComplete={autoComplete}
          value={valor}
          onChange={(evento) => aoMudar(evento.target.value)}
          aria-invalid={invalido || undefined}
          aria-describedby={descricao}
          className="h-12 w-full rounded-xl border border-ameixa/30 bg-white pr-12 pl-3 aria-invalid:border-alerta"
        />
        <button
          type="button"
          onClick={() => setVisivel((atual) => !atual)}
          aria-label={visivel ? `Esconder ${rotulo.toLowerCase()}` : `Mostrar ${rotulo.toLowerCase()}`}
          aria-pressed={visivel}
          className="absolute top-0.5 right-0.5 grid size-11 place-items-center rounded-xl text-ameixa-suave hover:text-ameixa"
        >
          {visivel ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
        </button>
      </div>
    </div>
  );
}
