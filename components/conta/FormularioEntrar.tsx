"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { CampoSenha } from "@/components/CampoSenha";
import { useEquipe } from "@/hooks/useEquipe";
import { useSessao } from "@/hooks/useSessao";
import { souDaEquipe } from "@/lib/painel";
import { criarContaComSenha, entrarComSenha, pedirNovaSenha, problemaDaSenha, SENHA_MINIMA } from "@/lib/senha";
import { enviarLinkDeEntrada } from "@/lib/sessao";

const emailValido = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// senha: entrar com e-mail e senha · criar: criar conta com senha · esqueci: pedir senha nova · link: link mágico
type Modo = "senha" | "criar" | "esqueci" | "link";

const TEXTO_DO_MODO: Record<Modo, string> = {
  senha: "Entre com o seu e-mail e a sua senha.",
  criar: "Crie sua conta com e-mail e senha. Seus dados ficam salvos e o checkout já vem preenchido.",
  esqueci: "Mandamos um link para o seu e-mail. Ele faz você entrar e leva direto para criar uma senha nova.",
  link: "Sem senha: mandamos um link para o seu e-mail. É só clicar nele para entrar.",
};

export function FormularioEntrar() {
  const sessao = useSessao();
  const equipe = useEquipe(sessao?.user.id ?? null);
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("senha");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  // Depois de mandar um e-mail (link, confirmação ou senha nova): o que dizer na tela
  const [emailEnviado, setEmailEnviado] = useState<{ para: string; acao: string } | null>(null);

  function mudarModo(novo: Modo) {
    setModo(novo);
    setErro("");
    setSenha("");
    setConfirmacao("");
  }

  // Entrou: a equipe vai direto para o painel; as clientes, para Minha conta
  async function irDepoisDeEntrar() {
    router.push((await souDaEquipe()) ? "/painel" : "/conta");
  }

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const limpo = email.trim().toLowerCase();
    if (!emailValido(limpo)) return setErro("Escreva um e-mail válido, como maria@gmail.com.");
    if (modo === "senha" && !senha) return setErro("Escreva a sua senha.");
    if (modo === "criar") {
      const problema = problemaDaSenha(senha, confirmacao);
      if (problema) return setErro(problema);
    }

    setErro("");
    setEnviando(true);
    if (modo === "senha") {
      const falha = await entrarComSenha(limpo, senha);
      if (falha) {
        setEnviando(false);
        return setErro(falha);
      }
      return irDepoisDeEntrar();
    }
    if (modo === "criar") {
      const resultado = await criarContaComSenha(limpo, senha);
      setEnviando(false);
      if (resultado.tipo === "erro") return setErro(resultado.mensagem);
      if (resultado.tipo === "logada") return router.push("/conta");
      return setEmailEnviado({ para: limpo, acao: "Abra o e-mail e clique no link para confirmar a conta. Depois é só entrar com a senha." });
    }
    const falha = modo === "esqueci" ? await pedirNovaSenha(limpo) : await enviarLinkDeEntrada(limpo);
    setEnviando(false);
    if (falha) return setErro(falha);
    setEmailEnviado({
      para: limpo,
      acao:
        modo === "esqueci"
          ? "Abra o e-mail e clique no link. Você entra na sua conta e cria a senha nova na parte Senha."
          : "Abra o e-mail e clique em Entrar na Ateline.",
    });
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

  if (emailEnviado) {
    return (
      <div role="status" className="mt-8 flex flex-col items-start gap-3 rounded-2xl bg-blush p-6">
        <MailCheck size={36} className="text-folha" aria-hidden />
        <p className="text-lg">
          Enviamos um e-mail para <strong>{emailEnviado.para}</strong>.
        </p>
        <p className="text-ameixa-suave">{emailEnviado.acao} Se não chegar em alguns minutos, olhe a caixa de spam.</p>
        <button
          type="button"
          onClick={() => {
            setEmailEnviado(null);
            mudarModo("senha");
          }}
          className="inline-flex min-h-11 items-center font-bold text-framboesa underline"
        >
          Voltar
        </button>
      </div>
    );
  }

  const comSenha = modo !== "link";
  const textoDoBotao: Record<Modo, [string, string]> = {
    senha: ["Entrar", "Entrando…"],
    criar: ["Criar conta", "Criando…"],
    esqueci: ["Receber link para senha nova", "Enviando…"],
    link: ["Receber link de entrada", "Enviando…"],
  };

  return (
    <div className="mt-6 flex flex-col gap-5">
      {/* Duas formas de entrar */}
      <div role="group" aria-label="Como você quer entrar" className="grid grid-cols-2 gap-1 rounded-2xl bg-blush p-1">
        <button
          type="button"
          aria-pressed={comSenha}
          onClick={() => mudarModo("senha")}
          className={`min-h-11 rounded-xl font-bold ${comSenha ? "bg-white shadow-sm" : "text-ameixa-suave hover:text-ameixa"}`}
        >
          Com senha
        </button>
        <button
          type="button"
          aria-pressed={!comSenha}
          onClick={() => mudarModo("link")}
          className={`min-h-11 rounded-xl font-bold ${!comSenha ? "bg-white shadow-sm" : "text-ameixa-suave hover:text-ameixa"}`}
        >
          Com link no e-mail
        </button>
      </div>

      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        {modo === "criar" && <h2 className="font-display text-2xl font-semibold">Criar conta</h2>}
        {modo === "esqueci" && <h2 className="font-display text-2xl font-semibold">Esqueci minha senha</h2>}
        <p className="text-ameixa-suave">{TEXTO_DO_MODO[modo]}</p>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="font-bold">
            Seu e-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete={modo === "senha" || modo === "criar" ? "username" : "email"}
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            aria-invalid={!!erro}
            aria-describedby={erro ? "entrar-erro" : undefined}
            className="h-12 rounded-xl border border-ameixa/30 px-3 aria-invalid:border-alerta"
          />
        </div>
        {(modo === "senha" || modo === "criar") && (
          <CampoSenha
            id="senha"
            rotulo={modo === "criar" ? "Crie uma senha" : "Senha"}
            autoComplete={modo === "criar" ? "new-password" : "current-password"}
            valor={senha}
            aoMudar={setSenha}
            invalido={!!erro}
            descricao={modo === "criar" ? "senha-dica" : erro ? "entrar-erro" : undefined}
          />
        )}
        {modo === "criar" && (
          <>
            <p id="senha-dica" className="-mt-2 text-sm text-ameixa-suave">
              Pelo menos {SENHA_MINIMA} caracteres.
            </p>
            <CampoSenha
              id="senha-confirmacao"
              rotulo="Repita a senha"
              autoComplete="new-password"
              valor={confirmacao}
              aoMudar={setConfirmacao}
            />
          </>
        )}
        {erro && (
          <p id="entrar-erro" role="alert" className="text-sm font-semibold text-alerta">
            {erro}
          </p>
        )}
        <button
          type="submit"
          disabled={enviando || sessao === undefined}
          className="h-14 rounded-xl bg-framboesa text-lg font-bold text-white hover:bg-framboesa-escura disabled:opacity-60"
        >
          {textoDoBotao[modo][enviando ? 1 : 0]}
        </button>
      </form>

      <div className="flex flex-col items-start gap-0 text-sm">
        {modo === "senha" && (
          <>
            <button type="button" onClick={() => mudarModo("esqueci")} className="inline-flex min-h-11 items-center font-bold text-framboesa underline">
              Esqueci minha senha
            </button>
            <p>
              Ainda não tem conta?{" "}
              <button type="button" onClick={() => mudarModo("criar")} className="inline-flex min-h-11 items-center font-bold text-framboesa underline">
                Criar conta com senha
              </button>
            </p>
          </>
        )}
        {(modo === "criar" || modo === "esqueci") && (
          <button type="button" onClick={() => mudarModo("senha")} className="inline-flex min-h-11 items-center font-bold text-framboesa underline">
            Já tenho senha: entrar
          </button>
        )}
        {modo === "link" && (
          <p className="text-ameixa-suave">
            Com a conta, seus dados ficam salvos e o checkout já vem preenchido em qualquer aparelho.
          </p>
        )}
      </div>
    </div>
  );
}
