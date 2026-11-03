// Ajuda para instalar o painel como app no celular

// Já está aberto como app (pela tela inicial)?
export function abertoComoApp(janela: Pick<Window, "matchMedia"> & { navigator: Navigator }): boolean {
  const iosStandalone = (janela.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || janela.matchMedia("(display-mode: standalone)").matches;
}

// iPhone e iPad não mostram o botão "Instalar": lá é pelo menu Compartilhar do Safari.
// O iPad novo se apresenta como Mac, então também olha se a tela é de toque.
export function eIosOuIpad(userAgent: string, pontosDeToque: number): boolean {
  if (/iPhone|iPad|iPod/.test(userAgent)) return true;
  return /Macintosh/.test(userAgent) && pontosDeToque > 1;
}
