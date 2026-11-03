// Service worker do painel da loja (só vale para as páginas em /painel/).
// Ele NÃO guarda a agenda nem os pedidos: tudo continua vindo ao vivo do Supabase.
// A única coisa guardada é uma página "Sem internet", mostrada quando o celular está offline.
const CACHE = "painel-ateline-v1";
const OFFLINE = new URL("painel-offline.html", self.location).href;

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE)));
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  // Apaga caches de versões antigas deste arquivo
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((nome) => nome !== CACHE).map((nome) => caches.delete(nome))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  if (evento.request.mode !== "navigate") return; // o resto (Supabase, scripts) segue normal
  evento.respondWith(fetch(evento.request).catch(() => caches.match(OFFLINE)));
});
