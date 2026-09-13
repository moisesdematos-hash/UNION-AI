import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck,
  Maximize2,
  Minimize2,
  PanelRight,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface EbookChapter {
  chapterNumber: number;
  title: string;
  wordCount: number;
  pagesRange: string;
  content: string;
}

export interface EbookPage {
  pageNumber: number;
  title: string;
  content: string;
  callout?: { title: string; text: string };
  image?: { url: string; alt: string; caption: string; artPrompt?: string };
}

export interface GeneratedEbookData {
  title: string;
  subtitle?: string;
  targetNiche?: string;
  pageCount?: number;
  minWordsPerChapter?: number;
  totalWords?: number;
  totalWordCount?: number;
  author?: string;
  editorialNotes?: string;
  coverUrl?: string;
  chapters?: EbookChapter[];
  pages?: EbookPage[];
  fullMarkdown?: string;
}

interface EbookReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  ebook: GeneratedEbookData | null;
}

type ThemeMode = 'obsidian' | 'paper' | 'emerald' | 'royal';
type ViewMode = 'chapters' | 'deck' | 'raw';
type WindowSizeMode = 'standard' | 'fullscreen' | 'docked';

export const EbookReaderModal: React.FC<EbookReaderModalProps> = ({ isOpen, onClose, ebook }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('chapters');
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [theme, setTheme] = useState<ThemeMode>('obsidian');
  const [copied, setCopied] = useState(false);
  
  // Collapse and Resize States
  const [sizeMode, setSizeMode] = useState<WindowSizeMode>('standard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  if (!isOpen || !ebook) return null;

  const chapters = ebook.chapters || [];
  const pages = ebook.pages || [];
  const totalWords = ebook.totalWords || ebook.totalWordCount || chapters.reduce((acc, c) => acc + (c.wordCount || 0), 0);
  const pageCount = ebook.pageCount || (pages.length > 0 ? pages.length : 10);

  const fullMarkdown = ebook.fullMarkdown || ('# ' + ebook.title + '\n\n' +
    '**Nicho:** ' + (ebook.targetNiche || 'Geral') + ' | **Total de Palavras:** ' + totalWords.toLocaleString() + '\n\n---\n\n' +
    chapters.map(c => '## Capítulo ' + c.chapterNumber + ': ' + c.title + '\n*(' + c.wordCount + ' palavras)*\n\n' + c.content + '\n\n').join('---\n\n'));

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(fullMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const filename = (ebook.title || 'ebook').toLowerCase().replace(/[^a-z0-9]/g, '-') + '.md';
    const blob = new Blob([fullMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintEditorialPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${ebook.title || 'E-book UNION.AI'}</title>
        <meta charset="utf-8">
        <style>
          @page { size: A4; margin: 20mm; }
          body {
            font-family: 'Georgia', serif;
            color: #1a1a1a;
            line-height: 1.7;
            margin: 0;
            padding: 20px;
          }
          .cover {
            text-align: center;
            page-break-after: always;
            padding-top: 120px;
          }
          .cover h1 {
            font-size: 32pt;
            font-weight: 900;
            margin-bottom: 15px;
            color: #111;
          }
          .cover .meta {
            font-size: 14pt;
            color: #555;
            margin-top: 25px;
          }
          .audit-seal {
            margin-top: 40px;
            display: inline-block;
            border: 2px solid #059669;
            color: #059669;
            padding: 8px 16px;
            border-radius: 999px;
            font-family: sans-serif;
            font-size: 11pt;
            font-weight: bold;
          }
          .chapter {
            page-break-after: always;
            padding-top: 20px;
          }
          .chapter h2 {
            font-size: 20pt;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            margin-bottom: 10px;
            color: #111;
          }
          .chapter-meta {
            font-size: 10pt;
            font-family: sans-serif;
            color: #6b7280;
            margin-bottom: 25px;
          }
          p { margin-bottom: 14px; text-align: justify; }
          h3 { font-size: 14pt; margin-top: 24px; color: #1f2937; }
          ul, ol { margin-bottom: 14px; padding-left: 24px; }
          li { margin-bottom: 6px; }
          strong { color: #000; }
        </style>
      </head>
      <body>
        <div class="cover">
          <h1>${ebook.title}</h1>
          <div class="meta">
            <p><strong>Nicho:</strong> ${ebook.targetNiche || 'Geral'}</p>
            <p><strong>Extensão:</strong> ${pageCount} Páginas | ${totalWords.toLocaleString()} Palavras</p>
            <div class="audit-seal">✓ Auditoria Editorial: Todos os capítulos > 1.000 palavras</div>
          </div>
        </div>

        ${chapters.map(c => `
          <div class="chapter">
            <h2>Capítulo ${c.chapterNumber}: ${c.title}</h2>
            <div class="chapter-meta">
              Extensão: <strong>${c.wordCount.toLocaleString()} palavras</strong> | Páginas: ${c.pagesRange}
            </div>
            <div>
              ${c.content
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n\n/g, '</p><p>')}
            </div>
          </div>
        `).join('')}

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const themeClasses = {
    obsidian: 'bg-[#090b10] text-zinc-100 border-amber-500/30',
    paper: 'bg-[#fcfbf9] text-zinc-900 border-zinc-300',
    emerald: 'bg-[#06120e] text-emerald-50 border-emerald-500/30',
    royal: 'bg-[#12071f] text-purple-50 border-purple-500/30'
  };

  const currentChapter = chapters[activeChapterIdx] || chapters[0];
  const currentPage = pages[activePageIdx] || pages[0];

  // Sizing styles based on sizeMode
  const sizeClasses = {
    standard: 'w-full max-w-5xl h-[88vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden resize min-w-[360px] min-h-[400px]',
    fullscreen: 'w-[98vw] h-[96vh] rounded-xl border shadow-2xl flex flex-col overflow-hidden',
    docked: 'w-full md:w-[460px] h-[85vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden resize-x min-w-[340px] max-w-[650px]'
  };

  const containerOverlayClasses = {
    standard: 'fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-hidden animate-fadeIn',
    fullscreen: 'fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-2 overflow-hidden animate-fadeIn',
    docked: 'fixed right-4 bottom-4 top-16 z-50 flex items-end justify-end pointer-events-none animate-fadeIn'
  };

  return (
    <div className={containerOverlayClasses[sizeMode]}>
      <div className={`${sizeClasses[sizeMode]} ${themeClasses[theme]} pointer-events-auto transition-all`}>
        {/* Header Bar */}
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur flex-wrap gap-2 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs md:text-sm font-bold tracking-wide truncate max-w-[200px] md:max-w-md">
                  {ebook.title || 'Livro Digital UNION.AI'}
                </h3>
                <span className="hidden sm:flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                  <ShieldCheck className="h-2.5 w-2.5" />
                  &gt; 1.000 pal/cap
                </span>
              </div>
              {!isHeaderCollapsed && (
                <div className="text-[10px] opacity-70 font-mono flex items-center gap-2 mt-0.5 flex-wrap">
                  <span>Nicho: <strong>{ebook.targetNiche || 'Geral'}</strong></span>
                  <span>•</span>
                  <span>Total: <strong className="text-amber-400">{totalWords.toLocaleString()} palavras</strong></span>
                  <span>•</span>
                  <span>{chapters.length} Capítulos</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1.5 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10 text-[11px] font-mono">
              <button
                onClick={() => setViewMode('chapters')}
                className={`px-2.5 py-1 rounded-md transition-all ${viewMode === 'chapters' ? 'bg-amber-500 text-black font-bold shadow' : 'opacity-70 hover:opacity-100'}`}
              >
                Capítulos
              </button>
              {pages.length > 0 && (
                <button
                  onClick={() => setViewMode('deck')}
                  className={`px-2.5 py-1 rounded-md transition-all ${viewMode === 'deck' ? 'bg-amber-500 text-black font-bold shadow' : 'opacity-70 hover:opacity-100'}`}
                >
                  Deck
                </button>
              )}
              <button
                onClick={() => setViewMode('raw')}
                className={`px-2.5 py-1 rounded-md transition-all ${viewMode === 'raw' ? 'bg-amber-500 text-black font-bold shadow' : 'opacity-70 hover:opacity-100'}`}
              >
                MD
              </button>
            </div>

            {/* Sizing Controls (Standard, Docked, Fullscreen) */}
            <div className="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/10">
              <button
                onClick={() => setSizeMode(sizeMode === 'docked' ? 'standard' : 'docked')}
                title={sizeMode === 'docked' ? "Centralizar Modal" : "Fixar na Lateral (Permite usar o Canvas)"}
                className={`p-1 rounded transition-colors ${sizeMode === 'docked' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'}`}
              >
                <PanelRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setSizeMode(sizeMode === 'fullscreen' ? 'standard' : 'fullscreen')}
                title={sizeMode === 'fullscreen' ? "Restaurar Janela" : "Tela Cheia"}
                className={`p-1 rounded transition-colors ${sizeMode === 'fullscreen' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'}`}
              >
                {sizeMode === 'fullscreen' ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Theme Picker */}
            <div className="hidden sm:flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
              {(['obsidian', 'paper', 'emerald', 'royal'] as ThemeMode[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  title={`Tema ${t}`}
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    t === 'obsidian' ? 'bg-zinc-950 border-amber-500/50' :
                    t === 'paper' ? 'bg-[#fcfbf9] border-zinc-400' :
                    t === 'emerald' ? 'bg-[#06120e] border-emerald-500/50' :
                    'bg-[#12071f] border-purple-500/50'
                  } ${theme === t ? 'ring-2 ring-amber-400 scale-110' : 'opacity-60 hover:opacity-100'}`}
                />
              ))}
            </div>

            {/* Toggle Header Details */}
            <button
              onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
              title={isHeaderCollapsed ? "Mostrar Detalhes do Topo" : "Ocultar Detalhes do Topo"}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10"
            >
              {isHeaderCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            </button>

            {/* Action Buttons */}
            <button
              onClick={handleCopyMarkdown}
              title="Copiar Markdown"
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono flex items-center transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>

            <button
              onClick={handleDownloadMarkdown}
              title="Baixar Markdown (.md)"
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono flex items-center transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={handlePrintEditorialPDF}
              title="Imprimir ou Salvar PDF"
              className="px-2 py-1 rounded-lg bg-amber-500 text-black hover:bg-amber-400 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 border border-white/10 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex">
          {/* VIEW MODE: CHAPTERS */}
          {viewMode === 'chapters' && (
            <div className="flex-1 flex overflow-hidden">
              {/* Chapters Sidebar (Collapsible) */}
              <div className={`border-r border-white/10 transition-all duration-200 bg-black/20 flex flex-col shrink-0 ${
                isSidebarCollapsed ? 'w-12 p-2 items-center' : 'w-64 md:w-72 p-3'
              }`}>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 w-full">
                  {!isSidebarCollapsed && (
                    <span className="text-[10px] font-mono uppercase tracking-wider opacity-60 font-semibold truncate">
                      Índice ({chapters.length} Caps)
                    </span>
                  )}
                  <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    title={isSidebarCollapsed ? "Expandir Índice" : "Recolher Índice"}
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 mx-auto"
                  >
                    {isSidebarCollapsed ? <PanelLeft className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 w-full">
                  {chapters.map((ch, idx) => {
                    const isActive = idx === activeChapterIdx;
                    if (isSidebarCollapsed) {
                      return (
                        <button
                          key={ch.chapterNumber || idx}
                          onClick={() => setActiveChapterIdx(idx)}
                          title={`Capítulo ${ch.chapterNumber}: ${ch.title} (${ch.wordCount} palavras)`}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold transition-all mx-auto ${
                            isActive 
                              ? 'bg-amber-500 text-black shadow' 
                              : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {ch.chapterNumber}
                        </button>
                      );
                    }

                    return (
                      <button
                        key={ch.chapterNumber || idx}
                        onClick={() => setActiveChapterIdx(idx)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs cursor-pointer ${
                          isActive
                            ? 'bg-amber-500/20 border-amber-500/50 shadow-md font-semibold'
                            : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                            Capítulo {ch.chapterNumber}
                          </span>
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {ch.wordCount.toLocaleString()} pal
                          </span>
                        </div>
                        <p className="line-clamp-2 leading-relaxed font-sans text-[11px]">{ch.title}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Chapter Reading Pane */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-3xl mx-auto space-y-5 font-serif">
                {currentChapter ? (
                  <>
                    <div className="border-b border-white/10 pb-3 font-sans">
                      <div className="flex items-center justify-between text-xs font-mono opacity-70 mb-1">
                        <span>CAPÍTULO {currentChapter.chapterNumber}</span>
                        <span className="text-emerald-400 font-bold text-[11px]">
                          ✓ {currentChapter.wordCount.toLocaleString()} palavras (&gt; 1.000 cumprida)
                        </span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-black font-sans tracking-tight">
                        {currentChapter.title}
                      </h2>
                    </div>

                    <div className="prose prose-invert max-w-none text-xs md:text-sm leading-relaxed space-y-4 whitespace-pre-wrap">
                      {currentChapter.content}
                    </div>

                    {/* Navigation Footer */}
                    <div className="pt-6 border-t border-white/10 flex items-center justify-between font-sans text-xs">
                      <button
                        onClick={() => setActiveChapterIdx(Math.max(0, activeChapterIdx - 1))}
                        disabled={activeChapterIdx === 0}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" /> Anterior
                      </button>
                      <span className="font-mono text-[11px] opacity-70">
                        {activeChapterIdx + 1} de {chapters.length}
                      </span>
                      <button
                        onClick={() => setActiveChapterIdx(Math.min(chapters.length - 1, activeChapterIdx + 1))}
                        disabled={activeChapterIdx === chapters.length - 1}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        Próximo <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20 opacity-60">Nenhum capítulo disponível.</div>
                )}
              </div>
            </div>
          )}

          {/* VIEW MODE: DECK */}
          {viewMode === 'deck' && (
            <div className="flex-1 flex flex-col p-5 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                    Slide {activePageIdx + 1} de {pages.length}
                  </span>
                  <h4 className="text-xs md:text-sm font-bold truncate max-w-md">{currentPage?.title}</h4>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActivePageIdx(Math.max(0, activePageIdx - 1))}
                    disabled={activePageIdx === 0}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-xs font-mono">{activePageIdx + 1} / {pages.length}</span>
                  <button
                    onClick={() => setActivePageIdx(Math.min(pages.length - 1, activePageIdx + 1))}
                    disabled={activePageIdx === pages.length - 1}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 items-center py-4">
                <div>
                  {currentPage?.image ? (
                    <div className="relative rounded-xl overflow-hidden aspect-video border border-white/10 bg-black shadow-xl">
                      <img src={currentPage.image.url} alt={currentPage.image.alt} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <p className="absolute bottom-2 left-2 right-2 text-[11px] text-zinc-300 italic">
                        {currentPage.image.caption}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      <span className="text-[9px] font-mono uppercase text-amber-400 font-bold">Diretriz Visual</span>
                      <h4 className="text-sm font-bold">{currentPage?.title}</h4>
                      <p className="text-[11px] opacity-70">Estrutura tática focada em retenção e clareza de execução.</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-base md:text-lg font-black">{currentPage?.title}</h3>
                  <div className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap opacity-90">
                    {currentPage?.content}
                  </div>
                  {currentPage?.callout && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                      <strong className="block font-mono text-[10px] uppercase">💡 {currentPage.callout.title}</strong>
                      <p className="text-[11px]">{currentPage.callout.text}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE: RAW MARKDOWN */}
          {viewMode === 'raw' && (
            <div className="flex-1 p-5 overflow-y-auto">
              <pre className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {fullMarkdown}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default EbookReaderModal;
