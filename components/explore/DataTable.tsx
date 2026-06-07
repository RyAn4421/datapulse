'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRows } from '@/hooks/useRows';
import { useStore } from '@/lib/store';
import { useDataset } from '@/hooks/useDataset';
import { useInsights } from '@/hooks/useInsights';
import { Search, ChevronDown, ChevronUp, Download, EyeOff, Loader2 } from 'lucide-react';
import { formatNumber, cn } from '@/lib/utils';
import { toast } from 'sonner';
import Papa from 'papaparse';

function hashStringToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

function highlight(text: string, query: string) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-iris-500/30 text-iris-400 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function DataTable() {
    const { 
        activeDatasetId, 
        search, 
        setSearch, 
        page, 
        setPage,
        activeDataset,
        setActiveDataset
    } = useStore();

    const { dataset: fetchedDataset } = useDataset(activeDatasetId);
    
    useEffect(() => {
        if (fetchedDataset) {
            setActiveDataset(fetchedDataset);
        }
    }, [fetchedDataset]);

    const [searchTerm, setSearchTerm] = useState(search);

    useEffect(() => {
        const handler = setTimeout(() => {
            setSearch(searchTerm);
            setPage(1);
        }, 250);
        return () => clearTimeout(handler);
    }, [searchTerm, setSearch, setPage]);

    useEffect(() => {
        setSearchTerm(search);
    }, [search]);

    const [sortState, setSortState] = useState<{ col: string; dir: 'asc' | 'desc' } | null>(null);

    const { rowsData, isLoading } = useRows({
        datasetId: activeDatasetId,
        page,
        limit: 25,
        search
    });

    const { insights } = useInsights(activeDatasetId);

    const headers = activeDataset?.headers || [];
    const rawCategoricalCols = activeDataset?.categoricalCols || [];
    const rawNumericCols = activeDataset?.numericCols || [];

    const [typeOverrides, setTypeOverrides] = useState<Record<string, string>>({});
    
    useEffect(() => {
        if (!activeDatasetId || !headers) return;
        const overrides: Record<string, string> = {};
        headers.forEach((h: string) => {
            const saved = localStorage.getItem(`${activeDatasetId}-${h}-type`);
            if (saved) overrides[h] = saved;
        });
        setTypeOverrides(overrides);
    }, [activeDatasetId, headers]);

    const toggleType = (e: React.MouseEvent, header: string) => {
        e.stopPropagation();
        const isNumeric = typeOverrides[header] ? typeOverrides[header] === 'numeric' : rawNumericCols.includes(header);
        const newType = isNumeric ? 'text' : 'numeric';
        localStorage.setItem(`${activeDatasetId}-${header}-type`, newType);
        setTypeOverrides(prev => ({ ...prev, [header]: newType }));
    };

    const handleSort = (col: string) => {
        if (sortState?.col === col) {
            setSortState({
                col,
                dir: sortState.dir === 'asc' ? 'desc' : 'asc'
            });
        } else {
            setSortState({ col, dir: 'asc' });
        }
    };

    const sortedRows = useMemo(() => {
        const rawRows = rowsData?.rows || [];
        if (!sortState) return rawRows;

        const { col, dir } = sortState;
        return [...rawRows].sort((a, b) => {
            const aVal = a[col];
            const bVal = b[col];

            if (aVal === bVal) return 0;
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            const numA = Number(aVal);
            const numB = Number(bVal);

            if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
                return dir === 'asc' ? numA - numB : numB - numA;
            }

            return dir === 'asc' 
                ? String(aVal).localeCompare(String(bVal)) 
                : String(bVal).localeCompare(String(aVal));
        });
    }, [rowsData?.rows, sortState]);

    const handleExportAll = () => {
        if (!activeDataset?.rows || activeDataset.rows.length === 0) {
            toast.error('No rows available to export');
            return;
        }
        try {
            const csv = Papa.unparse(activeDataset.rows);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${activeDataset.name || 'dataset'}_export.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success('Dataset exported as CSV successfully!');
        } catch (error) {
            console.error('CSV Export Error:', error);
            toast.error('Failed to export CSV');
        }
    };

    if (!activeDatasetId) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-ink-300 text-center p-6">
                <EyeOff className="w-12 h-12 mb-4 opacity-40 animate-pulse" />
                <h3 className="text-lg font-serif font-semibold text-ink-100 mb-1">No dataset selected</h3>
                <p className="text-sm text-ink-300">Choose a dataset from the sidebar to inspect records</p>
            </div>
        );
    }

    const startRecord = rowsData?.total ? (page - 1) * 25 + 1 : 0;
    const endRecord = Math.min(page * 25, rowsData?.total || 0);

    const getPageRange = () => {
        const totalPages = rowsData?.totalPages || 1;
        const pages: number[] = [];
        const maxVisible = 5;
        let start = Math.max(1, page - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);
        
        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }
        
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] border border-void-500/50 rounded-xl overflow-hidden bg-void-900 shadow-xl relative">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-void-500/30 bg-void-900 shrink-0">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                    <input 
                        type="text" 
                        placeholder="Search all columns..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-void-950 border border-void-500/50 rounded-lg pl-9 pr-3 py-2 text-sm text-ink-100 placeholder:text-ink-300 focus:outline-none focus:border-iris-500 focus:ring-1 focus:ring-iris-500 transition-all font-sans"
                    />
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                     <span className="text-xs font-mono text-ink-300 bg-void-950 px-2.5 py-1.5 rounded-lg border border-void-600/30">
                         {formatNumber(rowsData?.total || 0)} records
                     </span>
                     <button 
                        onClick={handleExportAll}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono tracking-wider uppercase text-ink-200 bg-void-800 hover:bg-void-700 border border-void-500/50 rounded-lg transition-colors shadow-sm"
                    >
                         <Download className="w-3.5 h-3.5"/> Export CSV
                     </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-void-950 relative no-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 z-10 bg-void-800/95 backdrop-blur-md border-b border-void-500/50 shadow-sm">
                        <tr>
                            <th className="w-16 px-4 py-3 font-mono text-[10px] tracking-wider uppercase text-ink-300 border-r border-void-700/35 align-bottom">#</th>
                            {headers.map((header: string) => {
                                const isNum = typeOverrides[header] ? typeOverrides[header] === 'numeric' : rawNumericCols.includes(header);
                                return (
                                <th 
                                    key={header} 
                                    className="px-4 py-3 font-mono text-[10px] tracking-wider uppercase text-ink-200 whitespace-nowrap cursor-pointer hover:bg-void-750 transition-colors select-none group border-r border-void-700/10 align-bottom"
                                    onClick={() => handleSort(header)}
                                >
                                    <div className="flex flex-col gap-1 items-start">
                                        <span 
                                            onClick={(e) => toggleType(e, header)}
                                            className="px-1.5 py-0.5 bg-void-800 border border-void-600/50 rounded text-[9px] cursor-pointer hover:bg-void-700 text-ink-300 transition-colors"
                                            title="Click to toggle type"
                                        >
                                            {isNum ? 'Numeric' : 'Text'}
                                        </span>
                                        <div className={`flex items-center gap-1 ${isNum ? 'justify-end w-full' : ''}`}>
                                            {header}
                                            <span className="inline-flex shrink-0">
                                                {sortState?.col === header ? (
                                                    sortState.dir === 'asc' ? (
                                                        <ChevronUp className="w-3.5 h-3.5 text-iris-400 opacity-100" />
                                                    ) : (
                                                        <ChevronDown className="w-3.5 h-3.5 text-iris-400 opacity-100" />
                                                    )
                                                ) : (
                                                    <ChevronUp className="w-3.5 h-3.5 text-ink-300 opacity-0 group-hover:opacity-40 transition-opacity" />
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </th>
                            )})}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-void-800/30">
                        {isLoading ? (
                             <tr>
                                 <td colSpan={headers.length + 1} className="py-16 text-center text-ink-300">
                                     <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-iris-500" />
                                     <span>Loading dataset records...</span>
                                 </td>
                             </tr>
                        ) : sortedRows.length === 0 ? (
                             <tr>
                                 <td colSpan={headers.length + 1} className="py-16 text-center text-ink-300 font-serif">
                                     No records match search filter.
                                 </td>
                             </tr>
                        ) : (
                            sortedRows.map((row: Record<string, unknown>, i: number) => (
                                <tr key={i} className="hover:bg-void-800/40 transition-colors border-b border-void-700/20">
                                    <td className="px-4 py-2 font-mono text-[10px] text-ink-300 border-r border-void-700/30 bg-void-900/10">
                                        {(page - 1) * 25 + i + 1}
                                    </td>
                                    {headers.map((header: string) => {
                                        const value = row[header];
                                        const isNumeric = typeOverrides[header] ? typeOverrides[header] === 'numeric' : rawNumericCols.includes(header);
                                        const isCategorical = typeOverrides[header] ? typeOverrides[header] === 'text' : rawCategoricalCols.includes(header);
                                        
                                        let content: React.ReactNode = String(value ?? '');
                                        
                                        if (value === null || value === undefined || value === '') {
                                            content = <span className="text-ink-300 italic opacity-40">null</span>;
                                        } else if (typeof value === 'boolean') {
                                             content = (
                                                 <span className={`inline-block w-2.5 h-2.5 rounded-full ${value ? 'bg-emerald-500 shadow-sm shadow-emerald-500/20' : 'bg-rose-500 shadow-sm shadow-rose-500/20'}`} title={value.toString()} />
                                             );
                                        } else if (isCategorical && typeof value === 'string') {
                                             const uniqueCats = insights?.topCategories?.[header] 
                                                 ? Object.keys(insights.topCategories[header]).length 
                                                 : 0;

                                             if (uniqueCats > 0 && uniqueCats <= 8) {
                                                 const hue = hashStringToHue(value);
                                                 content = (
                                                     <span 
                                                         className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium border"
                                                         style={{ 
                                                             backgroundColor: `hsl(${hue}, 60%, 15%)`, 
                                                             color: `hsl(${hue}, 60%, 75%)`,
                                                             borderColor: `hsl(${hue}, 60%, 25%)`
                                                         }}
                                                     >
                                                         {highlight(value, search)}
                                                     </span>
                                                 );
                                             } else if (value.length > 40) {
                                                 content = <span title={value}>{highlight(value.substring(0, 40) + '...', search)}</span>;
                                             } else {
                                                 content = highlight(value, search);
                                             }
                                        } else if (isNumeric) {
                                             content = <span className="font-mono tabular-nums text-ink-100">{highlight(Number(value).toLocaleString(), search)}</span>;
                                        } else if (typeof value === 'string' && value.length > 40) {
                                             content = <span title={value}>{highlight(value.substring(0, 40) + '...', search)}</span>;
                                        } else if (typeof value === 'string') {
                                             content = highlight(value, search);
                                        } else {
                                             content = highlight(String(value), search);
                                        }

                                        return (
                                            <td key={header} className={`px-4 py-2 border-r border-void-700/5 ${isNumeric ? 'text-right' : 'text-ink-200'}`}>
                                                {content}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-t border-void-500/30 bg-void-900 shrink-0 font-mono text-xs">
                 <div className="text-ink-300 text-center sm:text-left">
                      Showing <span className="font-medium text-ink-100">{startRecord}</span>–<span className="font-medium text-ink-100">{endRecord}</span> of <span className="font-medium text-ink-100">{formatNumber(rowsData?.total || 0)}</span> records
                 </div>
                 <div className="flex justify-center gap-1">
                      <button 
                         disabled={page === 1 || isLoading}
                         onClick={() => setPage(page - 1)}
                         className="px-2.5 py-1.5 bg-void-850 hover:bg-void-750 disabled:opacity-40 disabled:cursor-not-allowed border border-void-600/30 rounded text-[11px] transition-colors"
                      >
                          Prev
                      </button>
                      
                      {getPageRange().map((p) => (
                          <button
                             key={p}
                             onClick={() => setPage(p)}
                             className={cn(
                                 "px-2.5 py-1.5 text-[11px] rounded border transition-colors",
                                 p === page 
                                     ? "bg-iris-500 text-white border-iris-500 shadow-md shadow-iris-500/10" 
                                     : "bg-void-850 border-void-600/30 text-ink-300 hover:text-ink-100 hover:bg-void-750"
                             )}
                          >
                              {p}
                          </button>
                      ))}

                      <button 
                         disabled={page >= (rowsData?.totalPages || 1) || isLoading}
                         onClick={() => setPage(page + 1)}
                         className="px-2.5 py-1.5 bg-void-850 hover:bg-void-750 disabled:opacity-40 disabled:cursor-not-allowed border border-void-600/30 rounded text-[11px] transition-colors"
                      >
                          Next
                      </button>
                 </div>
            </div>
        </div>
    );
}
