'use client';

import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import styles from './FileUploader.module.scss';
import * as XLSX from 'xlsx';

export default function FileUploader() {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const text = await file.text();
      setFileContent(text);
      setIsDisabled(false);
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

  const createExcelDocument = async (e: React.MouseEvent<HTMLParagraphElement>) => {
    e.stopPropagation();
    if (!fileContent) return;

    setIsLoading(true);
    setIsDisabled(true);

    const rows = fileContent
      .trim()
      .split('\n')
      .map((line: string) => line.split('^'));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, 'table_data.xlsx');

    setIsLoading(false);
    setIsDisabled(false);
    setFileContent(null);
  };

  return (
    <div>
      <div
        className={`${styles.dropArea} ${isDragging ? styles.dragging : ''} ${
          isLoading || isDisabled ? styles.disabled : ''
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => {
          if (!fileContent) document.getElementById('fileInput')?.click();
        }}
      >
        {!fileContent ? (
          <p>Перетащите или выберите файл!</p>
        ) : (
          <p onClick={createExcelDocument}>Сохранить в Excel!</p>
        )}
      </div>
      <input
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
