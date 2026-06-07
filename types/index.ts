export interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
}

export interface Dataset {
    _id: string;
    name: string;
    description?: string;
    fileName: string;
    fileType: string;
    source?: string;
    headers: string[];
    rowCount: number;
    numericCols: string[];
    categoricalCols: string[];
    tags: string[];
    createdAt: string;
    rows?: any[];
}

export interface DatasetMeta {
    _id: string;
    name: string;
    source?: string;
    rowCount: number;
    createdAt: string;
}

export interface RowData {
    [key: string]: any;
}
