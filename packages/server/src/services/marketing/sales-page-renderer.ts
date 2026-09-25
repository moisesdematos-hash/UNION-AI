import { SalesPageCopy } from '@union/shared';

export interface RenderOptions {
  checkoutUrl?: string;
  theme?: 'dark' | 'light';
  customTitle?: string;
}

export class SalesPageRenderer {
  /**
   * Generates a modern, high-converting, fully responsive HTML5 page using Tailwind CSS CDN
   */
  public static renderToHtml(copy: SalesPageCopy, options: RenderOptions = {}): string {
    const checkoutUrl = options.checkoutUrl || '#checkout';
    const isDark = (options.theme || 'dark') === 'dark';
    const pageTitle = options.customTitle || copy.title || 'Oferta Exclusiva';

    const bgClass = isDark ? 'bg-[#090b10] text-zinc-100' : 'bg-slate-50 text-slate-900';
    const cardBg = isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-slate-200 shadow-sm';
    const mutedText = isDark ? 'text-zinc-400' : 'text-slate-600';

    const benefitsHtml = (copy.benefits || []).map((b, idx) => 
      `<div class="p-6 rounded-xl ${cardBg} border flex items-start gap-4">
        <div class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0">${idx + 1}</div>
        <p class="text-sm md:text-base leading-relaxed">${escapeHtml(b)}</p>
      </div>`
    ).join('');

    const proofHtml = (copy.proof || []).map((p) => 
      `<div class="p-5 rounded-xl bg-black/40 border border-zinc-800 space-y-3">
        <div class="text-amber-400 text-sm">★★★★★</div>
        <p class="text-xs md:text-sm text-zinc-300 italic">"${escapeHtml(p)}"</p>
      </div>`
    ).join('');

    const bonusesHtml = (copy.bonuses || []).map((b) => 
      `<div class="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
        <span class="text-emerald-400 font-bold">✓</span>
        <span class="text-xs md:text-sm text-zinc-200">${escapeHtml(b)}</span>
      </div>`
    ).join('');

    const objectionsHtml = (copy.objections && copy.objections.length > 0) ? 
      `<div class="p-6 rounded-xl ${cardBg} border space-y-3">
        <h4 class="text-sm font-bold text-white uppercase font-mono tracking-wider text-emerald-400">Ainda na dúvida?</h4>
        <div class="space-y-2">${copy.objections.map(obj => 
          `<div class="text-xs md:text-sm text-zinc-300 flex items-start gap-2">
            <span class="text-emerald-400 font-bold">•</span>
            <span>${escapeHtml(obj)}</span>
          </div>`
        ).join('')}</div>
      </div>` : '';

    const faqHtml = (copy.faq || []).map((f) => 
      `<details class="p-4 rounded-xl ${cardBg} border group cursor-pointer">
        <summary class="font-bold text-sm md:text-base text-zinc-200 flex items-center justify-between list-none">
          <span>${escapeHtml(f.question)}</span>
          <span class="text-emerald-400 transition-transform group-open:rotate-180">▼</span>
        </summary>
        <p class="pt-3 text-xs md:text-sm ${mutedText} leading-relaxed border-t border-zinc-800/60 mt-3">${escapeHtml(f.answer)}</p>
      </details>`
    ).join('');

    return `<!DOCTYPE html>
<html lang="pt-BR" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .font-display { font-family: 'Space Grotesk', sans-serif; }
    @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 25px rgba(16,185,129,0.4); } 50% { box-shadow: 0 0 45px rgba(16,185,129,0.8); } }
    .cta-glow { animation: pulseGlow 2.5s infinite; }
  </style>
</head>
<body class="${bgClass} antialiased selection:bg-emerald-500 selection:text-black">
  <div class="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white text-xs md:text-sm font-semibold py-2 px-4 text-center tracking-wide flex items-center justify-center gap-2">
    <span class="inline-block w-2 h-2 rounded-full bg-white animate-ping"></span>
    <span>Atenção: Condição especial com bônus exclusivos válida por tempo limitado!</span>
  </div>
  <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-20">
    <section class="text-center space-y-6 pt-4">
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-semibold uppercase tracking-wider">
        <span>⭐ Método Validado de Escala</span>
      </div>
      <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold font-display tracking-tight leading-[1.15] text-balance">
        ${escapeHtml(copy.headline)}
      </h1>
      <p class="text-lg md:text-xl ${mutedText} max-w-3xl mx-auto leading-relaxed text-balance">
        ${escapeHtml(copy.subheadline)}
      </p>
      <div class="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="${checkoutUrl}" class="cta-glow w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold text-base md:text-lg tracking-wide transition-all transform hover:-translate-y-0.5 text-center shadow-lg shadow-emerald-500/25">
          ${escapeHtml(copy.cta || 'QUERO DESTRAVAR AGORA')}
        </a>
      </div>
      <p class="text-xs text-zinc-500 flex items-center justify-center gap-2">
        <span>🔒 Pagamento Seguro</span> • <span>⚡ Acesso Imediato</span> • <span>🛡️ 30 Dias de Garantia</span>
      </p>
    </section>
    <section class="p-8 md:p-12 rounded-2xl ${cardBg} border space-y-6">
      <div class="flex items-center gap-2 text-rose-500 font-mono text-xs font-bold uppercase tracking-wider">
        <span>⚠️ O Obstáculo Invisível</span>
      </div>
      <h2 class="text-2xl md:text-3xl font-bold font-display">A dura verdade sobre os gargalos que estão travando seus resultados</h2>
      <div class="space-y-4 text-base md:text-lg leading-relaxed ${mutedText}">
        <p>${escapeHtml(copy.problem)}</p>
        <div class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm md:text-base">
          <strong>A consequência real:</strong> ${escapeHtml(copy.consequences)}
        </div>
      </div>
    </section>
    <section class="p-8 md:p-12 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-950 border border-emerald-500/30 space-y-6">
      <div class="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
        <span>💡 A Virada de Chave</span>
      </div>
      <h2 class="text-2xl md:text-3xl font-bold font-display text-white">O Novo Caminho: O Mecanismo que Muda Tudo</h2>
      <p class="text-base md:text-lg text-zinc-300 leading-relaxed">${escapeHtml(copy.opportunity)}</p>
      <div class="p-5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200">
        <h3 class="font-bold text-base md:text-lg mb-1">Mecanismo Único:</h3>
        <p class="text-sm md:text-base">${escapeHtml(copy.mechanism)}</p>
      </div>
    </section>
    <section class="space-y-8">
      <div class="text-center space-y-2">
        <span class="text-xs font-mono text-emerald-400 uppercase font-bold tracking-widest">Vantagens Reais</span>
        <h2 class="text-2xl md:text-4xl font-bold font-display">Tudo o Que Você Conquista com Essa Solução</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${benefitsHtml}</div>
    </section>
    <section class="p-8 md:p-10 rounded-2xl ${cardBg} border space-y-6">
      <div class="text-center space-y-2">
        <span class="text-xs font-mono text-emerald-400 uppercase font-bold tracking-widest">Depoimentos & Validação</span>
        <h2 class="text-2xl md:text-3xl font-bold font-display">Resultados Comprovados em Campo</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">${proofHtml}</div>
    </section>
    <section class="p-8 md:p-12 rounded-3xl bg-gradient-to-b from-zinc-900 to-black border-2 border-emerald-500/50 shadow-2xl space-y-8 text-center relative overflow-hidden">
      <div class="space-y-3 max-w-2xl mx-auto">
        <span class="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold uppercase">Oferta de Acesso Exclusivo</span>
        <h2 class="text-3xl md:text-4xl font-extrabold font-display text-white">${escapeHtml(copy.title || 'Acesso Completo')}</h2>
        <p class="text-base text-zinc-300 leading-relaxed">${escapeHtml(copy.offer)}</p>
      </div>
      <div class="space-y-3 text-left max-w-2xl mx-auto pt-4">
        <h3 class="text-sm font-mono font-bold text-emerald-400 uppercase tracking-wider text-center">🎁 Bônus Especiais Inclusos Gratuitamente:</h3>
        <div class="space-y-2">${bonusesHtml}</div>
      </div>
      <div class="pt-6 max-w-md mx-auto space-y-3">
        <a href="${checkoutUrl}" class="cta-glow block w-full py-5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-black font-extrabold text-lg md:text-xl tracking-wide transition-all transform hover:scale-[1.02] shadow-xl shadow-emerald-500/30">
          ${escapeHtml(copy.cta || 'QUERO GARANTIR MINHA VAGA AGORA')}
        </a>
        <p class="text-xs text-zinc-400">Ambiente Seguro e Criptografado • Acesso Imediato</p>
      </div>
    </section>
    <section class="p-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
      <div class="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-3xl shrink-0">🛡️</div>
      <div class="space-y-2">
        <h3 class="text-lg md:text-xl font-bold text-amber-300 font-display">Garantia Incondicional de Satisfação</h3>
        <p class="text-xs md:text-sm text-zinc-300 leading-relaxed">${escapeHtml(copy.guarantee)}</p>
      </div>
    </section>
    <section class="space-y-8">
      <div class="text-center space-y-2">
        <span class="text-xs font-mono text-emerald-400 uppercase font-bold tracking-widest">Dúvidas Frequentes</span>
        <h2 class="text-2xl md:text-3xl font-bold font-display">Perguntas e Respostas Rápidas</h2>
      </div>
      ${objectionsHtml}
      <div class="space-y-3 max-w-3xl mx-auto">${faqHtml}</div>
    </section>
    <section class="text-center py-8 space-y-4">
      <h2 class="text-2xl md:text-3xl font-bold font-display">Pronto para dar o próximo passo?</h2>
      <a href="${checkoutUrl}" class="cta-glow inline-block px-10 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-base md:text-lg tracking-wide transition-all shadow-lg shadow-emerald-500/25">
        ${escapeHtml(copy.cta || 'COMEÇAR AGORA MESMO')}
      </a>
    </section>
  </main>
  <footer class="border-t border-zinc-800/80 py-8 text-center text-xs text-zinc-500 space-y-2">
    <p>© ${new Date().getFullYear()} ${escapeHtml(pageTitle)}. Todos os direitos reservados.</p>
    <p class="text-[10px]">Desenvolvido com tecnologia UNION.AI • Máquinas Autônomas de Alta Conversão</p>
  </footer>
</body>
</html>`;
  }
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
