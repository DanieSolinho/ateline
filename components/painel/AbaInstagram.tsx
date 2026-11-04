"use client";

import { useEffect, useState } from "react";
import { CalendarDays, FilePlus2, Sparkles } from "lucide-react";
import dadosDoCatalogo from "@/data/catalogo.json";
import { CartaoPost } from "@/components/painel/CartaoPost";
import { montarVitrine } from "@/lib/catalogo";
import {
  buscarPosts,
  criarPost,
  momentoDoAgendado,
  rascunhoComoFunciona,
  rascunhoDestaque,
  rascunhoLivre,
  rascunhoLivres,
  type Post,
  type Rascunho,
} from "@/lib/instagram";
import { buscarReservas } from "@/lib/reservas";
import { buscarVendidos } from "@/lib/vendas";
import type { Catalogo } from "@/types/catalogo";

const VITRINE = montarVitrine(dadosDoCatalogo as Catalogo);

// Aba Instagram do painel: criar rascunhos, aprovar e agendar, e postar na hora certa
export function AbaInstagram({ hoje, aoMudar }: { hoje: string; aoMudar?: () => void }) {
  const [posts, setPosts] = useState<Post[] | null | undefined>(undefined);
  const [versao, setVersao] = useState(0);
  const [boloDoDestaque, setBoloDoDestaque] = useState(VITRINE[0]?.codigo ?? "");
  const [criando, setCriando] = useState(false);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    let ativo = true;
    buscarPosts().then((achados) => {
      if (ativo) setPosts(achados);
    });
    return () => {
      ativo = false;
    };
  }, [versao]);

  function recarregar() {
    setVersao((atual) => atual + 1);
    aoMudar?.();
  }

  async function criar(gerar: () => Promise<Rascunho | null>) {
    setCriando(true);
    setAviso("");
    const rascunho = await gerar();
    if (!rascunho) {
      setCriando(false);
      return setAviso("Não há bolos livres no próximo sábado para montar esse post.");
    }
    const falha = await criarPost(rascunho);
    setCriando(false);
    if (falha) return setAviso(falha);
    setAviso("Rascunho criado. Ele está em Para aprovar.");
    recarregar();
  }

  async function gerarLivres() {
    const [reservas, vendidos] = await Promise.all([buscarReservas(hoje), buscarVendidos()]);
    const disponiveis = VITRINE.filter((bolo) => !(vendidos ?? []).includes(bolo.codigo));
    return rascunhoLivres(disponiveis, reservas ?? [], hoje);
  }

  if (posts === undefined) return <p className="text-ameixa-suave">Carregando posts…</p>;
  if (posts === null) {
    return (
      <p role="alert" className="rounded-xl bg-[#fce9df] p-4 font-semibold text-alerta">
        Não deu para carregar os posts. Se o arquivo 12 do banco ainda não foi rodado no Supabase, rode e recarregue.
      </p>
    );
  }

  const agora = new Date();
  const paraAprovar = posts.filter((post) => post.status === "rascunho");
  const agendados = posts
    .filter((post) => post.status === "agendado")
    .sort((a, b) => (a.agendadoPara ?? "").localeCompare(b.agendadoPara ?? ""));
  const publicados = posts.filter((post) => post.status === "publicado").slice(0, 6);
  const naHora = agendados.filter((post) => post.agendadoPara && momentoDoAgendado(post.agendadoPara, agora) === "postar");

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-ameixa-suave">
        O painel monta o post com a imagem e a legenda. Depois de revisar, aprove e escolha o dia e a hora. Na hora
        marcada, o post aparece aqui com &quot;Hora de postar&quot;: copie a legenda, baixe a imagem e publique no
        Instagram. A publicação automática entra quando o Instagram da loja for perfil comercial.
      </p>

      {naHora.length > 0 && (
        <p role="status" className="rounded-xl bg-framboesa p-4 font-bold text-white">
          {naHora.length === 1 ? "1 post está" : `${naHora.length} posts estão`} na hora de postar. Veja em Agendados.
        </p>
      )}

      <section aria-labelledby="ig-criar" className="flex flex-col gap-3 rounded-2xl bg-blush p-5">
        <h2 id="ig-criar" className="flex items-center gap-2 font-display text-xl font-semibold">
          <Sparkles size={20} aria-hidden /> Criar rascunho
        </h2>
        <div className="flex flex-wrap items-end gap-2">
          <BotaoCriar onClick={() => criar(gerarLivres)} disabled={criando}>
            Bolos livres no próximo sábado
          </BotaoCriar>
          <BotaoCriar onClick={() => criar(async () => rascunhoComoFunciona())} disabled={criando}>
            Como funciona o aluguel
          </BotaoCriar>
          <BotaoCriar onClick={() => criar(async () => rascunhoLivre())} disabled={criando}>
            Post em branco
          </BotaoCriar>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ig-bolo" className="text-sm font-bold">
              Destaque de um bolo
            </label>
            <select
              id="ig-bolo"
              value={boloDoDestaque}
              onChange={(evento) => setBoloDoDestaque(evento.target.value)}
              className="h-11 rounded-xl border border-ameixa/30 bg-white px-3"
            >
              {VITRINE.map((bolo) => (
                <option key={bolo.codigo} value={bolo.codigo}>
                  {bolo.nome}
                </option>
              ))}
            </select>
          </div>
          <BotaoCriar
            onClick={() =>
              criar(async () => {
                const bolo = VITRINE.find((item) => item.codigo === boloDoDestaque);
                return bolo ? rascunhoDestaque(bolo) : null;
              })
            }
            disabled={criando || !boloDoDestaque}
          >
            Criar destaque
          </BotaoCriar>
        </div>
        <p role="status" aria-live="polite" className="text-sm font-semibold">
          {criando ? "Criando…" : aviso}
        </p>
      </section>

      <Lista titulo="Para aprovar" icone={<FilePlus2 size={20} aria-hidden />} vazio="Nenhum rascunho esperando aprovação.">
        {paraAprovar.map((post) => (
          <CartaoPost key={`${post.id}-${post.status}`} post={post} aoMudar={recarregar} />
        ))}
      </Lista>
      <Lista titulo="Agendados" icone={<CalendarDays size={20} aria-hidden />} vazio="Nenhum post agendado.">
        {agendados.map((post) => (
          <CartaoPost key={`${post.id}-${post.status}`} post={post} aoMudar={recarregar} />
        ))}
      </Lista>
      {publicados.length > 0 && (
        <Lista titulo="Publicados recentemente" vazio="">
          {publicados.map((post) => (
            <CartaoPost key={`${post.id}-${post.status}`} post={post} aoMudar={recarregar} />
          ))}
        </Lista>
      )}
    </div>
  );
}

function BotaoCriar({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-11 rounded-xl border-2 border-ameixa bg-white px-4 font-bold hover:bg-pessego/40 disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function Lista({
  titulo,
  icone,
  vazio,
  children,
}: {
  titulo: string;
  icone?: React.ReactNode;
  vazio: string;
  children: React.ReactNode[];
}) {
  const id = `ig-${titulo.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="flex items-center gap-2 font-display text-xl font-semibold">
        {icone} {titulo} · {children.length}
      </h2>
      {children.length === 0 ? <p className="text-sm text-ameixa-suave">{vazio}</p> : children}
    </section>
  );
}
