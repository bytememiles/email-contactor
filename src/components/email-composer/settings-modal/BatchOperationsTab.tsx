import React, { useEffect, useState } from 'react';
import {
  Clear,
  CloudUpload,
  Download,
  Folder,
  Group,
  Refresh,
  Save,
  Upload,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Snackbar,
  Stack,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';

import { ConfirmDeleteDialog } from '@/components/batch/ConfirmDeleteDialog';
import { CSVUpload } from '@/components/batch/CSVUpload';
import { ReceiversTable } from '@/components/batch/ReceiversTable';
import { SaveListDialog } from '@/components/batch/SaveListDialog';
import { StoredListsView } from '@/components/batch/StoredListsView';
import { useReceiverLists } from '@/hooks/useReceiverLists';
import { useReceivers } from '@/hooks/useReceivers';
import { CSVUploadResult } from '@/types/receiver';
import { processReceivers } from '@/utils/csvUtils';

export const BatchOperationsTab: React.FC = () => {
  const {
    receivers,
    tags,
    addTag,
    updateTag,
    deleteTag,
    addTagToReceiver,
    addTagToMultipleReceivers,
    removeTagFromReceiver,
    setAllReceivers,
    deleteReceiver,
    clearReceivers,
  } = useReceivers();

  const {
    lists,
    currentList,
    loading: listsLoading,
    createReceiverList,
    deleteReceiverList,
    loadReceiverList,
    clearCurrentList,
    exportList,
  } = useReceiverLists();

  const [activeTab, setActiveTab] = useState(0);
  const [hasInitializedTab, setHasInitializedTab] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [uploadResult, setUploadResult] = useState<CSVUploadResult | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [sourceFileName, setSourceFileName] = useState<string>();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [listToDelete, setListToDelete] = useState<string | null>(null);

  // Set default tab based on stored lists once they're loaded
  useEffect(() => {
    if (!listsLoading && !hasInitializedTab) {
      setActiveTab(lists.length > 0 ? 1 : 0); // 1 = Stored Lists, 0 = Upload & Process
      setHasInitializedTab(true);
    }
  }, [lists.length, listsLoading, hasInitializedTab]);

  const handleUploadComplete = async (
    result: CSVUploadResult,
    fileName?: string
  ) => {
    setLoading(true);
    setUploadResult(result);
    setSourceFileName(fileName);

    if (result.success && result.data.length > 0) {
      try {
        const processedReceivers = await processReceivers(result.data);
        setAllReceivers(processedReceivers);
        setActiveStep(1);
      } catch (error) {
        console.error('Error processing receivers:', error);
        setUploadResult({
          ...result,
          success: false,
          errors: [
            ...result.errors,
            'Failed to process receivers with timezone detection',
          ],
        });
      }
    }

    setLoading(false);
  };

  const handleClearAll = () => {
    clearReceivers();
    setUploadResult(null);
    setActiveStep(0);
    setSourceFileName(undefined);
    clearCurrentList();
  };

  const handleSaveList = (formData: { name: string; description?: string }) => {
    if (receivers.length === 0) return;

    const newList = createReceiverList(formData, receivers, sourceFileName);
    setShowSaveDialog(false);

    // Show success notification
    setSuccessMessage(
      `List "${newList.name}" saved successfully with ${newList.validReceivers} valid receivers!`
    );
    setShowSuccessMessage(true);
  };

  const handleViewStoredList = async (id: string) => {
    const list = await loadReceiverList(id);
    if (list) {
      setAllReceivers(list.receivers);
      setActiveTab(0); // Switch to upload/review tab
      setActiveStep(1); // Go to review step
      setUploadResult({
        success: true,
        data: [],
        errors: [],
        totalRows: list.totalReceivers,
        validRows: list.validReceivers,
      });
      setSourceFileName(list.sourceFileName);
      // Mark as initialized to prevent default tab logic from overriding
      setHasInitializedTab(true);
    }
  };

  const handleDeleteStoredList = (id: string) => {
    setListToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (listToDelete) {
      const listToDeleteData = lists.find((list) => list.id === listToDelete);
      deleteReceiverList(listToDelete);
      setListToDelete(null);

      // Show success notification
      if (listToDeleteData) {
        setSuccessMessage(
          `List "${listToDeleteData.name}" deleted successfully!`
        );
        setShowSuccessMessage(true);
      }
    }
  };

  const handleCancelDelete = () => {
    setListToDelete(null);
    setShowDeleteConfirm(false);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setHasInitializedTab(true); // User manually changed tab
  };

  const handleExportValid = () => {
    const validReceivers = receivers.filter((r) => r.isValid);

    if (validReceivers.length === 0) {
      alert('No valid receivers to export');
      return;
    }

    const csvContent = [
      'full name,emails,location,timezone,timezone_source,tags',
      ...validReceivers.map(
        (r) =>
          `"${r.fullName}","${r.emails.join(';')}","${r.location}","${r.timezone}","${r.timezoneSource}","${r.tags.map((t) => t.name).join(';')}"`
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'valid-receivers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const steps = [
    {
      label: 'Upload CSV',
      description: 'Upload a CSV file with receiver information',
      content: (
        <CSVUpload onUploadComplete={handleUploadComplete} loading={loading} />
      ),
    },
    {
      label: 'Review & Tag',
      description: 'Review uploaded data, assign tags, and manage receivers',
      content: (
        <ReceiversTable
          receivers={receivers}
          tags={tags}
          onAddTag={addTag}
          onUpdateTag={updateTag}
          onDeleteTag={deleteTag}
          onAddTagToReceiver={addTagToReceiver}
          onAddTagToMultipleReceivers={addTagToMultipleReceivers}
          onRemoveTagFromReceiver={removeTagFromReceiver}
          onDeleteReceiver={deleteReceiver}
        />
      ),
    },
  ];

  return (
    <Box sx={{ maxWidth: '100%', mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Group />
          Batch Operations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upload CSV files with receiver information, validate data, assign
          tags, and manage recipients efficiently.
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab icon={<Upload />} label="Upload & Process" iconPosition="start" />
        <Tab
          icon={<Folder />}
          label={`Stored Lists${lists.length > 0 ? ` (${lists.length})` : ''}`}
          iconPosition="start"
        />
      </Tabs>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          {/* Upload Result Summary */}
          {uploadResult && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Upload Results
                </Typography>

                {uploadResult.success ? (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Successfully processed {uploadResult.validRows} of{' '}
                    {uploadResult.totalRows} rows
                  </Alert>
                ) : (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    Upload failed. Please check your CSV format.
                  </Alert>
                )}

                {uploadResult.errors.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Errors:
                    </Typography>
                    {uploadResult.errors.map((error, index) => (
                      <Typography key={index} variant="body2" color="error">
                        • {error}
                      </Typography>
                    ))}
                  </Box>
                )}

                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Button
                    startIcon={<Refresh />}
                    onClick={() => setActiveStep(0)}
                    variant="outlined"
                  >
                    Upload New File
                  </Button>
                  {receivers.length > 0 && (
                    <>
                      <Button
                        startIcon={<Save />}
                        onClick={() => setShowSaveDialog(true)}
                        variant="contained"
                        color="primary"
                      >
                        Save List
                      </Button>
                      <Button
                        startIcon={<Download />}
                        onClick={handleExportValid}
                        variant="outlined"
                        color="success"
                      >
                        Export Valid Receivers
                      </Button>
                      <Button
                        startIcon={<Clear />}
                        onClick={handleClearAll}
                        variant="outlined"
                        color="error"
                      >
                        Clear All
                      </Button>
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Stepper */}
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>
                  <Typography variant="h6">{step.label}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Box sx={{ mt: 2, mb: 1 }}>{step.content}</Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>

          {/* Empty State */}
          {activeStep === 0 && !uploadResult && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CloudUpload
                sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                Start by uploading a CSV file
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload your receiver list to begin batch operations
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Stored Lists Tab */}
      {activeTab === 1 && (
        <StoredListsView
          lists={lists}
          loading={listsLoading}
          onViewList={handleViewStoredList}
          onEditList={(id) => console.log('Edit list:', id)} // TODO: Implement edit
          onDeleteList={handleDeleteStoredList}
          onExportList={exportList}
        />
      )}

      {/* Save List Dialog */}
      <SaveListDialog
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveList}
        sourceFileName={sourceFileName}
        receiverCount={receivers.length}
        validCount={receivers.filter((r) => r.isValid).length}
      />

      {/* Success Notification */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={4000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setShowSuccessMessage(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={showDeleteConfirm}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        list={
          listToDelete
            ? lists.find((list) => list.id === listToDelete) || null
            : null
        }
      />
    </Box>
  );
};
