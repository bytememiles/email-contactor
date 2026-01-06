'use client';

import React, { useState } from 'react';
import { Add } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

import { ProfileForm, ProfileList } from '@/components/profiles';
import { useProfiles } from '@/hooks/useProfiles';
import { useSMTPConfigsRedux } from '@/hooks/useSMTPConfigsRedux';
import { useTemplates } from '@/hooks/useTemplates';
import { Profile, ProfileForm as ProfileFormData } from '@/types/profile';

export default function ProfilesPage() {
  const { profiles, loading, addProfile, updateProfile, deleteProfile } =
    useProfiles();
  const { configs: smtpConfigs } = useSMTPConfigsRedux();
  const { templates } = useTemplates();

  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

  const handleAdd = () => {
    setEditingProfile(null);
    setShowForm(true);
  };

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setProfileToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (profileToDelete) {
      deleteProfile(profileToDelete);
      setProfileToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleSubmit = (data: ProfileFormData) => {
    if (editingProfile) {
      updateProfile(editingProfile.id, data);
    } else {
      addProfile(data);
    }
    setShowForm(false);
    setEditingProfile(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProfile(null);
  };

  // Create lookup maps for names
  const smtpConfigNames: Record<string, string> = {};
  smtpConfigs.forEach((config) => {
    smtpConfigNames[config.id] = config.name;
  });

  const templateNames: Record<string, string> = {};
  templates.forEach((template) => {
    templateNames[template.id] = template.name;
  });

  if (smtpConfigs.length === 0) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Profiles
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Manage profiles with SMTP configurations and templates.
        </Typography>
        <Alert severity="warning">
          You need to create at least one SMTP configuration before creating
          profiles. Go to{' '}
          <Button href="/settings/smtp" size="small" variant="outlined">
            SMTP Configuration
          </Button>{' '}
          to get started.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Profiles
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage profiles with SMTP configurations and templates.
          </Typography>
        </Box>
        <Button
          startIcon={<Add />}
          variant="contained"
          onClick={handleAdd}
          disabled={smtpConfigs.length === 0}
        >
          Add Profile
        </Button>
      </Box>

      {loading ? (
        <Typography>Loading profiles...</Typography>
      ) : (
        <ProfileList
          profiles={profiles}
          onEdit={handleEdit}
          onDelete={handleDelete}
          smtpConfigNames={smtpConfigNames}
          templateNames={templateNames}
        />
      )}

      <Dialog open={showForm} onClose={handleCancel} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProfile ? 'Edit Profile' : 'Create Profile'}
        </DialogTitle>
        <DialogContent>
          <ProfileForm
            profile={editingProfile}
            smtpConfigs={smtpConfigs}
            templates={templates}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
      >
        <DialogTitle>Delete Profile?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this profile? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <Box sx={{ p: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
