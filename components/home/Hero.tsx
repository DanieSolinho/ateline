import Form from "next/form";

export function Hero() {
  return (
    <section className="bg-blush">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          <p className="font-display text-sm font-semibold uppercase tracking-widest text-framboesa">
            Ateliê de bolos cenográficos · Rio de Janeiro
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight text-balance md:text-6xl">
            O bolo dos sonhos da sua festa, sem se preocupar com a mesa
          </h1>
          <p className="max-w-lg text-lg text-ameixa-suave">
            Alugue um bolo do nosso acervo, monte a mesa com um kit pegue e monte ou
            encomende um bolo feito do seu jeito.
          </p>

          {/* Ao enviar, vai para /alugar?data=2026-10-25 */}
          <Form
            action="/alugar"
            className="flex max-w-xl flex-wrap items-end gap-3 rounded-2xl border border-linha bg-white p-5 shadow-lg shadow-ameixa/5"
          >
            <div className="flex min-w-48 flex-1 flex-col gap-1.5">
              <label htmlFor="data-festa" className="font-bold">
                Quando é a sua festa?
              </label>
              <input
                id="data-festa"
                name="data"
                type="date"
                required
                className="h-12 rounded-xl border border-ameixa/30 px-3"
              />
            </div>
            <button
              type="submit"
              className="h-12 rounded-xl bg-framboesa px-6 font-bold text-white hover:bg-framboesa-escura"
            >
              Ver bolos disponíveis
            </button>
            <p className="basis-full text-sm text-ameixa-suave">
              Mostramos só o que está livre na sua data. Retirada 1 dia antes, devolução
              1 dia útil depois.
            </p>
          </Form>
        </div>

        {/* Espaço das fotos: troque pelas fotos reais quando chegarem */}
        <div className="grid grid-cols-2 gap-4" aria-hidden="true">
          <div className="row-span-2 min-h-96 rounded-3xl bg-rosa" />
          <div className="min-h-44 rounded-3xl bg-pessego" />
          <div className="min-h-44 rounded-3xl bg-blush ring-1 ring-linha" />
        </div>
      </div>
    </section>
  );
}