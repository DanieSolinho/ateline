const passos = [
  { titulo: "Escolha bolo e data", texto: "O site mostra só as peças livres no dia da sua festa." },
  { titulo: "Reserve com 50%", texto: "Aceite o contrato e pague o sinal por Pix ou cartão." },
  {
    titulo: "Retire na loja",
    texto: "Um dia antes da festa. Pague o restante e a taxa de segurança de R$ 50.",
  },
  {
    titulo: "Devolva e receba",
    texto: "No primeiro dia útil depois. Sem avarias, a taxa de segurança volta para você.",
  },
];

export function ComoFunciona() {
  return (
    <section aria-labelledby="como-funciona-titulo" className="bg-ameixa text-blush">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <h2 id="como-funciona-titulo" className="font-display text-3xl font-semibold text-white">Como funciona o aluguel</h2>
        <p className="mt-2 mb-8 max-w-xl text-[#e2cdd3]">
          Tudo pelo site. Você só vem à loja para retirar e devolver.
        </p>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {passos.map((passo, indice) => (
            <li key={passo.titulo} className="flex flex-col gap-2 rounded-2xl border border-white/15 p-6">
              <span className="font-display text-3xl font-bold text-[#f6b8c8]">{indice + 1}</span>
              <span className="font-display text-xl font-semibold text-white">{passo.titulo}</span>
              <span className="text-[#e2cdd3]">{passo.texto}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}