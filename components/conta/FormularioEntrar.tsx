"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { useSessao } from "@/hooks/useSessao";
import { enviarLinkDeEntrada } from "@/lib/sessao";

const emailValido = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export function FormularioEntrar() {
  const sessao = useSessao();
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviadoPara, setEnviadoPara] = useState<string | null>(null);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const limpo = email.trim().toLowerCase();
    if (!emailValido(limpo)) return setErro("Escreva um e-mail válido, como maria@gmail.com.");

    setErro("");
    setEnviando(true);
    const falha = await enviarLinkDeEntrada(limpo);
    setEnviando(false);
    if (falha) return setErro(falha);
    setEnviadoPara(limpo);
  }

  if (sessao) {
    return (
      <div className="mt-8 flex flex-col items-start gap-3 rounded-2xl bg-blush p-6">
        <p>
          Você já entrou como <strong>{sessao.user.email}</strong>.
        </p>
        <Link href="/conta" className="font-bold text-framboesa hover:underline">
          Ir para Minha conta
        </Link>
      </div>
    );
  }

  if (enviadoPara) {
    return (
      <div role="status" className="mt-8 flex flex-col items-start gap-3 rounded-2xl bg-blush p-6">
        <MailCheck size={36} className="text-folha" aria-hidden />
        <p className="text-lg">
          Enviamos um link para <strong>{enviadoPara}</strong>.
        </p>
        <p className="text-ameixa-suave">
          Abra o e-mail e clique em <strong>Entrar na Ateline</strong>. Se não chegar em alguns minutos, olhe a caixa de
          spam.
        </p>
        <button type="button" onClick={() => setEnviadoPara(null)} className="font-bold text-framboesa underline">
          Usar outro e-mail
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="mt-8 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="font-bold">
          Seu e-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          aria-invalid={!!erro}
          aria-describedby={erro ? "email-erro" : undefined}
          className="h-12 rounded-xl border border-ameixa/30 px-3 aria-invalid:border-alerta"
        />
        {erro && (
          <p id="email-erro" role="alert" className="text-sm font-semibold text-alerta">
            {erro}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={enviando || sessao === undefined}
        className="h-14 rounded-xl bg-framboesa text-lg font-bold text-white hover:bg-framboesa-escura disabled:opacity-60"
      >
        {enviando ? "Enviando…" : "Receber link de entrada"}
      </button>
      <p className="text-sm text-ameixa-suave">
        Com a conta, seus dados ficam salvos e o checkout já vem preenchido em qualquer aparelho.
      </p>
    </form>
  );
}
