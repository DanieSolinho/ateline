"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { CampoSenha } from "@/components/CampoSenha";
import { useEquipe } from "@/hooks/useEquipe";
import { useSessao } from "@/hooks/useSessao";
import { souDaEquipe } from "@/lib/painel";
import { entrarComSenha } from "@/lib/senha";
import { enviarLinkDeEntrada } from "@/lib/sessao";

const emailValido = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export function FormularioEntrar() {
  const sessao = useSessao();
  const equipe = useEquipe(sessao?.user.id ?? null);
  const router = useRouter();
  // "link": a cliente recebe o link por e-mail (o padrão). "senha": para quem já criou uma senha (a equipe).
  const [modo, setModo] = useState<"link" | "senha">("link");
  const [senha, setSenha] = useState("");
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviadoPara, setEnviadoPara] = useState<string | null>(null);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const limpo = email.trim().toLowerCase();
    if (!emailValido(limpo)) return setErro("Escreva um e-mail válido, como maria@gmail.com.");

    if (modo === "senha") {
      if (!senha) return setErro("Escreva a sua senha.");
      setErro("");
      setEnviando(true);
      const falha = await entrarComSenha(limpo, senha);
      if (falha) {
        setEnviando(false);
        return setErro(falha);
      }
      // Entrou: a equipe vai direto para o painel; quem não é da equipe, para Minha conta
      router.push((await souDaEquipe()) ? "/painel" : "/conta");
      return;
    }

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
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {equipe && (
            <Link href="/painel" className="font-bold text-framboesa hover:underline">
              Ir para o painel da loja
            </Link>
          )}
          <Link href="/conta" className="font-bold text-framboesa hover:underline">
            Ir para Minha conta
          </Link>
        </div>
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

  function trocarModo() {
    setModo((atual) => (atual === "link" ? "senha" : "link"));
    setErro("");
    setSenha("");
  }

  return (
    <form onSubmit={enviar} noValidate className="mt-2 flex flex-col gap-4">
      <p className="text-lg text-ameixa-suave">
        {modo === "link"
          ? "Sem senha: mandamos um link para o seu e-mail. É só clicar nele para entrar."
          : "Entre com o e-mail e a senha que você criou no painel da loja."}
      </p>
      <div className="mt-4 flex flex-col gap-1.5">
        <label htmlFor="email" className="font-bold">
          Seu e-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete={modo === "senha" ? "username" : "email"}
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          aria-invalid={!!erro}
          aria-describedby={erro ? "email-erro" : undefined}
          className="h-12 rounded-xl border border-ameixa/30 px-3 aria-invalid:border-alerta"
        />
      </div>
      {modo === "senha" && (
        <CampoSenha
          id="senha"
          rotulo="Senha"
          autoComplete="current-password"
          valor={senha}
          aoMudar={setSenha}
          invalido={!!erro}
          descricao={erro ? "email-erro" : undefined}
        />
      )}
      {erro && (
        <p id="email-erro" role="alert" className="text-sm font-semibold text-alerta">
          {erro}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando || sessao === undefined}
        className="h-14 rounded-xl bg-framboesa text-lg font-bold text-white hover:bg-framboesa-escura disabled:opacity-60"
      >
        {modo === "senha"
          ? enviando
            ? "Entrando…"
            : "Entrar"
          : enviando
            ? "Enviando…"
            : "Receber link de entrada"}
      </button>
      {modo === "link" && (
        <p className="text-sm text-ameixa-suave">
          Com a conta, seus dados ficam salvos e o checkout já vem preenchido em qualquer aparelho.
        </p>
      )}
      <button type="button" onClick={trocarModo} className="self-start text-sm font-bold text-framboesa underline">
        {modo === "link" ? "Sou da equipe da loja: entrar com senha" : "Prefiro receber o link por e-mail"}
      </button>
    </form>
  );
}
