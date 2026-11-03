"use client";

import { useState } from "react";
import { buscarCep, cepValido, formatarCep } from "@/lib/cep";
import type { CampoDoEndereco } from "@/lib/endereco";

const estiloCampo = "h-12 w-full rounded-xl border border-ameixa/30 bg-white px-3 aria-invalid:border-alerta";

type Props = {
  inicial?: Partial<Record<CampoDoEndereco, string | undefined>>; // para já vir preenchido
  erros?: Partial<Record<string, string>>;
};

// CEP, rua, número, complemento, bairro, cidade e estado. O CEP preenche rua, bairro, cidade e estado.
// Usado no checkout e em "Meus dados". Para trocar o preenchimento inicial, mude o "key" do componente.
export function CamposDeEndereco({ inicial = {}, erros = {} }: Props) {
  const [endereco, setEndereco] = useState({
    cep: formatarCep(inicial.cep ?? ""),
    rua: inicial.rua ?? "",
    bairro: inicial.bairro ?? "",
    cidade: inicial.cidade ?? "",
    uf: inicial.uf ?? "",
  });
  const [situacaoCep, setSituacaoCep] = useState<"" | "buscando" | "nao-encontrado">("");

  async function aoDigitarCep(valor: string) {
    const cep = formatarCep(valor);
    setEndereco((atual) => ({ ...atual, cep }));
    if (!cepValido(cep)) return setSituacaoCep("");

    setSituacaoCep("buscando");
    const achado = await buscarCep(cep);
    if (achado) {
      setEndereco((atual) => ({ ...atual, ...achado }));
      setSituacaoCep("");
    } else {
      setSituacaoCep("nao-encontrado");
    }
  }

  const mudar = (campo: keyof typeof endereco) => (evento: React.ChangeEvent<HTMLInputElement>) =>
    setEndereco((atual) => ({ ...atual, [campo]: campo === "uf" ? evento.target.value.toUpperCase() : evento.target.value }));

  return (
    <div className="grid gap-4 sm:grid-cols-6">
      <div className="sm:col-span-2">
        <Campo nome="cep" rotulo="CEP" erro={erros.cep}>
          <input id="cep" name="cep" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000"
            value={endereco.cep} onChange={(evento) => aoDigitarCep(evento.target.value)}
            aria-invalid={!!erros.cep} aria-describedby="cep-erro cep-situacao" className={estiloCampo} />
          <p id="cep-situacao" aria-live="polite" className="text-sm text-ameixa-suave">
            {situacaoCep === "buscando" && "Buscando endereço…"}
            {situacaoCep === "nao-encontrado" && "Não achamos esse CEP. Preencha o endereço abaixo."}
          </p>
        </Campo>
      </div>
      <div className="sm:col-span-4">
        <Campo nome="rua" rotulo="Rua" erro={erros.rua}>
          <input id="rua" name="rua" autoComplete="address-line1" value={endereco.rua} onChange={mudar("rua")}
            aria-invalid={!!erros.rua} aria-describedby="rua-erro" className={estiloCampo} />
        </Campo>
      </div>
      <div className="sm:col-span-2">
        <Campo nome="numero" rotulo="Número" erro={erros.numero}>
          <input id="numero" name="numero" defaultValue={inicial.numero} aria-invalid={!!erros.numero}
            aria-describedby="numero-erro" className={estiloCampo} />
        </Campo>
      </div>
      <div className="sm:col-span-4">
        <Campo nome="complemento" rotulo="Complemento (opcional)">
          <input id="complemento" name="complemento" autoComplete="address-line2" defaultValue={inicial.complemento}
            className={estiloCampo} />
        </Campo>
      </div>
      <div className="sm:col-span-2">
        <Campo nome="bairro" rotulo="Bairro" erro={erros.bairro}>
          <input id="bairro" name="bairro" value={endereco.bairro} onChange={mudar("bairro")}
            aria-invalid={!!erros.bairro} aria-describedby="bairro-erro" className={estiloCampo} />
        </Campo>
      </div>
      <div className="sm:col-span-3">
        <Campo nome="cidade" rotulo="Cidade" erro={erros.cidade}>
          <input id="cidade" name="cidade" autoComplete="address-level2" value={endereco.cidade} onChange={mudar("cidade")}
            aria-invalid={!!erros.cidade} aria-describedby="cidade-erro" className={estiloCampo} />
        </Campo>
      </div>
      <div>
        <Campo nome="uf" rotulo="Estado" erro={erros.uf}>
          <input id="uf" name="uf" autoComplete="address-level1" maxLength={2} value={endereco.uf} onChange={mudar("uf")}
            aria-invalid={!!erros.uf} aria-describedby="uf-erro" className={`${estiloCampo} uppercase`} />
        </Campo>
      </div>
    </div>
  );
}

function Campo({ nome, rotulo, erro, children }: {
  nome: string;
  rotulo: string;
  erro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={nome} className="font-bold">{rotulo}</label>
      {children}
      {erro && <p id={`${nome}-erro`} className="text-sm font-semibold text-alerta">{erro}</p>}
    </div>
  );
}
