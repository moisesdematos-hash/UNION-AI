import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Video, 
  Search, 
  TrendingUp, 
  Layers, 
  ArrowRight, 
  Coins, 
  Zap, 
  Check 
} from 'lucide-react';
import { OFFICIAL_TEMPLATES, WorkflowTemplate } from '@union/shared';
import { useCanvasStore } from '../../store/canvasStore.js';

interface TemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate?: (template: WorkflowTemplate) => void;
}

export const TemplateLibraryModal: React.FC<TemplateLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loadedTemplateId, setLoadedTemplateId] = useState<string | null>(null);
  const loadWorkflow = useCanvasStore((state) => state.loadWorkflow);
  const scheduleAutosave = useCanvasStore((state) => state.scheduleAutosave);

  if (!isOpen) return null;

  const categories: { label: string; value: string }[] = [
    { label: 'Todos', value: 'ALL' },
    { label: 'Marketing', value: 'MARKETING' },
    { label: 'Conteúdo', value: 'CONTENT' },
    { label: 'Pesquisa', value: 'RESEARCH' },
    { label: 'Automação', value: 'AUTOMATION' }
  ];

  const filteredTemplates = selectedCategory === 'ALL'
    ? OFFICIAL_TEMPLATES
    : OFFICIAL_TEMPLATES.filter(
        (t) => t.category.toUpperCase() === selectedCategory.toUpperCase()
      );

  const handleApplyTemplate = (template: WorkflowTemplate) => {
    setLoadedTemplateId(template.id);

    if (onSelectTemplate) {
      onSelectTemplate(template);
    } else {
      loadWorkflow({
        id: `wf-tpl-${Date.now()}`,
        name: template.name,
        description: template.description,
        nodes: template.nodes,
        connections: template.connections,
        viewport: { x: 0, y: 0, zoom: 1 },
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      scheduleAutosave();
    }

    setTimeout(() => {
      setLoadedTemplateId(null);
      onClose();
    }, 600);
  };

  const getTemplateIcon = (iconName: string) => {
    switch (iconName) {
      case 'Video':
        return <Video className="h-5 w-5 text-rose-400" />;
      case 'Search':
        return <Search className="h-5 w-5 text-cyan-400" />;
      case 'TrendingUp':
        return <TrendingUp className="h-5 w-5 text-emerald-400" />;
      default:
        return <Sparkles className="h-5 w-5 text-amber-400" />;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
      data-testid="template-library-modal"
    >
      <div 
        className="relative w-full max-w-4xl max-h-[85vh] bg-union-surface border border-union-border rounded-xl shadow-2xl flex flex-col overflow-hidden text-union-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-union-border bg-union-card/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-union-accent/10 border border-union-accent/20 text-union-accent">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Biblioteca de Workflow Templates
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  Oficial UNION.AI
                </span>
              </h2>
              <p className="text-xs text-union-muted">
                Workflows prontos e testados de ponta a ponta com fluxo real de dados e IAs integradas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 rounded-lg text-union-muted hover:text-white hover:bg-union-border/40 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center space-x-2 px-6 py-3 border-b border-union-border bg-union-surface/90 text-xs">
          <span className="text-union-muted font-medium mr-2">Categorias:</span>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-union-accent text-white shadow-sm'
                  : 'bg-union-card text-union-muted hover:text-white hover:bg-union-border/30'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Template List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredTemplates.map((template) => {
            const isLoaded = loadedTemplateId === template.id;
            return (
              <div
                key={template.id}
                className="group p-4 rounded-xl bg-union-card border border-union-border hover:border-union-accent/50 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2.5">
                    {getTemplateIcon(template.icon)}
                    <h3 className="text-sm font-bold text-white group-hover:text-union-accent transition-colors">
                      {template.name}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-union-surface border border-union-border text-union-muted uppercase">
                      {template.category}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400">
                      <Coins className="h-3 w-3" />
                      <span>~{template.estimatedCredits.toFixed(2)} cr</span>
                    </div>
                  </div>

                  <p className="text-xs text-union-muted leading-relaxed">
                    {template.description}
                  </p>

                  {/* Flow pipeline preview */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
                    {template.nodes.map((node, i) => (
                      <React.Fragment key={node.id}>
                        <span className="px-2 py-0.5 rounded bg-union-surface border border-union-border text-zinc-300">
                          {node.label}
                        </span>
                        {i < template.nodes.length - 1 && (
                          <ArrowRight className="h-3 w-3 text-union-muted shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.2 rounded bg-union-accent/5 text-union-accent border border-union-accent/15"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-end">
                  <button
                    onClick={() => handleApplyTemplate(template)}
                    disabled={isLoaded}
                    className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                      isLoaded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-union-accent hover:bg-union-accent/90 text-white'
                    }`}
                  >
                    {isLoaded ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Carregado!</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-3.5 w-3.5" />
                        <span>Carregar no Canvas</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-union-border bg-union-card/30 flex items-center justify-between text-[11px] text-union-muted">
          <span>{filteredTemplates.length} templates disponíveis para instanciação instantânea.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-union-surface border border-union-border text-union-text hover:bg-union-border/30 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
