import React, { useState } from 'react';
import {
  Delete,
  Download,
  Edit,
  Folder,
  Group,
  Search,
  Visibility,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { ReceiverListSummary } from '@/types/receiver';

interface StoredListsViewProps {
  lists: ReceiverListSummary[];
  loading: boolean;
  onViewList: (id: string) => void;
  onEditList: (id: string) => void;
  onDeleteList: (id: string) => void;
  onExportList: (id: string) => void;
}

export const StoredListsView: React.FC<StoredListsViewProps> = ({
  lists,
  loading,
  onViewList,
  onEditList,
  onDeleteList,
  onExportList,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLists = lists.filter(
    (list) =>
      list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (list.description &&
        list.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading stored lists...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Folder sx={{ color: 'text.secondary' }} />
        <Typography variant="h6">Stored Receiver Lists</Typography>
        <Chip
          label={`${lists.length} list${lists.length !== 1 ? 's' : ''}`}
          size="small"
          variant="outlined"
        />
      </Box>

      {/* Search */}
      {lists.length > 0 && (
        <TextField
          placeholder="Search lists..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      )}

      {/* Lists Grid */}
      {filteredLists.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Group sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {lists.length === 0
              ? 'No stored lists yet'
              : 'No lists match your search'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {lists.length === 0
              ? 'Upload and save CSV files to see them here'
              : 'Try different search terms'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredLists.map((list) => (
            <Grid item xs={12} sm={6} md={4} key={list.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom noWrap>
                    {list.name}
                  </Typography>

                  {list.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2, minHeight: 40 }}
                    >
                      {list.description}
                    </Typography>
                  )}

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        size="small"
                        label={`${list.totalReceivers} total`}
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        label={`${list.validReceivers} valid`}
                        color="success"
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    Created: {formatDate(list.createdAt)}
                    {list.sourceFileName && (
                      <>
                        <br />
                        Source: {list.sourceFileName}
                      </>
                    )}
                  </Typography>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Tooltip title="View receivers">
                    <IconButton
                      size="small"
                      onClick={() => onViewList(list.id)}
                      color="primary"
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Edit list">
                    <IconButton
                      size="small"
                      onClick={() => onEditList(list.id)}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Export CSV">
                    <IconButton
                      size="small"
                      onClick={() => onExportList(list.id)}
                      color="success"
                    >
                      <Download />
                    </IconButton>
                  </Tooltip>

                  <Box sx={{ flex: 1 }} />

                  <Tooltip title="Delete list">
                    <IconButton
                      size="small"
                      onClick={() => onDeleteList(list.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
