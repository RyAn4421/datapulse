'use client';
import { useState } from 'react';
import { Upload, FileType, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import * as xlsx from 'xlsx';
import { useDatasets } from '@/hooks/useDataset';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { DataRow } from '@/lib/utils';

interface ParsedUpload {
    name: string;
    source: 'csv' | 'xlsx';
    headers: string[];
    rows: DataRow[];
}

interface UploadZoneProps {
    onParsed?: (upload: ParsedUpload) => void;
}

export function UploadZone({ onParsed }: UploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);
    const { mutate } = useDatasets();
    const { setActiveDatasetId } = useStore();

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    };

    const processFile = async (file: File) => {
        setIsProcessing(true);
        setSelectedFile({ name: file.name, size: file.size });
        setProgress(10);
        
        try {
            let data: DataRow[] = [];
            let headers: string[] = [];
            const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

            setProgress(30);

            if (file.name.endsWith('.csv')) {
                const text = await file.text();
                setProgress(60);
                const result = Papa.parse(text, { 
                    header: true, 
                    dynamicTyping: true, 
                    skipEmptyLines: true 
                });
                data = result.data as DataRow[];
                headers = result.meta.fields || [];
            } else if (isExcel) {
                const arrayBuffer = await file.arrayBuffer();
                setProgress(60);
                const workbook = xlsx.read(arrayBuffer, { type: 'buffer' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                data = xlsx.utils.sheet_to_json(firstSheet, { defval: null }) as DataRow[];
                if (data.length > 0) {
                    headers = Object.keys(data[0] as object);
                }
            } else {
                throw new Error("Unsupported file type. Please upload a CSV or Excel file.");
            }

            setProgress(80);

            if (data.length === 0) {
                throw new Error("File appears to contain no data rows.");
            }

            if (onParsed) {
                onParsed({
                    name: file.name.replace(/\.[^/.]+$/, ""), // strip extension
                    source: isExcel ? 'xlsx' : 'csv',
                    headers,
                    rows: data,
                });
                toast.success('File parsed successfully');
                setProgress(100);
                setTimeout(() => {
                    setIsProcessing(false);
                    setProgress(0);
                }, 500);
                return;
            }
            
            // Analyze columns for direct upload (if onParsed is not provided)
            const numericCols: string[] = [];
            const categoricalCols: string[] = [];
            
            headers.forEach(h => {
                const sample = data[0][h];
                if (typeof sample === 'number') numericCols.push(h);
                else categoricalCols.push(h);
            });

            // Create dataset metadata
            const metadataRes = await fetch('/api/datasets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    source: isExcel ? 'xlsx' : 'csv',
                    headers,
                    rows: data
                })
            });

            if (!metadataRes.ok) throw new Error("Failed to save dataset");
            
            const dataset = await metadataRes.json();
            setProgress(100);
            toast.success("Dataset uploaded successfully");
            
            mutate();
            setActiveDatasetId(dataset._id);
            
            setTimeout(() => {
                setIsProcessing(false);
                setProgress(0);
                setSelectedFile(null);
            }, 500);

        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Failed to process file");
            setIsProcessing(false);
            setProgress(0);
            setSelectedFile(null);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = 2;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return (
        <div 
            className={`relative w-full rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-12 overflow-hidden
                ${isDragging ? 'border-iris-500 bg-iris-500/5 scale-[1.01]' : 'border-void-500 bg-void-800/30 hover:border-void-400'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" 
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                        processFile(e.target.files[0]);
                    }
                }}
                disabled={isProcessing}
            />
            
            <AnimatePresence mode="wait">
                {!isProcessing ? (
                    <motion.div 
                        key="upload"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col items-center text-center pointer-events-none"
                    >
                        <div className="w-16 h-16 rounded-full bg-void-700 border border-void-600/30 flex items-center justify-center mb-4">
                            <Upload className={`w-8 h-8 ${isDragging ? 'text-iris-400' : 'text-ink-300'}`} />
                        </div>
                        <h3 className="text-lg font-serif text-ink-100 font-semibold mb-2">Drag & drop your data</h3>
                        <p className="text-sm text-ink-300 max-w-sm mb-6">
                            Supports CSV and Excel (.xlsx, .xls) files. We&apos;ll automatically detect columns and data types.
                        </p>
                        
                        <div className="flex gap-4">
                             <span className="flex items-center gap-1.5 text-xs text-ink-300 font-mono bg-void-800 px-3 py-1.5 rounded-md border border-void-600/30"><FileType className="w-3.5 h-3.5"/> CSV</span>
                             <span className="flex items-center gap-1.5 text-xs text-ink-300 font-mono bg-void-800 px-3 py-1.5 rounded-md border border-void-600/30"><FileType className="w-3.5 h-3.5"/> EXCEL</span>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="processing"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center w-full max-w-md pointer-events-none"
                    >
                        <Loader2 className="w-8 h-8 text-iris-500 animate-spin mb-4" />
                        {selectedFile && (
                            <div className="text-center mb-3">
                                <span className="block text-sm text-ink-100 font-medium truncate max-w-xs">{selectedFile.name}</span>
                                <span className="block text-xs text-ink-300 font-mono mt-0.5">{formatBytes(selectedFile.size)}</span>
                            </div>
                        )}
                        <div className="w-full h-1.5 bg-void-800 rounded-full overflow-hidden mb-2">
                            <motion.div 
                                className="h-full bg-gradient-to-r from-iris-500 to-aqua-400"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.2 }}
                            />
                        </div>
                        <div className="flex justify-between w-full text-[10px] font-mono tracking-wider uppercase">
                            <span className="text-ink-300">Parsing sheet...</span>
                            <span className="text-iris-400">{progress}%</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
