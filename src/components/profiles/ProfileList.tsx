import React from 'react';
import { Delete, Edit } from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  List,
  Typography,
} from '@mui/material';

import { Profile } from '@/types/profile';

interface ProfileListProps {
  profiles: Profile[];
  onEdit: (profile: Profile) => void;
  onDelete: (id: string) => void;
  smtpConfigNames: Record<string, string>;
  templateNames: Record<string, string>;
}

export const ProfileList: React.FC<ProfileListProps> = ({
  profiles,
  onEdit,
  onDelete,
  smtpConfigNames,
  templateNames,
}) => {
  if (profiles.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No profiles found. Create your first profile to get started.
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {profiles.map((profile) => (
        <Card key={profile.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {profile.fullName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  <Chip
                    label={`SMTP: ${smtpConfigNames[profile.smtpConfigId] || 'Unknown'}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`${profile.templateIds.length} template(s)`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                {profile.templateIds.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Templates:{' '}
                      {profile.templateIds
                        .map((id) => templateNames[id] || 'Unknown')
                        .join(', ')}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box>
                <IconButton
                  size="small"
                  onClick={() => onEdit(profile)}
                  title="Edit"
                >
                  <Edit />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onDelete(profile.id)}
                  title="Delete"
                  color="error"
                >
                  <Delete />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </List>
  );
};
