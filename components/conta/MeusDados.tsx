"use client";

import { useState } from "react";
import { usePerfil } from "@/hooks/usePerfil";
import { esquemaPerfil, type Perfil } from "@/lib/perfil";

type Campo = keyof Perfil;
const estiloCampo = "h-12 w-full rounded-xl border border-ameixa/30 bg-white px-3 aria-invalid:border-alerta";

// Formulário "Meus dados" de quem está logada: lê e salva no Supabase
export function MeusDados({ idDaCliente, email }: { idDaCliente: string; email: string }) {
  const { perfil, carregando, salvar } = usePerfil(idDaCliente);
  const [erros, setErros] = useState<Partial<Record<Campo, string>>>({});
  const [situacao, setSituacao] = useState<"" | "salvando" | "salvo" | string>("");

  if (carregando) return <p className="text-ameixa-suave">Carregando seus dados…</p>;

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const valores = Object.fromEntries(new FormData(evento.currentTarget));
    const resultado = esquemaPerfil.safeParse(valores);
    if (!resultado.success) {
      const novos: typeof erros = {};
      for (const problema of resultado.error.issues) novos[problema.path[0] as Campo] ??= problema.message;
      setErros(novos);
      setSituacao("");
      return;
    }
    setErros({});
    setSituacao("salvando");
    const falha = await salvar(resultado.data);
    setSituacao(falha ?? "salvo");
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4 rounded-2xl border border-linha p-5">
      <p className="text-sm text-ameixa-suave">
        E-mail da conta: <strong className="text-ameixa">{email}</strong>
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo nome="nome" rotulo="Nome completo" erro={erros.nome}>
          <input id="nome" name="nome" autoComplete="name" defaultValue={perfil?.nome}
            aria-invalid={!!erros.nome} aria-describedby="nome-erro" className={estiloCampo} />
        </Campo>
        <Campo nome="cpf" rotulo="CPF" erro={erros.cpf}>
          <input id="cpf" name="cpf" inputMode="numeric" placeholder="000.000.000-00" defaultValue={perfil?.cpf}
            aria-invalid={!!erros.cpf} aria-describedby="cpf-erro" className={estiloCampo} />
        </Campo>
        <Campo nome="whatsapp" rotulo="WhatsApp" erro={erros.whatsapp}>
          <input id="whatsapp" name="whatsapp" type="tel" autoComplete="tel" placeholder="(21) 00000-0000"
            defaultValue={perfil?.whatsapp} aria-invalid={!!erros.whatsapp} aria-describedby="whatsapp-erro"
            className={estiloCampo} />
        </Campo>
        <Campo nome="chavePix" rotulo="Chave Pix (devolução da taxa)">
          <input id="chavePix" name="chavePix" defaultValue={perfil?.chavePix} className={estiloCampo} />
        </Campo>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={situacao === "salvando"}
          className="h-12 rounded-xl bg-framboesa px-6 font-bold text-white hover:bg-framboesa-escura disabled:opacity-60"
        >
          {situacao === "salvando" ? "Salvando…" : "Salvar meus dados"}
        </button>
        <p role="status" className="text-sm font-semibold">
          {situacao === "salvo" && <span className="text-folha">Dados salvos.</span>}
          {situacao !== "" && situacao !== "salvo" && situacao !== "salvando" && (
            <span className="text-alerta">{situacao}</span>
          )}
        </p>
      </div>
      <p className="text-sm text-ameixa-suave">Só você vê esses dados. Eles preenchem o checkout dos próximos pedidos.</p>
    </form>
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
