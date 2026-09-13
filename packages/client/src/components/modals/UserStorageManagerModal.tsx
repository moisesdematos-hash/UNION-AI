import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FileText, 
  Download, 
  Trash2, 
  RefreshCw, 
  X, 
  HardDrive, 
  BookOpen, 
  Workflow, 
  Layers, 
  AlertCircle,
  FileCode,
  FolderOpen
} from 'lucide-react';
import { StorageService } from '../../services/storageService.js';
import { useCanvasStore } from '../../store/canvasStore.js';

interface UserStorageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserFile {
  name: string;
  relativePath: string;
  category: 'projects' | 'ebooks' | 'assets';
  sizeBytes: number;
  updatedAt: number;
  mimeType?: string;
}

interface StorageData {
  userId: string;
  userDir: string;
  totalFiles: number;
  totalSizeBytes: number;
  categories: {
    projects: UserFile[];
    ebooks: UserFile[];
    assets: UserFile[];
  };
}

export const UserStorageManagerModal: React.FC<UserStorageManagerModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'ebooks' | 'assets'>('projects');
  const [storageData, setStorageData] = useState<StorageData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<{ title: string; content: string } | null>(null);

  const loadWorkflow = useCanvasStore((state) => state.loadWorkflow);
  const scheduleAutosave = useCanvasStore((state) => state.scheduleAutosave);

  const fetchOverview = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await StorageService.fetchUserStorageOverview();
      if (data) {
        setStorageData(data);
      } else {
        // Fallback demo/local preview if backend offline or no token
        setStorageData({
          userId: 'local-workspace-user',
          userDir: 'packages/server/data/users/local-workspace-user',
          totalFiles: 0,
          totalSizeBytes: 0,
          categories: {
            projects: [],
            ebooks: [],
            assets: []
          }
        });
      }
    } catch {
      setErrorMsg('Não foi possível conectar ao servidor de armazenamento.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOverview();
      setPreviewContent(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (ms: number): string => {
    return new Date(ms).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadFile = async (category: string, fileName: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('union_auth_token') : null;
      const res = await fetch(`/api/projects/storage/file/${category}/${fileName}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Falha ao baixar arquivo');
      const json = await res.json();
      const content = json.data.content;

      const element = document.createElement('a');
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(blob);
      element.download = fileName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (e: any) {
      alert(`Erro ao baixar: ${e.message}`);
    }
  };

  const handleViewOrRestore = async (file: UserFile) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('union_auth_token') : null;
      const res = await fetch(`/api/projects/storage/file/${file.category}/${file.name}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Falha ao abrir arquivo');
      const json = await res.json();
      const content = json.data.content;

      if (file.category === 'projects' && file.name.endsWith('.json')) {
        const parsed = JSON.parse(content);
        if (parsed.nodes && parsed.connections) {
          if (confirm(`Deseja carregar o projeto "${parsed.name || file.name}" no Canvas agora?`)) {
            loadWorkflow(parsed);
            scheduleAutosave();
            onClose();
            return;
          }
        }
      }

      setPreviewContent({
        title: file.name,
        content
      });
    } catch (e: any) {
      alert(`Erro ao abrir: ${e.message}`);
    }
  };

  const handleDelete = async (category: string, fileName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o arquivo "${fileName}" da sua pasta?`)) {
      return;
    }
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('union_auth_token') : null;
      const res = await fetch(`/api/projects/storage/file/${category}/${fileName}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Falha ao excluir');
      fetchOverview();
    } catch (e: any) {
      alert(`Erro ao excluir: ${e.message}`);
    }
  };

  const currentCategoryFiles = storageData?.categories[activeTab] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Pastas do Usuário & Armazenamento Local
                </h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Isolamento Ativo
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Seus projetos, e-books e assets salvos em pasta dedicada no disco do servidor
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchOverview}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
              title="Recarregar arquivos"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Directory Info Ribbon */}
        {storageData && (
          <div className="px-6 py-2.5 bg-zinc-950/40 border-b border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 font-mono">
            <div className="flex items-center space-x-2 truncate">
              <HardDrive className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
              <span className="text-zinc-500">Localização em Disco:</span>
              <span className="text-zinc-300 font-semibold truncate" title={storageData.userDir}>
                {storageData.userDir}
              </span>
            </div>
            <div className="flex items-center space-x-4 flex-shrink-0">
              <span>Arquivos: <strong className="text-white">{storageData.totalFiles}</strong></span>
              <span>Uso: <strong className="text-amber-400">{formatSize(storageData.totalSizeBytes)}</strong></span>
            </div>
          </div>
        )}

        {/* Categories Tabs */}
        <div className="px-6 border-b border-zinc-800 flex items-center space-x-2 bg-zinc-900/50">
          <button
            onClick={() => { setActiveTab('projects'); setPreviewContent(null); }}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 cursor-pointer ${
              activeTab === 'projects'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Workflow className="h-4 w-4" />
            <span>Projetos & Snapshots ({storageData?.categories.projects.length || 0})</span>
          </button>

          <button
            onClick={() => { setActiveTab('ebooks'); setPreviewContent(null); }}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 cursor-pointer ${
              activeTab === 'ebooks'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>E-books & Manuais ({storageData?.categories.ebooks.length || 0})</span>
          </button>

          <button
            onClick={() => { setActiveTab('assets'); setPreviewContent(null); }}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 cursor-pointer ${
              activeTab === 'assets'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Mídias & Assets ({storageData?.categories.assets.length || 0})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {previewContent ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileCode className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">{previewContent.title}</h3>
                </div>
                <button
                  onClick={() => setPreviewContent(null)}
                  className="px-3 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  Voltar para lista
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-mono overflow-auto max-h-[350px] whitespace-pre-wrap leading-relaxed">
                {previewContent.content}
              </pre>
            </div>
          ) : currentCategoryFiles.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/20">
              <Folder className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-400">Nenhum arquivo nesta pasta ainda</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                {activeTab === 'projects'
                  ? 'Os projetos salvos no canvas sincronizam automaticamente para cá quando você salva ou exporta.'
                  : activeTab === 'ebooks'
                  ? 'Ao gerar e baixar um e-book no Union Forge, ele é gravado automaticamente nesta pasta.'
                  : 'Assets e imagens geradas ficarão disponíveis nesta pasta.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {currentCategoryFiles.map((file) => (
                <div
                  key={file.name}
                  className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 group-hover:text-amber-400 group-hover:border-amber-500/30 transition-colors flex-shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium text-white truncate group-hover:text-amber-300 transition-colors">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-zinc-500 font-mono">
                        {formatSize(file.sizeBytes)} • Atualizado em {formatDate(file.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleViewOrRestore(file)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <span>{activeTab === 'projects' ? 'Abrir no Canvas' : 'Visualizar'}</span>
                    </button>
                    <button
                      onClick={() => handleDownloadFile(file.category, file.name)}
                      title="Baixar arquivo"
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(file.category, file.name)}
                      title="Excluir arquivo"
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-900/60 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-400">
          <span>
            Cada usuário possui sua própria pasta isolada protegida por autenticação.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
