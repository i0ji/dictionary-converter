'use client';
import React, { useState, useCallback, useRef } from 'react';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import styles from './FileUploader.module.scss';

export default function FileUploader() {
  const [excelBuffer, setExcelBuffer] = useState<Uint8Array | null>(null);
  const [parsedRows, setParsedRows] = useState<string[][] | null>(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'processing' | 'ready' | 'saving'>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setPhase('processing');
    setProgress(10);
    setIsDisabled(true);

    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      const totalLines = lines.length;
      const rows: string[][] = [];

      for (let i = 0; i < totalLines; i++) {
        rows.push(lines[i].split('^'));
        if (i % 100 === 0) {
          setProgress(20 + Math.round((i / totalLines) * 50));
        }
      }

      setParsedRows(rows);
      setProgress(80);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data');

      rows.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          worksheet.getCell(rowIndex + 1, colIndex + 1).value = cell;
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      setExcelBuffer(buffer);

      setProgress(100);
      setPhase('ready');
    } catch (error) {
      console.error('Processing error:', error);
      setPhase('idle');
      setProgress(0);
    } finally {
      setIsDisabled(false);
    }
  }, []);

  const saveExcel = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!excelBuffer || phase !== 'ready') return;

      setPhase('saving');
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      saveAs(blob, `converted_${Date.now()}.xlsx`);

      setTimeout(() => {
        setPhase('idle');
        setProgress(0);
        setParsedRows(null);
        setExcelBuffer(null);
        setIsDisabled(false);
      }, 1000);
    },
    [excelBuffer, phase]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.txt')) {
      await processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDropAreaClick = useCallback(
    (e: React.MouseEvent) => {
      if (phase === 'idle' && !isDisabled && !e.defaultPrevented) {
        fileInputRef.current?.click();
      }
    },
    [phase, isDisabled]
  );

  return (
    <div className={styles.container}>
      <div
        className={`${styles.dropArea} ${isDragging ? styles.dragging : ''} ${
          phase === 'processing' || phase === 'saving' ? styles.disabled : ''
        }`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleDropAreaClick}
      >
        {phase === 'processing' && (
          <div className={styles.progressContainer}>
            <p>🔄 TXT → Excel... {Math.round(progress)}%</p>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {phase === 'ready' && parsedRows && (
          <div className={styles.saveButton} onClick={saveExcel} role="button" tabIndex={0}>
            <p>✅ Готов Excel!</p>
            <p>💾 Сохранить ({parsedRows.length} строк)</p>
          </div>
        )}

        {phase === 'idle' && <p>📁 Перетащите TXT файл!</p>}
      </div>

      <input
        ref={fileInputRef}
        id="fileInput"
        type="file"
        accept=".txt"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={isDisabled}
      />
    </div>
  );
}
