"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CampoSenha } from "@/components/CampoSenha";
import { abertoComoApp } from "@/lib/instalar";
import { entrarComSenha } from "@/lib/senha";

// Login do painel com e-mail e senha da equipe (o que funciona dentro do app instalado no iPhone)
export function EntrarComSenha() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [noApp, setNoApp] = useState(false);

  useEffect(() => {
    // Depois da primeira pintura: no servidor não existe "window"
    const espera = setTimeout(() => setNoApp(abertoComoApp(window)), 0);
    return () => clearTimeout(espera);
  }, []);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!email.trim() || !senha) return setErro("Preencha o e-mail e a senha.");
    setErro("");
    setEnviando(true);
    const falha = await entrarComSenha(email, senha);
    setEnviando(false);
    if (falha) setErro(falha);
    // Deu certo: a sessão muda e o painel aparece sozinho
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-2xl border border-linha p-6">
      <h1 className="font-display text-3xl font-bold">Painel da loja</h1>
      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email-equipe" className="font-bold">
            E-mail da equipe
          </label>
          <input
            id="email-equipe"
            type="email"
            autoComplete="username"
            inputMode="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            className="h-12 rounded-xl border border-ameixa/30 bg-white px-3"
          />
        </div>
        <CampoSenha
          id="senha-equipe"
          rotulo="Senha"
          autoComplete="current-password"
          valor={senha}
          aoMudar={setSenha}
          invalido={!!erro}
          descricao={erro ? "senha-erro" : undefined}
        />
        {erro && (
          <p id="senha-erro" role="alert" className="text-sm font-semibold text-alerta">
            {erro}
          </p>
        )}
        <button
          type="submit"
          disabled={enviando}
          className="h-12 rounded-xl bg-framboesa font-bold text-white hover:bg-framboesa-escura disabled:opacity-60"
        >
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <div className="flex flex-col gap-2 rounded-xl bg-blush p-4 text-sm">
        <strong>Ainda não tem senha?</strong>
        {noApp ? (
          <p>
            Abra o site no Safari (ou no Chrome), entre pelo link do e-mail, vá ao painel e crie a senha em{" "}
            <strong>Senha para o app</strong>. Depois volte aqui.
          </p>
        ) : (
          <p>
            Entre pelo{" "}
            <Link href="/entrar" className="font-bold text-framboesa underline">
              link do e-mail
            </Link>
            , volte ao painel e crie a senha em <strong>Senha para o app</strong>.
          </p>
        )}
      </div>
    </div>
  );
}
