'use client';
import { PageTransition } from '@/components/layout/PageTransition';
import { DataTable } from '@/components/explore/DataTable';

export default function ExplorePage() {
    return (
        <PageTransition className="p-6 max-w-[1600px] mx-auto h-full flex flex-col">
            <h1 className="text-2xl font-semibold text-ink-100 mb-6 shrink-0">Data Explorer</h1>
            <div className="flex-1 min-h-0">
                <DataTable />
            </div>
        </PageTransition>
    );
}
