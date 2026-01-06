import React from 'react';
import { Close } from '@mui/icons-material';
import { Box, Card, CardContent, IconButton, Typography } from '@mui/material';

import { useThumbnails } from '@/hooks/useThumbnails';
import { AttachmentManagerProps } from '@/types/email';
import { formatFileSize, getFileIcon, isImageFile } from '@/utils';

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  attachments,
  onRemoveFile,
  onPreviewFile,
}) => {
  const { getThumbnail } = useThumbnails(attachments);

  if (attachments.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        p: 2,
        borderTop: 1,
        borderColor: 'divider',
        backgroundColor: 'grey.50',
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
        Attachments ({attachments.length})
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: { xs: 1, sm: 2 },
          justifyContent: { xs: 'center', sm: 'flex-start' },
        }}
      >
        {attachments.map((file, index) => {
          const thumbnail = getThumbnail(file);
          const isImage = isImageFile(file);

          return (
            <Card
              key={index}
              sx={{
                width: { xs: 100, sm: 120 },
                height: { xs: 120, sm: 140 },
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                  '& .attachment-remove-btn': {
                    opacity: 1,
                  },
                },
              }}
              onClick={() => onPreviewFile(file)}
            >
              {/* Remove Button */}
              <IconButton
                className="attachment-remove-btn"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFile(index);
                }}
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  zIndex: 2,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  opacity: 0,
                  transition: 'opacity 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  },
                  width: 24,
                  height: 24,
                }}
              >
                <Close fontSize="small" />
              </IconButton>

              {/* Thumbnail Area */}
              <Box
                sx={{
                  height: { xs: 64, sm: 80 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isImage ? 'transparent' : 'grey.100',
                  overflow: 'hidden',
                  borderRadius: '4px 4px 0 0',
                }}
              >
                {isImage && thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbnail}
                    alt={file.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '32px',
                        lineHeight: 1,
                        mb: 0.5,
                      }}
                    >
                      {getFileIcon(file)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        fontWeight: 'bold',
                      }}
                    >
                      {file.name.split('.').pop()?.substring(0, 4) || 'FILE'}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* File Info */}
              <CardContent
                sx={{
                  p: { xs: 0.5, sm: 1 },
                  height: { xs: 56, sm: 60 },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  '&:last-child': { pb: 1 },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 'medium',
                    lineHeight: 1.2,
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: '12px',
                  }}
                  title={file.name}
                >
                  {file.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '10px',
                  }}
                >
                  {formatFileSize(file.size)}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
};
