import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Download, 
  Globe, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Link2,
  Share2,
  Loader2
} from 'lucide-react';
import { SalesPageCopy } from '@union/shared';

interface SalesPageLivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  copy: SalesPageCopy | null;
  defaultCheckoutUrl?: string;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export const SalesPageLivePreviewModal: React.FC<SalesPageLivePreviewModalProps> = ({
  isOpen,
  onClose,
  copy,
  defaultCheckoutUrl = '#checkout'
}) => {
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [checkoutUrl, setCheckoutUrl] = useState(defaultCheckoutUrl);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (defaultCheckoutUrl) {
      setCheckoutUrl(defaultCheckoutUrl);
    }
  }, [defaultCheckoutUrl]);

  // Fetch or generate rendered HTML
  useEffect(() => {
    if (!isOpen || !copy) return;

    let isMounted = true;
    setLoading(true);

    fetch('/api/marketing/sales-page/render-html', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('union_auth_token') || ''}`
      },
      body: JSON.stringify({
        copy,
        checkoutUrl,
        theme: 'dark'
      })
    })
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success && data.data?.html) {
          setHtmlContent(data.data.html);
        }
      })
      .catch(err => {
        console.error('Failed to render sales page preview:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, copy, checkoutUrl]);

  if (!isOpen || !copy) return null;

  const handleCopyHtml = () => {
    if (!htmlContent) return;
    navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadHtml = () => {
    if (!htmlContent) return;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagina_vendas_${(copy.title || 'oferta').toLowerCase().replace(/[^a-z0-9]+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const res = await fetch('/api/marketing/sales-page/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('union_auth_token') || ''}`
        },
        body: JSON.stringify({
          copy,
          checkoutUrl,
          theme: 'dark'
        })
      });
      const json = await res.json();
      if (json.success && json.data?.slug) {
        setPublishedSlug(json.data.slug);
      }
    } catch (err) {
      console.error('Failed to publish sales page:', err);
    } finally {
      setIsPublishing(false);
    }
  };

  const publicLink = publishedSlug ? `${window.location.origin}/p/${publishedSlug}` : null;

  const handleCopyPublicLink = () => {
    if (!publicLink) return;
    navigator.clipboard.writeText(publicLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const deviceWidths = {
    desktop: 'w-full max-w-full',
    tablet: 'w-[768px] max-w-full mx-auto shadow-2xl rounded-2xl border border-zinc-700 overflow-hidden',
    mobile: 'w-[375px] max-w-full mx-auto shadow-2xl rounded-2xl border border-zinc-700 overflow-hidden'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-7xl h-[92vh] bg-[#0c0e14] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        
        {/* Top Control Bar */}
        <header className="px-5 py-3 border-b border-zinc-800/80 bg-zinc-950/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                  {copy.title || 'Live Preview da Página de Vendas (14 Blocos)'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30 font-semibold">
                  HTML5 + Tailwind
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Página de alta conversão pronta para tráfego e publicação instantânea
              </p>
            </div>
          </div>

          {/* Device Responsive Switcher */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            <button
              onClick={() => setDevice('desktop')}
              className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                device === 'desktop' ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
              title="Visualização Desktop"
            >
              <Monitor className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              onClick={() => setDevice('tablet')}
              className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                device === 'tablet' ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
              title="Visualização Tablet (iPad 768px)"
            >
              <Tablet className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tablet</span>
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                device === 'mobile' ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
              title="Visualização Mobile (iPhone 375px)"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          {/* Actions & Close */}
          <div className="flex items-center gap-2">
            {/* Deploy / Publish Button */}
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isPublishing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Share2 className="h-3.5 w-3.5" />
              )}
              <span>{publishedSlug ? 'Re-publicar' : '🌐 Publicar Link'}</span>
            </button>

            {/* Copy HTML Button */}
            <button
              onClick={handleCopyHtml}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-zinc-400" />}
              <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Copiar HTML'}</span>
            </button>

            {/* Download index.html */}
            <button
              onClick={handleDownloadHtml}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Baixar .html</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer ml-1"
              title="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Configuration Bar (Checkout URL & Live Link) */}
        <div className="px-5 py-2.5 bg-zinc-950/40 border-b border-zinc-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <Link2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="text-zinc-400 shrink-0 font-mono text-[11px]">Link de Checkout:</span>
            <input
              type="text"
              value={checkoutUrl}
              onChange={(e) => setCheckoutUrl(e.target.value)}
              placeholder="Ex: https://pay.kiwify.com.br/seu-checkout ou #checkout"
              className="flex-1 max-w-md px-2.5 py-1 rounded-lg bg-black/60 border border-zinc-800 text-zinc-200 font-mono text-xs focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {publicLink && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl text-emerald-300 font-mono text-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="truncate max-w-[240px] sm:max-w-xs">{publicLink}</span>
              <button
                onClick={handleCopyPublicLink}
                className="p-1 hover:text-white transition-colors cursor-pointer"
                title="Copiar link público"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-white" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <a
                href={publicLink}
                target="_blank"
                rel="noreferrer"
                className="p-1 hover:text-white transition-colors cursor-pointer"
                title="Abrir em nova aba"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Preview Frame Container */}
        <div className="flex-1 bg-black/70 p-2 sm:p-4 overflow-y-auto flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 text-zinc-400">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
              <p className="text-xs font-mono">Compilando os 14 blocos psicológicos em HTML5...</p>
            </div>
          ) : htmlContent ? (
            <div className={`h-full transition-all duration-300 flex flex-col ${deviceWidths[device]}`}>
              <iframe
                srcDoc={htmlContent}
                title="Sales Page Live Preview"
                className="w-full h-full border-0 bg-white rounded-xl shadow-inner"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          ) : (
            <div className="text-zinc-500 text-xs font-mono">Nenhum conteúdo renderizado.</div>
          )}
        </div>

        {/* Footer info bar */}
        <footer className="px-5 py-2 border-t border-zinc-800/80 bg-zinc-950/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>UNION.AI • Publicador de Páginas de Vendas em 1 Clique</span>
          <span className="text-emerald-400 font-semibold">14 Blocos Psicológicos Ativos</span>
        </footer>

      </div>
    </div>
  );
};
