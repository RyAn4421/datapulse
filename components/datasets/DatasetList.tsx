'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Calendar, FileSpreadsheet, Trash2, ArrowRight } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { useDatasets } from '@/hooks/useDataset';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function DatasetList() {
    const router = useRouter();
    const { datasets, isLoading, mutate } = useDatasets();
    const { activeDatasetId, setActiveDatasetId } = useStore();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-48 bg-bg-card border border-border rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (!datasets || datasets.length === 0) {
        return (
            <div className="text-center py-12 border border-border border-dashed rounded-xl mt-6">
                <Database className="w-10 h-10 text-text-muted mx-auto mb-2 opacity-40" />
                <p className="text-text-muted text-sm">No datasets uploaded yet.</p>
            </div>
        );
    }

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if(!confirm("Are you sure you want to delete this dataset? This will remove all associated rows and insights permanently.")) return;
        
        try {
             const res = await fetch(`/api/datasets/${id}`, { method: 'DELETE' });
             if (!res.ok) throw new Error("Delete failed");
             
             toast.success("Dataset deleted");
             if(activeDatasetId === id) setActiveDatasetId(null);
             mutate();
        } catch (error) {
             toast.error("Failed to delete dataset");
        }
    };

    const startEdit = (id: string, currentName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(id);
        setEditName(currentName);
    };

    const handleRename = async (id: string, e?: React.FormEvent | React.FocusEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!editName.trim() || editName === datasets.find((d: any) => d._id === id)?.name) {
            setEditingId(null);
            return;
        }

        try {
            const res = await fetch(`/api/datasets/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName.trim() }),
            });
            if (!res.ok) throw new Error("Rename failed");
            toast.success("Dataset renamed");
            mutate();
        } catch (error) {
            toast.error("Failed to rename dataset");
        } finally {
            setEditingId(null);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
            <AnimatePresence>
                {datasets.map((dataset: any) => {
                    const isActive = activeDatasetId === dataset._id;

                    return (
                        <motion.div
                            key={dataset._id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                            whileHover={{ y: -4 }}
                            onClick={() => {
                                if (editingId !== dataset._id) {
                                    setActiveDatasetId(dataset._id);
                                    fetch('/api/activity', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            type: 'dataset_viewed',
                                            label: `Viewed dataset: ${dataset.name}`,
                                            datasetId: dataset._id,
                                            datasetName: dataset.name
                                        })
                                    }).catch(() => {});
                                    router.push('/dashboard');
                                }
                            }}
                            className={`p-5 rounded-xl border flex flex-col cursor-pointer transition-colors relative overflow-hidden group ${
                                isActive ? 'bg-bg-card border-accent shadow-[0_0_0_1px_var(--accent-subtle)]' : 'bg-bg-card border-border hover:border-border-strong'
                            }`}
                        >
                             <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                             
                             <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-bg-hover border border-border flex items-center justify-center shrink-0">
                                        <FileSpreadsheet className="w-5 h-5 text-text-muted" />
                                    </div>
                                    <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                                         {editingId === dataset._id ? (
                                             <form onSubmit={(e) => handleRename(dataset._id, e)}>
                                                 <input 
                                                     autoFocus
                                                     value={editName}
                                                     onChange={(e) => setEditName(e.target.value)}
                                                     onBlur={(e) => handleRename(dataset._id, e)}
                                                     className="font-serif font-medium text-text bg-bg border border-accent rounded px-1 outline-none w-full"
                                                 />
                                             </form>
                                         ) : (
                                             <h3 
                                                 className="font-serif font-medium text-text line-clamp-1 hover:text-accent transition-colors"
                                                 onClick={(e) => startEdit(dataset._id, dataset.name, e)}
                                                 title="Click to rename"
                                             >
                                                 {dataset.name}
                                             </h3>
                                         )}
                                         <div className="flex items-center text-xs text-text-muted gap-2 mt-0.5 font-mono">
                                             <span className="uppercase">{dataset.source || 'csv'}</span>
                                             <span>•</span>
                                             <span>{formatNumber(dataset.rowCount)} rows</span>
                                         </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={(e) => handleDelete(dataset._id, e)}
                                    className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                             </div>

                             <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
                                 <div className="flex items-center gap-1.5 text-xs text-text-muted font-mono">
                                     <Calendar className="w-3.5 h-3.5" />
                                     <span>{new Date(dataset.createdAt).toLocaleDateString()}</span>
                                 </div>
                                 <div className={`flex items-center gap-1 text-xs font-mono tracking-wider uppercase ${isActive ? 'text-accent' : 'text-text-muted opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                                     {isActive ? 'Active' : 'Load'} <ArrowRight className="w-4 h-4" />
                                 </div>
                             </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
