import { expect, test, type Page } from "@playwright/test";
import { simularSupabase } from "./supabase-simulado";

// Escolhe no calendário o primeiro dia livre do mês que vem
async function escolherDiaLivre(page: Page) {
  await page.getByRole("button", { name: "Próximo mês" }).click();
  const dias = page.locator("section[aria-labelledby=titulo-calendario] button[aria-pressed]");
  const total = await dias.count();
  for (let i = 0; i < total; i++) {
    const dia = dias.nth(i);
    const rotulo = (await dia.getAttribute("aria-label")) ?? "";
    if ((await dia.isEnabled()) && !rotulo.includes("reservado")) {
      await dia.click();
      return rotulo;
    }
  }
  throw new Error("Nenhum dia livre no mês que vem");
}

async function preencherCheckout(page: Page) {
  await page.getByLabel("Nome completo", { exact: true }).fill("Maria Silva");
  await page.getByLabel("CPF", { exact: true }).fill("529.982.247-25");
  await page.getByLabel("WhatsApp", { exact: true }).fill("(21) 98765-4321");
  await page.getByLabel("E-mail", { exact: true }).fill("maria@exemplo.com");
  await page.getByLabel("Chave Pix (para devolver a taxa de segurança)").fill("maria@exemplo.com");
  await page.getByLabel("Li e aceito o contrato de locação.").check();
}

test("cliente aluga um bolo, do catálogo até o pedido recebido", async ({ page }) => {
  const { pedidosEnviados } = await simularSupabase(page);

  await page.goto("alugar/");
  await page.getByRole("link", { name: "Escolher tamanho e data" }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.getByLabel("Nome no bolo").fill("Alice");
  await page.getByLabel("Idade").fill("5");
  await escolherDiaLivre(page);
  await page.getByRole("button", { name: /Reservar e pagar sinal/ }).click();

  await expect(page).toHaveURL(/carrinho/);
  await expect(page.getByText("Nome: Alice · Idade: 5")).toBeVisible();
  await page.getByRole("link", { name: "Continuar" }).click();

  await expect(page).toHaveURL(/checkout/);
  await preencherCheckout(page);
  await page.getByRole("button", { name: "Finalizar pedido" }).click();

  await expect(page).toHaveURL(/confirmado/);
  await expect(page.getByRole("heading", { name: "Pedido recebido, Maria!" })).toBeVisible();
  await expect(page.getByText("ATL-1001")).toBeVisible();
  await expect(page.getByRole("link", { name: "Pagar o sinal pelo WhatsApp" })).toBeVisible();

  // O que foi para o banco: o bolo, a personalização e os valores calculados pelo site
  const enviado = pedidosEnviados[0] as { pedido: { itens: { personalizacao: string }[]; pagoAgora: number } };
  expect(enviado.pedido.itens[0].personalizacao).toBe("Nome: Alice · Idade: 5");
  expect(enviado.pedido.pagoAgora).toBeGreaterThan(0);
});

test("checkout mostra o aviso quando outra cliente reservou o bolo antes", async ({ page }) => {
  await simularSupabase(page, { respostaDoPedido: { erro: "PECA_RESERVADA:SAFARI_001" } });

  await page.goto("bolo/SAFARI_001/");
  await page.getByLabel("Nome no bolo").fill("Alice");
  await page.getByLabel("Idade").fill("5");
  await escolherDiaLivre(page);
  await page.getByRole("button", { name: /Reservar e pagar sinal/ }).click();
  await page.getByRole("link", { name: "Continuar" }).click();
  await preencherCheckout(page);
  await page.getByRole("button", { name: "Finalizar pedido" }).click();

  await expect(page.getByRole("alert").filter({ hasText: "acabou de ser reservado" })).toBeVisible();
  await expect(page).toHaveURL(/checkout/); // continua no checkout, com os dados preenchidos
  await expect(page.getByLabel("Nome completo", { exact: true })).toHaveValue("Maria Silva");
});

test("dias reservados aparecem ocupados no calendário", async ({ page }) => {
  // reserva de mentira no dia 15 do mês que vem
  const hoje = new Date();
  const mesQueVem = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1, 15));
  const festa = mesQueVem.toISOString().slice(0, 10);
  await simularSupabase(page, { reservas: [{ codigo: "SAFARI_001", festa }] });

  await page.goto("bolo/SAFARI_001/");
  await page.getByRole("button", { name: "Próximo mês" }).click();
  await expect(page.locator(`button[aria-label^="15 de"]`)).toHaveAttribute("aria-label", /reservado/);
});

test("bolo vendido não aparece mais para aluguel", async ({ page }) => {
  await simularSupabase(page, { vendidos: ["SAFARI_001"] });

  await page.goto("bolo/SAFARI_001/");
  await expect(page.getByText("Este bolo foi vendido")).toBeVisible();
  await page.goto("alugar/");
  await expect(page.getByRole("heading", { name: "Safari", exact: true })).toHaveCount(0);
});
