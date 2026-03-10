'use client';
import React, { useState, useCallback } from 'react';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import styles from './FileUploader.module.scss';

export default function FileUploader() {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'parsing' | 'writing' | 'done'>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const text = await file.text();
      setFileContent(text);
      setIsDisabled(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const resetFileInput = useCallback(() => {
    const input = document.getElementById('fileInput') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }, []);

  const processFile = useCallback(async (file: File) => {
    setPhase('parsing');
    setProgress(10);

    try {
      const text = await file.text();
      setFileContent(text);
      setPhase('done');
      setProgress(100);
    } catch (error) {
      console.error('Parse error:', error);
      setPhase('idle');
    }
  }, []);

  const createExcelDocument = async (e: React.MouseEvent<HTMLParagraphElement>) => {
    e.stopPropagation();
    if (!fileContent) return;

    setPhase('writing');
    setProgress(0);

    try {
      const lines = fileContent.trim().split('\n');
      const totalLines = lines.length;

      // Этап 1: Подготовка Excel (10%)
      setProgress(10);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data');

      // Этап 2: Парсинг строк с прогрессом (30-80%)
      const rows: string[][] = [];
      for (let i = 0; i < totalLines; i++) {
        rows.push(lines[i].split('^'));
        if (i % 100 === 0) {
          // Обновляем каждые 100 строк
          setProgress(30 + Math.round((i / totalLines) * 50));
        }
      }

      // Этап 3: Запись в Excel с прогрессом (80-95%)
      setProgress(80);
      rows.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          worksheet.getCell(rowIndex + 1, colIndex + 1).value = cell;
        });
        if (rowIndex % 500 === 0 && rowIndex > 0) {
          setProgress(80 + Math.round((rowIndex / totalLines) * 15));
        }
      });

      setProgress(95);

      // Этап 4: Финализация и сохранение (95-100%)
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, `table_data_${new Date().getTime()}.xlsx`);

      setProgress(100);
    } catch (error) {
      console.error('Excel error:', error);
    } finally {
      setTimeout(() => {
        setPhase('idle');
        setProgress(0);
        setFileContent(null);
        resetFileInput();
      }, 1000);
    }
  };

  return (
    <div>
      <div
        className={`${styles.dropArea} ${isDragging ? styles.dragging : ''} ${
          phase === 'writing' || phase === 'parsing' ? styles.disabled : ''
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => {
          if (phase === 'idle') {
            document.getElementById('fileInput')?.click();
          }
        }}
      >
        {phase === 'parsing' ? (
          <p>📖 Читаем файл...</p>
        ) : phase === 'writing' ? (
          <p>📊 Создаём Excel... {Math.round(progress)}%</p>
        ) : phase === 'done' && fileContent ? (
          <p onClick={createExcelDocument} className={styles.saveButton}>
            💾 Сохранить в Excel!
          </p>
        ) : phase === 'idle' ? (
          <p>Перетащите или выберите файл!</p>
        ) : null}
      </div>

      <input
        id="fileInput"
        type="file"
        accept=".txt"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
