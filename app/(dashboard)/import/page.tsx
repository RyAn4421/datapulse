'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { DatasetList } from '@/components/datasets/DatasetList';
import { UploadZone } from '@/components/datasets/UploadZone';
import { useDatasets } from '@/hooks/useDataset';
import { useStore } from '@/lib/store';
import type { DataRow } from '@/lib/utils';

interface ParsedUpload {
    name: string;
    source: string;
    headers: string[];
    rows: DataRow[];
}

export default function ImportPage() {
    const router = useRouter();
    const { mutate } = useDatasets();
    const setActiveDatasetId = useStore((state) => state.setActiveDatasetId);
    const [parsed, setParsed] = useState<ParsedUpload | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveProgress, setSaveProgress] = useState(0);

    const handleSave = async () => {
        if (!parsed) return;
        setIsSaving(true);

        try {
            const BATCH_SIZE = 500;
            const firstBatch = parsed.rows.slice(0, BATCH_SIZE);

            const res = await fetch('/api/datasets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: parsed.name,
                    source: parsed.source,
                    headers: parsed.headers,
                    rows: firstBatch,
                    rowCount: parsed.rows.length,
                }),
            });

            if (!res.ok) throw new Error('Failed to save dataset');
            const dataset = await res.json();

            // Step 2 — send remaining rows in batches
            const remainingRows = parsed.rows.slice(BATCH_SIZE);
            const batches = [];
            for (let i = 0; i < remainingRows.length; i += BATCH_SIZE) {
                batches.push(remainingRows.slice(i, i + BATCH_SIZE));
            }

            for (let i = 0; i < batches.length; i++) {
                await fetch(`/api/datasets/${dataset._id}/rows`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rows: batches[i] }),
                });
                const pct = Math.round(((i + 1) / batches.length) * 100);
                setSaveProgress(pct);
            }

            setActiveDatasetId(dataset._id);
            await mutate();
            toast.success('Dataset saved!');
            router.push('/dashboard');
        } catch (error) {
            toast.error('Failed to save dataset');
        } finally {
            setIsSaving(false);
            setSaveProgress(0);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} className="p-6 max-w-[1600px] mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-semibold text-ink-100">Import Data</h1>
                <p className="text-sm text-ink-300 mt-1">Upload CSV or Excel to start analysing</p>
            </div>

            <section>
                <DatasetList />
            </section>

            <section className="space-y-4">
                <UploadZone onParsed={setParsed} />
                <AnimatePresence>
                    {parsed && (
                        <motion.div
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            className="relative bg-bg-card border border-border rounded-xl p-5 overflow-hidden"
                        >
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <div className="flex items-center justify-between gap-4 mb-4">
                                <div>
                                    <h2 className="text-sm font-semibold text-text">{parsed.name}</h2>
                                    <p className="text-xs text-text-muted">{parsed.rows.length.toLocaleString()} rows ready to save</p>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {saveProgress > 0 ? `Saving... ${saveProgress}%` : 'Saving...'}
                                        </>
                                    ) : 'Save Dataset'}
                                </motion.button>
                            </div>

                            {/* Feature 6: Data Summary Card */}
                            <div className="mb-4 flex flex-wrap gap-4 text-sm bg-bg p-3 rounded-lg border border-border font-mono text-xs">
                                <span className="flex items-center gap-1.5"><span className="text-success">✓</span> {parsed.rows.length} rows detected</span>
                                <span className="flex items-center gap-1.5"><span className="text-success">✓</span> {parsed.headers.length} columns</span>
                                <span className="flex items-center gap-1.5"><span className="text-success">✓</span> {parsed.headers.filter(h => parsed.rows.slice(0,20).some(r => !isNaN(Number(r[h])) && r[h] !== '')).length} numeric</span>
                                <span className="flex items-center gap-1.5"><span className="text-success">✓</span> {parsed.headers.filter(h => parsed.rows.slice(0,20).some(r => isNaN(Number(r[h])) && r[h] !== '')).length} categorical</span>
                                <span className="flex items-center gap-1.5"><span className="text-warning">⚠</span> {parsed.rows.reduce((acc, row) => acc + parsed.headers.filter(h => row[h] === null || row[h] === undefined || row[h] === '').length, 0)} empty cells</span>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-border">
                                <table className="w-full text-sm">
                                    <thead className="bg-bg">
                                        <tr>
                                            {parsed.headers.map((header) => (
                                                <th key={header} className="px-3 py-2 text-left text-xs font-mono text-text-muted whitespace-nowrap">{header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsed.rows.slice(0, 8).map((row, rowIndex) => (
                                            <tr key={rowIndex} className="border-t border-border">
                                                {parsed.headers.map((header) => (
                                                    <td key={header} className="px-3 py-2 text-text-muted whitespace-nowrap">{String(row[header] ?? '')}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>
        </motion.div>
    );
}
