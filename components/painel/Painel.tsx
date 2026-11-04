"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { AbaLembretes } from "@/components/painel/AbaLembretes";
import { AbaListaDeEspera } from "@/components/painel/AbaListaDeEspera";
import { AbaInstagram } from "@/components/painel/AbaInstagram";
import { AbaRelatorios } from "@/components/painel/AbaRelatorios";
import { CartaoDevolucao } from "@/components/painel/CartaoDevolucao";
import { CartaoSaida } from "@/components/painel/CartaoSaida";
import { ListaAguardando } from "@/components/painel/ListaAguardando";
import { useEquipe } from "@/hooks/useEquipe";
import { useHoje } from "@/hooks/useHoje";
import { InstalarPainel } from "@/components/painel/InstalarPainel";
import { EntrarComSenha } from "@/components/painel/EntrarComSenha";
import { SenhaDoApp } from "@/components/painel/SenhaDoApp";
import { useSessao } from "@/hooks/useSessao";
import { usePostsNaHora } from "@/hooks/usePostsNaHora";
import { diaPorExtenso, horarioDaLoja, primeiraMaiuscula } from "@/lib/calendario";
import { somarDias } from "@/lib/encomenda";
import { marcarNavegadorDaEquipe } from "@/lib/visualizacoes";
import {
  agruparReservas,
  buscarAgenda,
  buscarAguardandoSinal,
  separarAgenda,
  type PedidoAguardando,
  type ReservaDaAgenda,
} from "@/lib/painel";

const LOJA_FECHADA = [0, 1]; // domingo e segunda

export function Painel() {
  const sessao = useSessao();
  const equipe = useEquipe(sessao?.user.id ?? null);
  const hoje = useHoje();

  if (sessao === undefined || hoje === null || (sessao && equipe === null)) {
    return <p className="text-ameixa-suave">Carregando…</p>;
  }

  if (!sessao) return <EntrarComSenha />;

  if (!equipe) {
    return (
      <Aviso titulo="Painel da loja">
        Este painel é só para a equipe da Ateline. Você entrou como <strong>{sessao.user.email}</strong>.
      </Aviso>
    );
  }

  return <PainelComAbas hoje={hoje} email={sessao.user.email ?? ""} />;
}

const ABAS = [
  { id: "agenda", nome: "Agenda" },
  { id: "espera", nome: "Lista de espera" },
  { id: "lembretes", nome: "Lembretes" },
  { id: "relatorios", nome: "Relatórios" },
  { id: "instagram", nome: "Instagram" },
] as const;
type Aba = (typeof ABAS)[number]["id"];

function PainelComAbas({ hoje, email }: { hoje: string; email: string }) {
  const [aba, setAba] = useState<Aba>("agenda");
  useEffect(() => marcarNavegadorDaEquipe(), []); // as visitas da loja não entram em "mais vistos"
  const [postsNaHora, atualizarPostsNaHora] = usePostsNaHora();

  // Setas do teclado trocam de aba, como em qualquer sistema de abas
  function aoTeclar(evento: React.KeyboardEvent<HTMLDivElement>) {
    const atual = ABAS.findIndex((a) => a.id === aba);
    let proxima = atual;
    if (evento.key === "ArrowRight") proxima = (atual + 1) % ABAS.length;
    if (evento.key === "ArrowLeft") proxima = (atual - 1 + ABAS.length) % ABAS.length;
    if (proxima === atual) return;
    setAba(ABAS[proxima].id);
    document.getElementById(`aba-${ABAS[proxima].id}`)?.focus();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-bold">Painel da loja</h1>
      <InstalarPainel />
      <SenhaDoApp email={email} />
      <div
        role="tablist"
        aria-label="Painel da loja"
        onKeyDown={aoTeclar}
        className="flex flex-wrap gap-1 rounded-2xl bg-blush p-1"
      >
        {ABAS.map((item) => (
          <button
            key={item.id}
            id={`aba-${item.id}`}
            type="button"
            role="tab"
            aria-selected={aba === item.id}
            aria-controls={`painel-${item.id}`}
            tabIndex={aba === item.id ? 0 : -1}
            onClick={() => setAba(item.id)}
            className={`min-h-11 flex-1 rounded-xl px-4 font-bold ${
              aba === item.id ? "bg-white shadow-sm" : "text-ameixa-suave hover:text-ameixa"
            }`}
          >
            {item.nome}
            {item.id === "instagram" && postsNaHora > 0 && (
              <span className="ml-1.5 rounded-full bg-framboesa px-2 py-0.5 text-xs text-white">
                {postsNaHora}
                <span className="sr-only"> {postsNaHora === 1 ? "post na hora de postar" : "posts na hora de postar"}</span>
              </span>
            )}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`}>
        {aba === "agenda" && <PainelDaEquipe hoje={hoje} />}
        {aba === "espera" && <AbaListaDeEspera />}
        {aba === "lembretes" && <AbaLembretes hoje={hoje} />}
        {aba === "relatorios" && <AbaRelatorios hoje={hoje} />}
        {aba === "instagram" && <AbaInstagram hoje={hoje} aoMudar={atualizarPostsNaHora} />}
      </div>
    </div>
  );
}

function PainelDaEquipe({ hoje }: { hoje: string }) {
  const [dia, setDia] = useState(hoje);
  const [versao, setVersao] = useState(0); // muda para buscar tudo de novo depois de uma ação
  const [agenda, setAgenda] = useState<{ dia: string; reservas: ReservaDaAgenda[] | null } | null>(null);
  const [aguardando, setAguardando] = useState<PedidoAguardando[] | null>(null);

  useEffect(() => {
    let ativo = true;
    buscarAgenda(dia).then((reservas) => ativo && setAgenda({ dia, reservas }));
    buscarAguardandoSinal().then((lista) => ativo && setAguardando(lista));
    return () => {
      ativo = false;
    };
  }, [dia, versao]);

  const atualizar = () => setVersao((v) => v + 1);
  const carregando = agenda?.dia !== dia;
  const grupos = agruparReservas(agenda?.reservas ?? []);
  const { saem, voltam, atrasados } = separarAgenda(grupos, dia);
  const fechada = LOJA_FECHADA.includes(new Date(`${dia}T00:00:00Z`).getUTCDay());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">{dia === hoje ? "Agenda de hoje" : "Agenda"}</h2>
          <p className="text-ameixa-suave">
            {primeiraMaiuscula(diaPorExtenso(dia))} ·{" "}
            {fechada
              ? "loja fechada"
              : `retiradas ${horarioDaLoja(dia, "retirada")}, devoluções ${horarioDaLoja(dia, "devolucao")}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Dia anterior"
            onClick={() => setDia(somarDias(dia, -1))}
            className={estiloBotaoClaro}
          >
            <ChevronLeft size={20} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setDia(hoje)}
            disabled={dia === hoje}
            className={`${estiloBotaoClaro} px-4 font-bold`}
          >
            Hoje
          </button>
          <button
            type="button"
            aria-label="Próximo dia"
            onClick={() => setDia(somarDias(dia, 1))}
            className={estiloBotaoClaro}
          >
            <ChevronRight size={20} aria-hidden />
          </button>
          <button type="button" aria-label="Atualizar" onClick={atualizar} className={estiloBotaoClaro}>
            <RefreshCw size={18} aria-hidden />
          </button>
        </div>
      </div>

      {agenda?.reservas === null && (
        <p role="alert" className="rounded-xl bg-[#fce9df] p-4 font-semibold text-alerta">
          Não deu para carregar a agenda. Confira a internet e clique em atualizar.
        </p>
      )}

      <div aria-busy={carregando} className="grid items-start gap-5 lg:grid-cols-3">
        <Coluna titulo="Sai hoje" quantidade={saem.length} vazio="Nenhuma retirada neste dia.">
          {saem.map((grupo) => (
            <CartaoSaida key={grupo.chave} grupo={grupo} aoMudar={atualizar} />
          ))}
        </Coluna>

        <Coluna titulo="Volta hoje" quantidade={voltam.length + atrasados.length} vazio="Nenhuma devolução neste dia.">
          {atrasados.map((grupo) => (
            <CartaoDevolucao key={grupo.chave} grupo={grupo} hoje={hoje} aoMudar={atualizar} />
          ))}
          {voltam.map((grupo) => (
            <CartaoDevolucao key={grupo.chave} grupo={grupo} hoje={hoje} aoMudar={atualizar} />
          ))}
        </Coluna>

        <Coluna
          titulo="Aguardando sinal"
          quantidade={aguardando?.length ?? 0}
          vazio="Nenhum pedido esperando pagamento."
        >
          {aguardando && <ListaAguardando pedidos={aguardando} aoMudar={atualizar} />}
        </Coluna>
      </div>
    </div>
  );
}

const estiloBotaoClaro =
  "grid h-11 min-w-11 place-items-center rounded-xl border border-ameixa/30 bg-white hover:border-ameixa disabled:opacity-50";

function Coluna({
  titulo,
  quantidade,
  vazio,
  children,
}: {
  titulo: string;
  quantidade: number;
  vazio: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={titulo} className="flex flex-col gap-3 rounded-2xl bg-blush/50 p-4">
      <h2 className="font-display text-xl font-semibold">
        {titulo} <span className="font-medium text-ameixa-suave">· {quantidade}</span>
      </h2>
      {quantidade === 0 ? <p className="text-sm text-ameixa-suave">{vazio}</p> : children}
    </section>
  );
}

function Aviso({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-3 py-10">
      <h1 className="font-display text-3xl font-bold">{titulo}</h1>
      <p className="text-lg">{children}</p>
    </div>
  );
}
