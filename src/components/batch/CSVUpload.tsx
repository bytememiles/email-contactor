import React, { useCallback, useState } from 'react';
import { CloudUpload, Description, FilePresent } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';

import { CSVUploadResult } from '@/types/receiver';
import { parseCSV } from '@/utils/csvUtils';

interface CSVUploadProps {
  onUploadComplete: (result: CSVUploadResult, fileName?: string) => void;
  loading?: boolean;
}

export const CSVUpload: React.FC<CSVUploadProps> = ({
  onUploadComplete,
  loading = false,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFile = useCallback(
    async (selectedFile: File) => {
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        onUploadComplete({
          success: false,
          data: [],
          errors: ['Please select a CSV file'],
          totalRows: 0,
          validRows: 0,
        });
        return;
      }

      setFile(selectedFile);

      try {
        const content = await selectedFile.text();
        const result = parseCSV(content);
        onUploadComplete(result, selectedFile.name);
      } catch (err) {
        const errorMessage =
          (err as Error)?.message || 'Unknown error occurred';
        onUploadComplete({
          success: false,
          data: [],
          errors: [`Failed to read file: ${errorMessage}`],
          totalRows: 0,
          validRows: 0,
        });
      }
    },
    [onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  return (
    <Box>
      <Card
        sx={{
          border: dragOver ? '2px dashed #2196F3' : '2px dashed #ccc',
          backgroundColor: dragOver
            ? 'rgba(33, 150, 243, 0.04)'
            : 'transparent',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          '&:hover': {
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.04)',
          },
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <input
            accept=".csv"
            style={{ display: 'none' }}
            id="csv-upload-input"
            type="file"
            onChange={handleFileSelect}
            disabled={loading}
          />
          <label htmlFor="csv-upload-input">
            <CloudUpload
              sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
            />
            <Typography variant="h6" gutterBottom>
              Upload CSV File
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Drag and drop your CSV file here, or click to browse
            </Typography>
            <Button
              variant="contained"
              component="span"
              disabled={loading}
              startIcon={<FilePresent />}
            >
              Choose File
            </Button>
          </label>

          {loading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Processing file...
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {file && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Selected File:
          </Typography>
          <Card variant="outlined">
            <CardContent sx={{ py: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Description color="primary" />
                <Typography variant="body2">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      <Box sx={{ mt: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" component="div">
            <strong>Required CSV Format:</strong>
          </Typography>
          <List dense sx={{ mt: 1, pl: 2 }}>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 20 }}>•</ListItemIcon>
              <ListItemText
                primary="First row must contain headers (case-insensitive, fuzzy matching supported)"
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 20 }}>•</ListItemIcon>
              <ListItemText
                primary="Required columns: First name, Email, State (US states)"
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 20 }}>•</ListItemIcon>
              <ListItemText
                primary="Optional columns: No, Github (URL), Telegram"
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 20 }}>•</ListItemIcon>
              <ListItemText
                primary="State accepts abbreviations (CA, NY) or full names (California, New York)"
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
          </List>
        </Alert>

        <Typography variant="caption" color="text.secondary">
          Example CSV content:
        </Typography>
        <Card variant="outlined" sx={{ mt: 1 }}>
          <CardContent
            sx={{ py: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}
          >
            No,First Name,Email,Github,State,Telegram
            <br />
            1,John,john@example.com,https://github.com/john,CA,@john
            <br />
            2,Jane,jane@example.com,https://github.com/jane,New York,@jane
            <br />
            3,Bob,bob@example.com,,TX,@bob
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
