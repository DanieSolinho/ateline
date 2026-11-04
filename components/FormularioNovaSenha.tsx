"use client";

import { useState } from "react";
import { CampoSenha } from "@/components/CampoSenha";
import { definirSenha, problemaDaSenha, SENHA_MINIMA } from "@/lib/senha";

// Criar ou trocar a senha de quem está logada (usado no painel e em Minha conta)
export function FormularioNovaSenha({ email, aoSalvar }: { email: string; aoSalvar: string }) {
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [situacao, setSituacao] = useState<{ tipo: "erro" | "ok"; texto: string } | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function salvar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const problema = problemaDaSenha(senha, confirmacao);
    if (problema) return setSituacao({ tipo: "erro", texto: problema });
    setEnviando(true);
    const falha = await definirSenha(senha);
    setEnviando(false);
    if (falha) return setSituacao({ tipo: "erro", texto: falha });
    setSenha("");
    setConfirmacao("");
    setSituacao({ tipo: "ok", texto: aoSalvar });
  }

  return (
    <form onSubmit={salvar} noValidate className="flex flex-col gap-4">
      {/* Ajuda o gerenciador de senhas do celular a guardar a senha junto com o e-mail certo */}
      <input type="email" autoComplete="username" value={email} readOnly hidden />
      <CampoSenha
        id="senha-nova"
        rotulo="Senha nova"
        autoComplete="new-password"
        valor={senha}
        aoMudar={setSenha}
        descricao="senha-nova-dica"
      />
      <p id="senha-nova-dica" className="-mt-2 text-sm text-ameixa-suave">
        Pelo menos {SENHA_MINIMA} caracteres.
      </p>
      <CampoSenha
        id="senha-confirmacao"
        rotulo="Repita a senha"
        autoComplete="new-password"
        valor={confirmacao}
        aoMudar={setConfirmacao}
      />
      <div role="status" aria-live="polite">
        {situacao && (
          <p className={`text-sm font-semibold ${situacao.tipo === "ok" ? "text-folha" : "text-alerta"}`}>
            {situacao.texto}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={enviando}
        className="h-12 self-start rounded-xl bg-framboesa px-6 font-bold text-white hover:bg-framboesa-escura disabled:opacity-60"
      >
        {enviando ? "Salvando…" : "Salvar senha"}
      </button>
    </form>
  );
}
