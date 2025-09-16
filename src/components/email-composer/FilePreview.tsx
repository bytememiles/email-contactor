import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { marked } from 'marked';

import { FilePreviewProps } from '@/types/email';
import {
  formatCsvData,
  formatFileSize,
  getFileIcon,
  isCsvFile,
  isDocFile,
  isExcelFile,
  isImageFile,
  isMarkdownFile,
  isPdfFile,
  isTextFile,
  readFileAsText,
} from '@/utils';

export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  isOpen,
  onClose,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');

  useEffect(() => {
    if (file && isOpen) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Read text content for text-based files
      if (isTextFile(file) || isMarkdownFile(file) || isCsvFile(file)) {
        readFileAsText(file)
          .then(setFileContent)
          .catch(() => setFileContent('Error reading file content'));
      } else {
        setFileContent('');
      }

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file, isOpen]);

  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    setFileContent('');
    onClose();
  };

  const renderFileContent = () => {
    if (!file) return null;

    if (isImageFile(file)) {
      return (
        <img
          src={previewUrl}
          alt={file.name}
          style={{
            maxWidth: '100%',
            maxHeight: '70vh',
            objectFit: 'contain',
          }}
        />
      );
    }

    if (isPdfFile(file) || isExcelFile(file)) {
      return (
        <iframe
          src={previewUrl}
          style={{
            width: '100%',
            height: '70vh',
            border: 'none',
          }}
          title={file.name}
        />
      );
    }

    if (isTextFile(file)) {
      return (
        <Box sx={{ p: 3, width: '100%' }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            📝 Text File Preview
          </Typography>
          <Box
            sx={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: 1,
              p: 2,
              maxHeight: '60vh',
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '14px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {fileContent}
          </Box>
        </Box>
      );
    }

    if (isMarkdownFile(file)) {
      return (
        <Box sx={{ p: 3, width: '100%' }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            📋 Markdown Preview
          </Typography>
          <Box
            sx={{
              backgroundColor: '#fff',
              border: '1px solid #e9ecef',
              borderRadius: 1,
              p: 2,
              maxHeight: '60vh',
              overflow: 'auto',
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                marginTop: '1em',
                marginBottom: '0.5em',
              },
              '& p': {
                marginBottom: '1em',
              },
              '& pre': {
                backgroundColor: '#f8f9fa',
                padding: '1em',
                borderRadius: '4px',
                overflow: 'auto',
              },
              '& code': {
                backgroundColor: '#f8f9fa',
                padding: '0.2em 0.4em',
                borderRadius: '3px',
                fontSize: '0.9em',
              },
              '& blockquote': {
                borderLeft: '4px solid #ddd',
                paddingLeft: '1em',
                margin: '1em 0',
                color: '#666',
              },
            }}
            dangerouslySetInnerHTML={{
              __html: marked(fileContent),
            }}
          />
        </Box>
      );
    }

    if (isCsvFile(file)) {
      const csvData = formatCsvData(fileContent);
      return (
        <Box sx={{ p: 3, width: '100%' }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            📊 CSV Preview
          </Typography>
          <Box
            sx={{
              backgroundColor: '#fff',
              border: '1px solid #e9ecef',
              borderRadius: 1,
              maxHeight: '60vh',
              overflow: 'auto',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {Array.isArray(csvData) &&
                  csvData.map(({ index, cells, isHeader }) => (
                    <tr
                      key={index}
                      style={{
                        backgroundColor: isHeader ? '#f5f5f5' : 'transparent',
                      }}
                    >
                      {cells.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          style={{
                            padding: '8px',
                            border: '1px solid #ddd',
                            fontWeight: isHeader ? 'bold' : 'normal',
                          }}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </Box>
          {fileContent.split('\n').length > 100 && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: 'block' }}
            >
              Showing first 100 rows of {fileContent.split('\n').length} total
              rows
            </Typography>
          )}
        </Box>
      );
    }

    if (isDocFile(file)) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            📝 Document Preview
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Document files cannot be previewed directly in the browser.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Filename: {file.name}
            <br />
            Size: {formatFileSize(file.size)}
            <br />
            Type: {file.type || 'Unknown'}
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          {getFileIcon(file)} File Preview
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This file type cannot be previewed directly in the browser.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Filename: {file.name}
          <br />
          Size: {formatFileSize(file.size)}
          <br />
          Type: {file.type || 'Unknown'}
        </Typography>
      </Box>
    );
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {file && (
          <>
            <span style={{ fontSize: '20px' }}>{getFileIcon(file)}</span>
            {file.name}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ ml: 'auto' }}
            >
              ({formatFileSize(file.size)})
            </Typography>
          </>
        )}
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {file && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 200,
            }}
          >
            {renderFileContent()}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
