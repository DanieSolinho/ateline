"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCarrinho } from "@/hooks/useCarrinho";
import { salvarUltimoPedido } from "@/hooks/useUltimoPedido";
import { diaPorExtenso, primeiraMaiuscula } from "@/lib/calendario";
import { resumoDoCarrinho, totalDoItem } from "@/lib/carrinho";
import { esquemaCheckout, type CampoCheckout } from "@/lib/checkout";
import { formatarPreco } from "@/lib/formatar";
import { calcularPeriodo } from "@/lib/periodo";
import { TAXA_SEGURANCA } from "@/lib/regras";
import type { ItemCarrinho } from "@/types/carrinho";

type Estado = {
  erros: Partial<Record<CampoCheckout, string>>;
  valores: Record<string, string>;
};

const estadoInicial: Estado = { erros: {}, valores: {} };

const estiloCampo = "h-12 rounded-xl border border-ameixa/30 px-3 aria-invalid:border-alerta";

function dia(iso: string) {
  return primeiraMaiuscula(diaPorExtenso(iso));
}

export function FormularioCheckout() {
  const { itens, esvaziar } = useCarrinho();
  const router = useRouter();
  const [entrega, setEntrega] = useState<"retirada" | "entrega">("retirada");

  // Roda quando a cliente envia o formulário
  async function finalizar(_anterior: Estado, formData: FormData): Promise<Estado> {
    const valores = Object.fromEntries(formData) as Record<string, string>;
    const resultado = esquemaCheckout.safeParse(valores);

    if (!resultado.success) {
      const erros: Estado["erros"] = {};
      for (const problema of resultado.error.issues) {
        const campo = problema.path[0] as CampoCheckout;
        erros[campo] ??= problema.message; // guarda só o primeiro erro de cada campo
      }
      return { erros, valores };
    }

    if (!itens || itens.length === 0) return { erros: {}, valores };

    const resumo = resumoDoCarrinho(itens);
    salvarUltimoPedido({
      numero: `ATL-${Date.now().toString().slice(-6)}`,
      criadoEm: new Date().toISOString(),
      cliente: resultado.data,
      itens,
      sinal: resumo.sinal,
      naRetirada: resumo.naRetirada,
    });
    esvaziar();
    router.push("/checkout/confirmado");
    return estadoInicial;
  }

  const [estado, enviar, enviando] = useActionState(finalizar, estadoInicial);
  const { erros, valores } = estado;

  if (itens === null) return <p className="mt-6 text-ameixa-suave">Carregando…</p>;

  if (itens.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl border border-linha p-8">
        <p className="text-lg">Sua reserva está vazia.</p>
        <Link href="/alugar" className="font-bold text-framboesa hover:underline">
          Ver bolos para alugar
        </Link>
      </div>
    );
  }

  const resumo = resumoDoCarrinho(itens);

  return (
    <form action={enviar} noValidate className="mt-8 grid items-start gap-8 md:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-6">
        {Object.keys(erros).length > 0 && (
          <p role="alert" className="rounded-xl bg-[#fce9df] px-4 py-3 font-semibold text-alerta">
            Confira os campos marcados abaixo.
          </p>
        )}

        <fieldset className="flex flex-col gap-4 rounded-2xl border border-linha p-5">
          <legend className="px-2 font-display text-xl font-semibold">Seus dados</legend>
          <Campo nome="nome" rotulo="Nome completo" erro={erros.nome}>
            <input id="nome" name="nome" autoComplete="name" defaultValue={valores.nome}
              aria-invalid={!!erros.nome} aria-describedby="nome-erro" className={estiloCampo} />
          </Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo nome="cpf" rotulo="CPF" erro={erros.cpf}>
              <input id="cpf" name="cpf" inputMode="numeric" placeholder="000.000.000-00" defaultValue={valores.cpf}
                aria-invalid={!!erros.cpf} aria-describedby="cpf-erro" className={estiloCampo} />
            </Campo>
            <Campo nome="whatsapp" rotulo="WhatsApp" erro={erros.whatsapp}>
              <input id="whatsapp" name="whatsapp" type="tel" autoComplete="tel" placeholder="(21) 00000-0000"
                defaultValue={valores.whatsapp} aria-invalid={!!erros.whatsapp} aria-describedby="whatsapp-erro"
                className={estiloCampo} />
            </Campo>
          </div>
          <Campo nome="email" rotulo="E-mail" erro={erros.email}>
            <input id="email" name="email" type="email" autoComplete="email" defaultValue={valores.email}
              aria-invalid={!!erros.email} aria-describedby="email-erro" className={estiloCampo} />
          </Campo>
          <Campo nome="chavePix" rotulo="Chave Pix (para devolver a taxa de segurança)" erro={erros.chavePix}>
            <input id="chavePix" name="chavePix" placeholder="CPF, e-mail, telefone ou chave aleatória"
              defaultValue={valores.chavePix} aria-invalid={!!erros.chavePix}
              aria-describedby="chavePix-erro chavePix-dica" className={estiloCampo} />
            <p id="chavePix-dica" className="text-sm text-ameixa-suave">
              Quando a peça volta conferida, devolvemos os R$ {TAXA_SEGURANCA},00 nessa chave.
            </p>
          </Campo>
        </fieldset>

        <fieldset className="flex flex-col gap-3 rounded-2xl border border-linha p-5">
          <legend className="px-2 font-display text-xl font-semibold">Como você vai buscar?</legend>
          <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${entrega === "retirada" ? "border-2 border-framboesa" : "border-ameixa/30"}`}>
            <input type="radio" name="entrega" value="retirada" checked={entrega === "retirada"}
              onChange={() => setEntrega("retirada")} className="mt-1 size-5 accent-framboesa" />
            <span>
              <strong className="block">Retirar na loja · grátis</strong>
              <span className="text-sm text-ameixa-suave">Rua Cândido Benício, 2967, bloco P, loja G — Praça Seca</span>
            </span>
          </label>
          <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${entrega === "entrega" ? "border-2 border-framboesa" : "border-ameixa/30"}`}>
            <input type="radio" name="entrega" value="entrega" checked={entrega === "entrega"}
              onChange={() => setEntrega("entrega")} className="mt-1 size-5 accent-framboesa" />
            <span>
              <strong className="block">Entrega no endereço</strong>
              <span className="text-sm text-ameixa-suave">Valor de acordo com o bairro, combinado pelo WhatsApp</span>
            </span>
          </label>
          {entrega === "entrega" && (
            <Campo nome="endereco" rotulo="Endereço completo, com bairro e CEP" erro={erros.endereco}>
              <input id="endereco" name="endereco" autoComplete="street-address" defaultValue={valores.endereco}
                aria-invalid={!!erros.endereco} aria-describedby="endereco-erro" className={estiloCampo} />
            </Campo>
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-3 rounded-2xl border border-linha p-5">
          <legend className="px-2 font-display text-xl font-semibold">Contrato de locação</legend>
          <div tabIndex={0} aria-label="Resumo do contrato"
            className="flex max-h-56 flex-col gap-2 overflow-y-auto rounded-xl bg-blush/60 p-4 text-sm">
            {itens.map((item) => {
              const periodo = calcularPeriodo(item.festa);
              return (
                <p key={`${item.codigoBolo}-${item.festa}`}>
                  <strong>{item.nome} (Ref. {item.codigoOpcao})</strong>
                  {item.topo && ` + topo ${item.topo.nome}`}
                  {item.base && ` + base dourada (${item.base.codigo})`}: retirada {dia(periodo.retirada)}, devolução{" "}
                  {dia(periodo.devolucao)}. Locação de {formatarPreco(totalDoItem(item))}.
                  {item.personalizacao && ` Personalização: ${item.personalizacao}.`}
                </p>
              );
            })}
            <p>Sinal de 50% na reserva. O restante e a taxa de segurança de {formatarPreco(TAXA_SEGURANCA)} por peça são pagos na retirada.</p>
            <p>A taxa de segurança não é devolvida em caso de atraso ou avarias como furos, cola e sujeira. Vela acoplada que não volta: desconto de R$ 10,00.</p>
            <p>Não use cola, água, tinta ou outro material nas peças. Atraso na devolução: multa de 30% por dia sobre o valor total.</p>
            <p>Em cancelamento ou adiamento, o valor de entrada não é devolvido.</p>
          </div>
          <label className="flex cursor-pointer items-start gap-3 font-semibold">
            <input type="checkbox" name="aceite" value="sim" defaultChecked={valores.aceite === "sim"}
              aria-invalid={!!erros.aceite} aria-describedby="aceite-erro" className="mt-0.5 size-5 accent-framboesa" />
            Li e aceito o contrato de locação.
          </label>
          {erros.aceite && <p id="aceite-erro" className="text-sm font-semibold text-alerta">{erros.aceite}</p>}
        </fieldset>

        <fieldset className="flex flex-col gap-3 rounded-2xl border border-linha p-5">
          <legend className="px-2 font-display text-xl font-semibold">Pagamento do sinal</legend>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-ameixa/30 p-4 font-bold has-checked:border-2 has-checked:border-framboesa">
              <input type="radio" name="pagamento" value="pix" defaultChecked={valores.pagamento !== "cartao"} className="size-5 accent-framboesa" />
              Pix
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-ameixa/30 p-4 font-bold has-checked:border-2 has-checked:border-framboesa">
              <input type="radio" name="pagamento" value="cartao" defaultChecked={valores.pagamento === "cartao"} className="size-5 accent-framboesa" />
              Cartão
            </label>
          </div>
        </fieldset>
      </div>

      <aside aria-label="Resumo da reserva" className="flex flex-col gap-3 rounded-2xl bg-blush p-5 md:sticky md:top-4">
        <h2 className="font-display text-xl font-semibold">Sua reserva</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {itens.map((item: ItemCarrinho) => (
            <li key={`${item.codigoBolo}-${item.festa}`} className="flex justify-between gap-2">
              <span>{item.nome} · festa {dia(item.festa)}</span>
              <span>{formatarPreco(totalDoItem(item))}</span>
            </li>
          ))}
        </ul>
        <hr className="border-linha" />
        <p className="flex items-baseline justify-between">
          <strong>Pagar agora</strong>
          <strong className="font-display text-2xl">{formatarPreco(resumo.sinal)}</strong>
        </p>
        <p className="flex justify-between text-sm text-ameixa-suave">
          <span>Na retirada</span>
          <span>{formatarPreco(resumo.naRetirada)}</span>
        </p>
        <button type="submit" disabled={enviando}
          className="mt-2 h-14 rounded-xl bg-framboesa text-lg font-bold text-white hover:bg-framboesa-escura disabled:opacity-60">
          {enviando ? "Enviando…" : `Pagar sinal de ${formatarPreco(resumo.sinal)}`}
        </button>
        <p className="text-xs text-ameixa-suave">
          Versão de demonstração: o pagamento ainda é simulado. Nenhum valor é cobrado.
        </p>
      </aside>
    </form>
  );
}

// Rótulo + campo + mensagem de erro, sempre no mesmo formato
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