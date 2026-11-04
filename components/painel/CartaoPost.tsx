"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, Check, Copy, Download, Send, Trash2, Undo2 } from "lucide-react";
import { diaEHora } from "@/lib/calendario";
import { desenharPost, nomeDaImagem } from "@/lib/imagemDoPost";
import {
  doCampoDeData,
  LIMITE_DA_LEGENDA,
  momentoDoAgendado,
  paraCampoDeData,
  salvarPost,
  type MudancaDoPost,
  type Post,
} from "@/lib/instagram";

type Props = { post: Post; aoMudar: () => void };

// Um post: prévia da imagem, legenda e as ações de cada etapa (aprovar, postar, marcar como publicado)
export function CartaoPost({ post, aoMudar }: Props) {
  const [titulo, setTitulo] = useState(post.titulo);
  const [texto, setTexto] = useState(post.dados.texto ?? "");
  const [legenda, setLegenda] = useState(post.legenda);
  const [quando, setQuando] = useState(paraCampoDeData(post.agendadoPara));
  const [imagem, setImagem] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const editavel = post.status === "rascunho";
  const dados = post.tipo === "livre" ? { ...post.dados, texto } : post.dados;
  const id = `post-${post.id}`;

  // Redesenha a prévia quando o título ou a frase mudam
  useEffect(() => {
    let ativo = true;
    const espera = setTimeout(() => {
      desenharPost({ tipo: post.tipo, titulo, dados }).then((tela) => {
        if (ativo) setImagem(tela.toDataURL("image/png"));
      });
    }, 250);
    return () => {
      ativo = false;
      clearTimeout(espera);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- "dados" muda junto com "texto"
  }, [post.tipo, titulo, texto]);

  async function salvar(mudanca: MudancaDoPost, mensagem: string) {
    setEnviando(true);
    const falha = await salvarPost(post.id, mudanca);
    setEnviando(false);
    if (falha) return setAviso({ tipo: "erro", texto: falha });
    setAviso({ tipo: "ok", texto: mensagem });
    aoMudar();
  }

  function aprovar() {
    const agendado = doCampoDeData(quando);
    if (!agendado) return setAviso({ tipo: "erro", texto: "Escolha o dia e a hora do post para agendar." });
    if (!legenda.trim()) return setAviso({ tipo: "erro", texto: "Escreva a legenda antes de aprovar." });
    void salvar({ titulo, legenda, dados, status: "agendado", agendado_para: agendado }, "Aprovado e agendado.");
  }

  async function copiarLegenda() {
    try {
      await navigator.clipboard.writeText(post.legenda);
      setAviso({ tipo: "ok", texto: "Legenda copiada. Agora é só colar no Instagram." });
    } catch {
      setAviso({ tipo: "erro", texto: "Não deu para copiar. Selecione a legenda e copie à mão." });
    }
  }

  function baixarImagem() {
    if (!imagem) return;
    const link = document.createElement("a");
    link.href = imagem;
    link.download = nomeDaImagem({ id: post.id, titulo });
    link.click();
  }

  const momento = post.status === "agendado" && post.agendadoPara ? momentoDoAgendado(post.agendadoPara, new Date()) : null;

  return (
    <article
      aria-labelledby={`${id}-titulo`}
      className={`grid gap-5 rounded-2xl bg-white p-4 md:grid-cols-[240px_1fr] ${momento === "postar" ? "border-2 border-framboesa" : "border border-linha"}`}
    >
      <div className="flex flex-col gap-2">
        {imagem ? (
          // eslint-disable-next-line @next/next/no-img-element -- imagem gerada na hora, no navegador
          <img src={imagem} alt={`Prévia da imagem do post: ${titulo}`} className="w-full rounded-xl border border-linha" />
        ) : (
          <div className="grid aspect-[4/5] place-items-center rounded-xl bg-blush text-sm text-ameixa-suave">Montando a imagem…</div>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id={`${id}-titulo`} className="font-bold">
            {titulo}
          </h3>
          {momento === "postar" && (
            <span className="rounded-full bg-framboesa px-3 py-1 text-xs font-bold text-white">Hora de postar</span>
          )}
          {momento === "hoje" && <span className="rounded-full bg-pessego px-3 py-1 text-xs font-bold">Hoje</span>}
        </div>
        <p className="text-xs text-ameixa-suave">
          Criado por {post.criadoPor ?? "equipe"}
          {post.aprovadoPor && ` · aprovado por ${post.aprovadoPor}`}
          {post.agendadoPara && post.status === "agendado" && ` · para ${diaEHora(post.agendadoPara)}`}
          {post.publicadoEm && ` · publicado em ${diaEHora(post.publicadoEm)}`}
        </p>

        {editavel && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-titulo-campo`} className="text-sm font-bold">
              Título na imagem
            </label>
            <input
              id={`${id}-titulo-campo`}
              value={titulo}
              maxLength={80}
              onChange={(evento) => setTitulo(evento.target.value)}
              className="h-11 rounded-xl border border-ameixa/30 px-3"
            />
          </div>
        )}
        {editavel && post.tipo === "livre" && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-texto`} className="text-sm font-bold">
              Frase na imagem
            </label>
            <input
              id={`${id}-texto`}
              value={texto}
              maxLength={160}
              onChange={(evento) => setTexto(evento.target.value)}
              className="h-11 rounded-xl border border-ameixa/30 px-3"
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-legenda`} className="text-sm font-bold">
            Legenda
          </label>
          <textarea
            id={`${id}-legenda`}
            value={legenda}
            readOnly={!editavel}
            maxLength={LIMITE_DA_LEGENDA}
            rows={editavel ? 8 : 4}
            onChange={(evento) => setLegenda(evento.target.value)}
            aria-describedby={`${id}-contagem`}
            className={`rounded-xl border border-ameixa/30 p-3 text-sm ${editavel ? "" : "bg-blush/40"}`}
          />
          {editavel && (
            <p id={`${id}-contagem`} className="text-xs text-ameixa-suave">
              {legenda.length} de {LIMITE_DA_LEGENDA} caracteres
            </p>
          )}
        </div>

        {editavel && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-quando`} className="text-sm font-bold">
              Postar em
            </label>
            <input
              id={`${id}-quando`}
              type="datetime-local"
              value={quando}
              onChange={(evento) => setQuando(evento.target.value)}
              className="h-11 self-start rounded-xl border border-ameixa/30 px-3"
            />
          </div>
        )}

        <div role="status" aria-live="polite" className="text-sm font-semibold">
          {aviso && <span className={aviso.tipo === "ok" ? "text-folha" : "text-alerta"}>{aviso.texto}</span>}
        </div>

        <div className="flex flex-wrap gap-2">
          {post.status === "rascunho" && (
            <>
              <Botao principal onClick={aprovar} disabled={enviando} icone={<CalendarCheck size={18} aria-hidden />}>
                Aprovar e agendar
              </Botao>
              <Botao
                onClick={() => salvar({ titulo, legenda, dados, agendado_para: doCampoDeData(quando) }, "Alterações salvas.")}
                disabled={enviando}
              >
                Salvar rascunho
              </Botao>
              <Botao
                onClick={() => salvar({ status: "descartado" }, "Rascunho descartado.")}
                disabled={enviando}
                icone={<Trash2 size={18} aria-hidden />}
              >
                Descartar
              </Botao>
            </>
          )}
          {post.status === "agendado" && (
            <>
              <Botao principal={momento === "postar"} onClick={copiarLegenda} icone={<Copy size={18} aria-hidden />}>
                Copiar legenda
              </Botao>
              <Botao onClick={baixarImagem} disabled={!imagem} icone={<Download size={18} aria-hidden />}>
                Baixar imagem
              </Botao>
              <Botao
                onClick={() => salvar({ status: "publicado" }, "Marcado como publicado.")}
                disabled={enviando}
                icone={<Send size={18} aria-hidden />}
              >
                Já postei
              </Botao>
              <Botao
                onClick={() => salvar({ status: "rascunho" }, "Voltou para rascunho.")}
                disabled={enviando}
                icone={<Undo2 size={18} aria-hidden />}
              >
                Desfazer aprovação
              </Botao>
            </>
          )}
          {post.status === "publicado" && (
            <p className="flex items-center gap-1.5 text-sm font-bold text-folha">
              <Check size={18} aria-hidden /> Publicado
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function Botao({
  children,
  onClick,
  disabled,
  principal,
  icone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  principal?: boolean;
  icone?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-11 items-center gap-2 rounded-xl px-4 font-bold disabled:opacity-60 ${
        principal ? "bg-framboesa text-white hover:bg-framboesa-escura" : "border-2 border-ameixa hover:bg-blush"
      }`}
    >
      {icone}
      {children}
    </button>
  );
}
