declare module 'sheetjs' {
  export = XLSX;
}

declare global {
  interface Window { XLSX: typeof XLSX; }
}

export as namespace XLSX;