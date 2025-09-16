// validateEmail function moved to csvUtils.ts to avoid export conflicts

// File size formatting
export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// File type detection
export const isImageFile = (file: File) => file.type.startsWith('image/');
export const isPdfFile = (file: File) => file.type === 'application/pdf';
export const isDocFile = (file: File) =>
  file.type.includes('word') ||
  file.type.includes('document') ||
  file.name.endsWith('.doc') ||
  file.name.endsWith('.docx');
export const isTextFile = (file: File) =>
  file.type === 'text/plain' || file.name.endsWith('.txt');
export const isMarkdownFile = (file: File) =>
  file.type === 'text/markdown' ||
  file.name.endsWith('.md') ||
  file.name.endsWith('.markdown');
export const isCsvFile = (file: File) =>
  file.type === 'text/csv' || file.name.endsWith('.csv');
export const isExcelFile = (file: File) =>
  file.type.includes('spreadsheet') ||
  file.name.endsWith('.xlsx') ||
  file.name.endsWith('.xls');

// File icon mapping
export const getFileIcon = (file: File) => {
  if (isImageFile(file)) return '🖼️';
  if (isPdfFile(file)) return '📄';
  if (isDocFile(file)) return '📝';
  if (isTextFile(file)) return '📝';
  if (isMarkdownFile(file)) return '📋';
  if (isCsvFile(file)) return '📊';
  if (isExcelFile(file)) return '📊';
  if (file.type.includes('video')) return '🎥';
  if (file.type.includes('audio')) return '🎵';
  if (file.type.includes('presentation') || file.name.includes('.pptx'))
    return '📈';
  return '📎';
};

// File content reading
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

// CSV formatting
export const formatCsvData = (csvText: string) => {
  const lines = csvText.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return 'Empty CSV file';

  const maxLines = 100; // Limit display for performance
  const displayLines = lines.slice(0, maxLines);

  return displayLines.map((line, index) => {
    const cells = line
      .split(',')
      .map((cell) => cell.trim().replace(/^"|"$/g, ''));
    return {
      index,
      cells,
      isHeader: index === 0,
    };
  });
};
