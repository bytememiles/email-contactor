import React, { useEffect, useState } from 'react';
import {
  Clear,
  CloudUpload,
  Download,
  Folder,
  Group,
  Refresh,
  Save,
  Send,
  Upload,
  Work,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
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

import { BulkSendDialog } from '@/components/batch/BulkSendDialog';
import { ConfirmDeleteDialog } from '@/components/batch/ConfirmDeleteDialog';
import { CSVUpload } from '@/components/batch/CSVUpload';
import { ExportListDialog } from '@/components/batch/ExportListDialog';
import { ReceiversTable } from '@/components/batch/ReceiversTable';
import { SaveListDialog } from '@/components/batch/SaveListDialog';
import { StoredListsView } from '@/components/batch/StoredListsView';
import { JobCreator } from '@/components/jobs';
import { useNotification } from '@/contexts/NotificationContext';
import { useBulkEmailSender } from '@/hooks';
import { useEmailJobs } from '@/hooks/useEmailJobs';
import { useProfiles } from '@/hooks/useProfiles';
import { useReceiverLists } from '@/hooks/useReceiverLists';
import { useReceivers } from '@/hooks/useReceivers';
import { useTemplates } from '@/hooks/useTemplates';
import { JobForm } from '@/types/job';
import { CSVUploadResult } from '@/types/receiver';
import { processReceivers } from '@/utils/csvUtils';
import { calculateSendTimes, getEarliestSendTime } from '@/utils/scheduling';

export const BatchOperationsTab: React.FC = () => {
  const { showError, showWarning } = useNotification();
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
    loading: listsLoading,
    createReceiverList,
    updateReceiverList,
    deleteReceiverList,
    loadReceiverList,
    clearCurrentList,
    exportList,
  } = useReceiverLists();

  const { profiles } = useProfiles();
  const { templates, getTemplate } = useTemplates();
  const { createJob } = useEmailJobs();
  const { sendBulkEmails, isSending, progress } = useBulkEmailSender();

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
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [savedListId, setSavedListId] = useState<string | null>(null);
  const [showBulkSendDialog, setShowBulkSendDialog] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportingListId, setExportingListId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Set default tab based on stored lists once they're loaded
  useEffect(() => {
    if (!listsLoading && !hasInitializedTab) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setActiveTab(lists.length > 0 ? 1 : 0); // 1 = Stored Lists, 0 = Upload & Process
        setHasInitializedTab(true);
      }, 0);
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
    setEditingListId(null); // Clear editing state when clearing
    clearCurrentList();
  };

  const handleSaveList = (formData: { name: string; description?: string }) => {
    if (receivers.length === 0) return;

    // Check if we're editing an existing list
    if (editingListId) {
      // Update existing list
      updateReceiverList(editingListId, formData, receivers);
      setShowSaveDialog(false);
      setSavedListId(editingListId);
      setEditingListId(null); // Clear editing state

      // Show success notification
      setSuccessMessage(
        `List "${formData.name}" updated successfully with ${receivers.filter((r) => r.isValid).length} valid receivers!`
      );
      setShowSuccessMessage(true);

      // Show option to create job if profiles and templates are available
      if (profiles.length > 0 && templates.length > 0) {
        setTimeout(() => {
          setShowJobDialog(true);
        }, 1000);
      }
    } else {
      // Create new list
      const newList = createReceiverList(formData, receivers, sourceFileName);
      setShowSaveDialog(false);
      setSavedListId(newList.id);

      // Show success notification
      setSuccessMessage(
        `List "${newList.name}" saved successfully with ${newList.validReceivers} valid receivers!`
      );
      setShowSuccessMessage(true);

      // Show option to create job if profiles and templates are available
      if (profiles.length > 0 && templates.length > 0) {
        setTimeout(() => {
          setShowJobDialog(true);
        }, 1000);
      }
    }
  };

  const handleCreateJob = (jobData: JobForm) => {
    if (!savedListId) return;

    const receiverList = lists.find((list) => list.id === savedListId);
    if (!receiverList) {
      showError('Receiver list not found');
      return;
    }

    // Load the full list to get receivers for scheduling
    loadReceiverList(savedListId).then((fullList) => {
      if (!fullList) {
        showError('Could not load receiver list');
        return;
      }

      // Parse the send time from the form (format: "HH:mm")
      const sendTime = jobData.sendTime || '10:00';
      const [hours, minutes] = sendTime.split(':').map(Number);

      // Calculate send times based on receiver timezones
      const scheduledTimes = calculateSendTimes(
        fullList.receivers,
        new Date(),
        hours,
        minutes
      );
      const earliestTime = getEarliestSendTime(scheduledTimes) || new Date();

      createJob(jobData, earliestTime, receiverList.validReceivers);
      setShowJobDialog(false);
      setSavedListId(null);

      setSuccessMessage(
        `Job created successfully! Emails will be sent starting at ${earliestTime.toLocaleString()}`
      );
      setShowSuccessMessage(true);
    });
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

  const handleEditStoredList = async (id: string) => {
    const list = await loadReceiverList(id);
    if (list) {
      setAllReceivers(list.receivers);
      setEditingListId(id); // Track that we're editing this list
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

      // Show notification that list is loaded for editing
      setSuccessMessage(
        `List "${list.name}" loaded for editing. Make your changes and save when ready.`
      );
      setShowSuccessMessage(true);
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

  const handleBulkSend = async (profileId: string, templateId: string) => {
    const profile = profiles.find((p) => p.id === profileId);
    const template = getTemplate(templateId);

    if (!profile || !template) {
      showError('Profile or template not found');
      return;
    }

    const validReceivers = receivers.filter((r) => r.isValid);
    if (validReceivers.length === 0) {
      showError('No valid receivers to send to');
      return;
    }

    const result = await sendBulkEmails({
      receivers: validReceivers,
      template,
      profile: {
        fullName: profile.fullName,
        smtpConfigId: profile.smtpConfigId,
      },
    });

    if (result.success) {
      setSuccessMessage(
        `Successfully sent ${result.sent} email(s) to ${validReceivers.length} receiver(s)`
      );
      setShowSuccessMessage(true);
      setShowBulkSendDialog(false);
    } else if (result.sent > 0) {
      setSuccessMessage(
        `Sent ${result.sent} email(s), ${result.failed} failed`
      );
      setShowSuccessMessage(true);
      setShowBulkSendDialog(false);
    }
  };

  const handleExportList = (id: string) => {
    setExportingListId(id);
    setShowExportDialog(true);
  };

  const handleConfirmExport = async (includeInvalid: boolean) => {
    if (!exportingListId) return;

    setIsExporting(true);
    try {
      await new Promise<void>((resolve) => {
        exportList(exportingListId, includeInvalid);
        // Small delay to ensure export completes
        setTimeout(() => {
          resolve();
        }, 500);
      });

      setSuccessMessage(
        `List exported successfully${includeInvalid ? ' (including invalid receivers)' : ' (valid receivers only)'}`
      );
      setShowSuccessMessage(true);
      setShowExportDialog(false);
      setExportingListId(null);
    } catch (error) {
      showError('Failed to export list');
    } finally {
      setIsExporting(false);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setHasInitializedTab(true); // User manually changed tab
  };

  const handleExportValid = () => {
    const validReceivers = receivers.filter((r) => r.isValid);

    if (validReceivers.length === 0) {
      showWarning('No valid receivers to export');
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
    <Box sx={{ maxWidth: '100%', mx: 'auto', width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
          }}
        >
          <Group />
          Batch Operations
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
        >
          Upload CSV files with receiver information, validate data, assign
          tags, and manage recipients efficiently.
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          mb: { xs: 2, sm: 3 },
          '& .MuiTab-root': {
            fontSize: { xs: '0.875rem', sm: '1rem' },
            minHeight: { xs: 48, sm: 72 },
            padding: { xs: '12px 8px', sm: '12px 16px' },
          },
        }}
        variant="scrollable"
        scrollButtons="auto"
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

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{ mt: 2 }}
                >
                  <Button
                    startIcon={<Refresh />}
                    onClick={() => setActiveStep(0)}
                    variant="outlined"
                    fullWidth={false}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
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
                        fullWidth={false}
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                      >
                        Save List
                      </Button>
                      {profiles.length > 0 && templates.length > 0 && (
                        <>
                          <Button
                            startIcon={<Send />}
                            onClick={() => setShowBulkSendDialog(true)}
                            variant="contained"
                            color="success"
                            fullWidth={false}
                            disabled={isSending}
                            sx={{ width: { xs: '100%', sm: 'auto' } }}
                          >
                            {isSending ? 'Sending...' : 'Send Now'}
                          </Button>
                          {savedListId && (
                            <Button
                              startIcon={<Work />}
                              onClick={() => setShowJobDialog(true)}
                              variant="contained"
                              color="secondary"
                              fullWidth={false}
                              sx={{ width: { xs: '100%', sm: 'auto' } }}
                            >
                              Create Email Job
                            </Button>
                          )}
                        </>
                      )}
                      <Button
                        startIcon={<Download />}
                        onClick={handleExportValid}
                        variant="outlined"
                        color="success"
                        fullWidth={false}
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                      >
                        Export Valid Receivers
                      </Button>
                      <Button
                        startIcon={<Clear />}
                        onClick={handleClearAll}
                        variant="outlined"
                        color="error"
                        fullWidth={false}
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
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
            {steps.map((step) => (
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
          onEditList={handleEditStoredList}
          onDeleteList={handleDeleteStoredList}
          onExportList={handleExportList}
        />
      )}

      {/* Save List Dialog */}
      <SaveListDialog
        open={showSaveDialog}
        onClose={() => {
          setShowSaveDialog(false);
          setEditingListId(null); // Clear editing state when closing
        }}
        onSave={handleSaveList}
        sourceFileName={sourceFileName}
        receiverCount={receivers.length}
        validCount={receivers.filter((r) => r.isValid).length}
        editingListId={editingListId}
        existingListName={
          editingListId
            ? lists.find((l) => l.id === editingListId)?.name
            : undefined
        }
        existingListDescription={
          editingListId
            ? lists.find((l) => l.id === editingListId)?.description
            : undefined
        }
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

      {/* Job Creation Dialog */}
      <Dialog
        open={showJobDialog}
        onClose={() => {
          setShowJobDialog(false);
          setSavedListId(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Email Job</DialogTitle>
        <DialogContent>
          {savedListId && (
            <JobCreator
              profiles={profiles}
              templates={templates}
              receiverLists={lists.filter((list) => list.id === savedListId)}
              onSubmit={handleCreateJob}
              onCancel={() => {
                setShowJobDialog(false);
                setSavedListId(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Send Dialog */}
      <BulkSendDialog
        open={showBulkSendDialog}
        onClose={() => {
          if (!isSending) {
            setShowBulkSendDialog(false);
          }
        }}
        onConfirm={handleBulkSend}
        receivers={receivers}
        isSending={isSending}
        progress={progress}
      />

      {/* Export List Dialog */}
      <ExportListDialog
        open={showExportDialog}
        onClose={() => {
          if (!isExporting) {
            setShowExportDialog(false);
            setExportingListId(null);
          }
        }}
        onExport={handleConfirmExport}
        list={
          exportingListId
            ? lists.find((l) => l.id === exportingListId) || null
            : null
        }
        isExporting={isExporting}
      />
    </Box>
  );
};
