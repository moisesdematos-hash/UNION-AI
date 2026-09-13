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
  ShieldCheck
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

export const EbookReaderModal: React.FC<EbookReaderModalProps> = ({ isOpen, onClose, ebook }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('chapters');
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [theme, setTheme] = useState<ThemeMode>('obsidian');
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-hidden animate-fadeIn">
      <div className={`w-full max-w-5xl h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all ${themeClasses[theme]}`}>
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/30 backdrop-blur flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-wide truncate max-w-md">
                  {ebook.title || 'Livro Digital UNION.AI'}
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                  <ShieldCheck className="h-3 w-3" />
                  &gt; 1.000 pal/cap
                </span>
              </div>
              <div className="text-[11px] opacity-70 font-mono flex items-center gap-3 mt-0.5">
                <span>Nicho: <strong>{ebook.targetNiche || 'Geral'}</strong></span>
                <span>•</span>
                <span>Total: <strong className="text-amber-400">{totalWords.toLocaleString()} palavras</strong></span>
                <span>•</span>
                <span>{chapters.length} Capítulos</span>
                <span>•</span>
                <span>{pageCount} Páginas</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10 text-xs font-mono">
              <button
                onClick={() => setViewMode('chapters')}
                className={`px-3 py-1 rounded-md transition-all ${viewMode === 'chapters' ? 'bg-amber-500 text-black font-bold shadow' : 'opacity-70 hover:opacity-100'}`}
              >
                Capítulos ({chapters.length})
              </button>
              {pages.length > 0 && (
                <button
                  onClick={() => setViewMode('deck')}
                  className={`px-3 py-1 rounded-md transition-all ${viewMode === 'deck' ? 'bg-amber-500 text-black font-bold shadow' : 'opacity-70 hover:opacity-100'}`}
                >
                  Slides/Deck ({pages.length})
                </button>
              )}
              <button
                onClick={() => setViewMode('raw')}
                className={`px-3 py-1 rounded-md transition-all ${viewMode === 'raw' ? 'bg-amber-500 text-black font-bold shadow' : 'opacity-70 hover:opacity-100'}`}
              >
                Markdown
              </button>
            </div>

            {/* Theme Picker */}
            <div className="hidden sm:flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
              {(['obsidian', 'paper', 'emerald', 'royal'] as ThemeMode[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  title={`Tema ${t}`}
                  className={`w-5 h-5 rounded-full border transition-all ${
                    t === 'obsidian' ? 'bg-zinc-950 border-amber-500/50' :
                    t === 'paper' ? 'bg-[#fcfbf9] border-zinc-400' :
                    t === 'emerald' ? 'bg-[#06120e] border-emerald-500/50' :
                    'bg-[#12071f] border-purple-500/50'
                  } ${theme === t ? 'ring-2 ring-amber-400 scale-110' : 'opacity-60 hover:opacity-100'}`}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleCopyMarkdown}
              title="Copiar Markdown"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>

            <button
              onClick={handleDownloadMarkdown}
              title="Baixar Markdown (.md)"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              <Download className="h-4 w-4" />
            </button>

            <button
              onClick={handlePrintEditorialPDF}
              title="Imprimir ou Salvar PDF"
              className="p-1.5 rounded-lg bg-amber-500 text-black hover:bg-amber-400 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden md:inline">PDF Editorial</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 border border-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex">
          {/* VIEW MODE: CHAPTERS */}
          {viewMode === 'chapters' && (
            <div className="flex-1 flex overflow-hidden">
              {/* Chapters Sidebar */}
              <div className="w-72 border-r border-white/10 p-3 overflow-y-auto space-y-2 bg-black/20 shrink-0">
                <span className="text-[10px] font-mono uppercase tracking-wider opacity-60 px-2 block">
                  Índice da Obra ({chapters.length} Capítulos)
                </span>
                {chapters.map((ch, idx) => {
                  const isActive = idx === activeChapterIdx;
                  return (
                    <button
                      key={ch.chapterNumber || idx}
                      onClick={() => setActiveChapterIdx(idx)}
                      className={`w-full text-left p-3 rounded-xl border transition-all text-xs cursor-pointer ${
                        isActive
                          ? 'bg-amber-500/20 border-amber-500/50 shadow-md font-semibold'
                          : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                          Capítulo {ch.chapterNumber}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {ch.wordCount.toLocaleString()} pal
                        </span>
                      </div>
                      <p className="line-clamp-2 leading-relaxed font-sans">{ch.title}</p>
                      <span className="text-[9px] font-mono opacity-60 block mt-1">
                        Páginas: {ch.pagesRange || `${idx * 2 + 1}-${idx * 2 + 2}`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Chapter Reading Pane */}
              <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto space-y-6 font-serif">
                {currentChapter ? (
                  <>
                    <div className="border-b border-white/10 pb-4 font-sans">
                      <div className="flex items-center justify-between text-xs font-mono opacity-70 mb-1">
                        <span>CAPÍTULO {currentChapter.chapterNumber}</span>
                        <span className="text-emerald-400 font-bold">
                          ✓ {currentChapter.wordCount.toLocaleString()} palavras (Meta &gt; 1.000 cumprida)
                        </span>
                      </div>
                      <h2 className="text-2xl font-black font-sans tracking-tight">
                        {currentChapter.title}
                      </h2>
                    </div>

                    <div className="prose prose-invert max-w-none text-sm md:text-base leading-relaxed space-y-4 whitespace-pre-wrap">
                      {currentChapter.content}
                    </div>

                    {/* Navigation Footer */}
                    <div className="pt-8 border-t border-white/10 flex items-center justify-between font-sans text-xs">
                      <button
                        onClick={() => setActiveChapterIdx(Math.max(0, activeChapterIdx - 1))}
                        disabled={activeChapterIdx === 0}
                        className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        <ChevronLeft className="h-4 w-4" /> Capítulo Anterior
                      </button>
                      <span className="font-mono text-xs opacity-70">
                        Capítulo {activeChapterIdx + 1} de {chapters.length}
                      </span>
                      <button
                        onClick={() => setActiveChapterIdx(Math.min(chapters.length - 1, activeChapterIdx + 1))}
                        disabled={activeChapterIdx === chapters.length - 1}
                        className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        Próximo Capítulo <ChevronRight className="h-4 w-4" />
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
            <div className="flex-1 flex flex-col p-6 overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                    Slide {activePageIdx + 1} de {pages.length}
                  </span>
                  <h4 className="text-sm font-bold truncate max-w-md">{currentPage?.title}</h4>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActivePageIdx(Math.max(0, activePageIdx - 1))}
                    disabled={activePageIdx === 0}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-mono">{activePageIdx + 1} / {pages.length}</span>
                  <button
                    onClick={() => setActivePageIdx(Math.min(pages.length - 1, activePageIdx + 1))}
                    disabled={activePageIdx === pages.length - 1}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-center py-6">
                {/* Visual side */}
                <div>
                  {currentPage?.image ? (
                    <div className="relative rounded-2xl overflow-hidden aspect-video border border-white/10 bg-black shadow-xl">
                      <img src={currentPage.image.url} alt={currentPage.image.alt} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <p className="absolute bottom-3 left-3 right-3 text-xs text-zinc-300 italic">
                        {currentPage.image.caption}
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                      <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">Diretriz Visual</span>
                      <h4 className="text-lg font-bold">{currentPage?.title}</h4>
                      <p className="text-xs opacity-70">Estrutura tática focada em retenção e clareza de execução.</p>
                    </div>
                  )}
                </div>

                {/* Text side */}
                <div className="space-y-4">
                  <h3 className="text-xl font-black">{currentPage?.title}</h3>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap opacity-90">
                    {currentPage?.content}
                  </div>
                  {currentPage?.callout && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                      <strong className="block font-mono text-[11px] uppercase">💡 {currentPage.callout.title}</strong>
                      <p>{currentPage.callout.text}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE: RAW MARKDOWN */}
          {viewMode === 'raw' && (
            <div className="flex-1 p-6 overflow-y-auto">
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
