import React from 'react';
import { AttachFile } from '@mui/icons-material';
import { IconButton } from '@mui/material';

interface AttachButtonProps {
  onAddFiles: (files: File[]) => void;
}

export const AttachButton: React.FC<AttachButtonProps> = ({ onAddFiles }) => {
  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      onAddFiles(newFiles);
    }
    // Clear the input so the same file can be selected again
    event.target.value = '';
  };

  return (
    <IconButton
      size="small"
      component="label"
      sx={{
        display: { xs: 'none', sm: 'inline-flex' }, // Hide on mobile
      }}
    >
      <AttachFile fontSize="small" />
      <input
        type="file"
        hidden
        multiple
        onChange={handleFileAttachment}
        accept="image/*,video/*,.pdf,.doc,.docx,.txt,.xlsx,.pptx,.md,.csv"
      />
    </IconButton>
  );
};
