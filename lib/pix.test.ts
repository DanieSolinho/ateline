import { describe, expect, it } from "vitest";
import { chaveDoPix, crc16, identificadorDoPedido, pixConfigurado, pixCopiaECola, textoDoPix } from "@/lib/pix";

const config = { chave: "28.809.419/0001-08", nome: "Ateline Ateliê", cidade: "Rio de Janeiro" };

// Lê os campos do código (id + tamanho + valor) para conferir o que foi montado
function lerCampos(codigo: string): Record<string, string> {
  const campos: Record<string, string> = {};
  let i = 0;
  while (i < codigo.length) {
    const id = codigo.slice(i, i + 2);
    const tamanho = Number(codigo.slice(i + 2, i + 4));
    campos[id] = codigo.slice(i + 4, i + 4 + tamanho);
    i += 4 + tamanho;
  }
  return campos;
}

describe("Pix copia e cola", () => {
  it("calcula o dígito verificador do padrão (CRC16-CCITT)", () => {
    expect(crc16("123456789")).toBe("29B1");
    // exemplo do Manual de Padrões para Iniciação do Pix (Banco Central)
    const exemplo =
      "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***6304";
    expect(crc16(exemplo)).toBe("1D3D");
  });

  it("monta o código com chave, valor, nome, cidade e número do pedido", () => {
    const codigo = pixCopiaECola({ valor: 75, pedido: "ATL-1001" }, config);
    const campos = lerCampos(codigo);
    expect(campos["00"]).toBe("01");
    expect(lerCampos(campos["26"])).toEqual({ "00": "br.gov.bcb.pix", "01": "28809419000108", "02": "SINAL ATL1001" });
    expect(campos["53"]).toBe("986");
    expect(campos["54"]).toBe("75.00");
    expect(campos["58"]).toBe("BR");
    expect(campos["59"]).toBe("ATELINE ATELIE");
    expect(campos["60"]).toBe("RIO DE JANEIRO");
    expect(lerCampos(campos["62"])).toEqual({ "05": "ATL1001" });
    // o verificador fecha com o resto do código
    expect(codigo.slice(-4)).toBe(crc16(codigo.slice(0, -4)));
  });

  it("aceita os tipos de chave do Pix", () => {
    expect(chaveDoPix(" Loja@Gmail.com ")).toBe("loja@gmail.com");
    expect(chaveDoPix("+55 (21) 98765-4321")).toBe("+5521987654321");
    expect(chaveDoPix("123E4567-E89B-12D3-A456-426614174000")).toBe("123e4567-e89b-12d3-a456-426614174000");
  });

  it("limpa textos e identificadores", () => {
    expect(textoDoPix("Praça Seca — Rio!", 15)).toBe("PRACA SECA RIO");
    expect(identificadorDoPedido("ATL-1001")).toBe("ATL1001");
    expect(identificadorDoPedido("---")).toBe("***");
  });

  it("sem chave, o Pix não aparece (continua o WhatsApp)", () => {
    expect(pixConfigurado({ ...config, chave: " " })).toBe(false);
    expect(pixConfigurado(config)).toBe(true);
  });
});
