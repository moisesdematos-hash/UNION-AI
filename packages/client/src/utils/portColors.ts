import { DataType } from '@union/shared';

export interface DataTypeStyle {
  color: string;
  bgLight: string;
  borderColor: string;
  badgeBg: string;
  label: string;
}

export const DATA_TYPE_STYLES: Record<DataType, DataTypeStyle> = {
  TEXT: {
    color: '#10b981', // emerald-500
    bgLight: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    label: 'Text'
  },
  URL: {
    color: '#3b82f6', // blue-500
    bgLight: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3b82f6',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    label: 'URL'
  },
  VIDEO: {
    color: '#ef4444', // red-500
    bgLight: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
    badgeBg: 'bg-red-500/10 text-red-400 border-red-500/30',
    label: 'Video'
  },
  IMAGE: {
    color: '#ec4899', // pink-500
    bgLight: 'rgba(236, 72, 153, 0.15)',
    borderColor: '#ec4899',
    badgeBg: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    label: 'Image'
  },
  AUDIO: {
    color: '#f97316', // orange-500
    bgLight: 'rgba(249, 115, 22, 0.15)',
    borderColor: '#f97316',
    badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    label: 'Audio'
  },
  DOCUMENT: {
    color: '#f59e0b', // amber-500
    bgLight: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    label: 'Document'
  },
  JSON: {
    color: '#eab308', // yellow-500
    bgLight: 'rgba(234, 179, 8, 0.15)',
    borderColor: '#eab308',
    badgeBg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    label: 'JSON'
  },
  TABLE: {
    color: '#06b6d4', // cyan-500
    bgLight: 'rgba(6, 182, 212, 0.15)',
    borderColor: '#06b6d4',
    badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    label: 'Table'
  },
  TRANSCRIPT: {
    color: '#a855f7', // purple-500
    bgLight: 'rgba(168, 85, 247, 0.15)',
    borderColor: '#a855f7',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    label: 'Transcript'
  },
  METADATA: {
    color: '#94a3b8', // slate-400
    bgLight: 'rgba(148, 163, 184, 0.15)',
    borderColor: '#94a3b8',
    badgeBg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    label: 'Metadata'
  },
  AI_RESPONSE: {
    color: '#6366f1', // indigo-500
    bgLight: 'rgba(99, 102, 241, 0.15)',
    borderColor: '#6366f1',
    badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    label: 'AI Response'
  }
};

export function getDataTypeStyle(type: DataType): DataTypeStyle {
  return DATA_TYPE_STYLES[type] || DATA_TYPE_STYLES.TEXT;
}
