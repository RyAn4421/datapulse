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

    const saveDataset = async () => {
        if (!parsed) return;
        setIsSaving(true);

        try {
            const response = await fetch('/api/datasets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsed),
            });

            if (!response.ok) throw new Error('Failed to save');

            const dataset = await response.json();
            setActiveDatasetId(dataset._id);
            await mutate();
            toast.success('Dataset saved!');
            router.push('/dashboard');
        } catch (error) {
            toast.error('Failed to save');
        } finally {
            setIsSaving(false);
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
                                    onClick={saveDataset}
                                    disabled={isSaving}
                                    className="h-9 px-4 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-sm font-medium"
                                >
                                    {isSaving ? 'Saving...' : 'Save Dataset'}
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
