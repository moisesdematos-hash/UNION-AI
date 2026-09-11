import { useState } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { NODE_TEMPLATES, createNodeFromTemplate } from './nodeRegistry.js';
import { useCanvasStore } from '../../store/canvasStore.js';
import { NodeCategory } from '@union/shared';

interface NodeLibrarySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: NodeCategory[] = [
  'UNDERSTAND',
  'SOURCE',
  'EXTRACTOR',
  'AI',
  'TRANSFORM',
  'OUTPUT'
];

export function NodeLibrarySidebar({ isOpen, onClose }: NodeLibrarySidebarProps) {
  const [search, setSearch] = useState('');
  const { addNode, nodes } = useCanvasStore();

  if (!isOpen) return null;

  const templates = Object.values(NODE_TEMPLATES);
  const filteredTemplates = templates.filter(
    (t) =>
      t.label.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (templateType: string) => {
    const newNodeDef = createNodeFromTemplate(templateType, {
      x: 300 + (nodes.length % 5) * 40,
      y: 150 + (nodes.length % 5) * 40
    });

    addNode({
      id: newNodeDef.id,
      type: 'unionNode',
      position: newNodeDef.position,
      data: newNodeDef as unknown as Record<string, unknown>
    });
    onClose();
  };

  return (
    <aside className="absolute left-14 top-0 bottom-0 w-80 bg-union-surface/95 border-r border-union-border backdrop-blur z-30 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="p-4 border-b border-union-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white tracking-wide">Node Library</h2>
          <p className="text-[11px] text-union-muted">Add specialized AI & Marketing nodes</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-union-muted hover:text-white hover:bg-union-card transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-union-border/60">
        <div className="relative">
          <Search className="h-3.5 w-3.5 text-union-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes (Avatar, VSL, Ads, YouTube)..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-union-card border border-union-border text-xs text-white placeholder:text-union-muted focus:border-union-accent focus:outline-none"
          />
        </div>
      </div>

      {/* Categories & Node List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {CATEGORIES.map((category) => {
          const catTemplates = filteredTemplates.filter((t) => t.category === category);
          if (catTemplates.length === 0) return null;

          return (
            <div key={category} className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-union-muted px-1">
                {category} ({catTemplates.length})
              </span>
              <div className="space-y-1.5">
                {catTemplates.map((template) => (
                  <div
                    key={template.type}
                    onClick={() => handleAdd(template.type)}
                    className="p-3 rounded-xl bg-union-card/60 hover:bg-union-card border border-union-border/60 hover:border-union-accent/50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-semibold text-white group-hover:text-union-accent transition-colors">
                        {template.label}
                      </h4>
                      <span className="p-1 rounded-md bg-union-surface group-hover:bg-union-accent group-hover:text-white text-union-muted transition-colors">
                        <Plus className="h-3 w-3" />
                      </span>
                    </div>
                    <p className="text-[11px] text-union-muted leading-relaxed line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
