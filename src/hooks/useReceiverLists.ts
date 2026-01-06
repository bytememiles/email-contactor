import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ProcessedReceiver,
  ReceiverList,
  ReceiverListForm,
  ReceiverListSummary,
  ReceiverTag,
} from '@/types/receiver';

const STORAGE_KEY_LISTS = 'receiver_lists';

// Helper to convert ReceiverList to ReceiverListSummary
const toSummary = (list: ReceiverList): ReceiverListSummary => ({
  id: list.id,
  name: list.name,
  description: list.description,
  createdAt: list.createdAt,
  updatedAt: list.updatedAt,
  sourceFileName: list.sourceFileName,
  totalReceivers: list.totalReceivers,
  validReceivers: list.validReceivers,
});

// Helper to parse a stored list from localStorage
const parseStoredList = (stored: unknown): ReceiverList => {
  const listData = stored as Omit<ReceiverList, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
    receivers?: unknown[];
  };

  return {
    ...listData,
    createdAt: new Date(listData.createdAt),
    updatedAt: new Date(listData.updatedAt),
    receivers: (listData.receivers || []).map((receiver: unknown) => {
      const receiverData = receiver as ProcessedReceiver;
      return {
        ...receiverData,
        tags: receiverData.tags.map((tag: unknown) => {
          const tagData = tag as Omit<ReceiverTag, 'createdAt'> & {
            createdAt: string;
          };
          return {
            ...tagData,
            createdAt: new Date(tagData.createdAt),
          };
        }),
      };
    }),
  };
};

export const useReceiverLists = () => {
  // Internal state stores full ReceiverList objects
  const [fullLists, setFullLists] = useState<ReceiverList[]>([]);
  const [currentList, setCurrentList] = useState<ReceiverList | null>(null);
  const [loading, setLoading] = useState(true);

  // Load lists from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LISTS);
      if (stored) {
        const parsed = JSON.parse(stored);

        // Handle migration: if it's an array of summaries, try to load full data from old format
        if (Array.isArray(parsed)) {
          const loadedLists: ReceiverList[] = [];

          for (const item of parsed) {
            // Check if it's a full list (has receivers property)
            if (item.receivers && Array.isArray(item.receivers)) {
              loadedLists.push(parseStoredList(item));
            } else {
              // It's a summary - try to load from old format
              const oldKey = `receiver_list_${item.id}`;
              const oldStored = localStorage.getItem(oldKey);
              if (oldStored) {
                loadedLists.push(parseStoredList(JSON.parse(oldStored)));
                // Clean up old storage
                localStorage.removeItem(oldKey);
              } else {
                // If old data not found, skip this list (data loss, but better than crash)
                console.warn(`Could not migrate list ${item.id}, skipping`);
              }
            }
          }

          // Save in new format and clean up old keys
          if (loadedLists.length > 0) {
            localStorage.setItem(
              STORAGE_KEY_LISTS,
              JSON.stringify(loadedLists)
            );
            // Clean up any remaining old format keys
            for (const item of parsed) {
              if (item.id) {
                const oldKey = `receiver_list_${item.id}`;
                localStorage.removeItem(oldKey);
              }
            }
          }

          setFullLists(loadedLists);
        }
      }
    } catch (error) {
      console.error('Error loading receiver lists:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save lists to localStorage
  const saveLists = useCallback((newLists: ReceiverList[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_LISTS, JSON.stringify(newLists));
      setFullLists(newLists);
    } catch (error) {
      console.error('Error saving receiver lists:', error);
    }
  }, []);

  // Load a complete receiver list
  const loadReceiverList = useCallback(
    async (id: string): Promise<ReceiverList | null> => {
      try {
        const list = fullLists.find((l) => l.id === id);
        if (list) {
          setCurrentList(list);
          return list;
        }
      } catch (error) {
        console.error('Error loading receiver list:', error);
      }
      return null;
    },
    [fullLists]
  );

  // Create a new receiver list from processed receivers
  const createReceiverList = useCallback(
    (
      formData: ReceiverListForm,
      receivers: ProcessedReceiver[],
      sourceFileName?: string
    ): ReceiverList => {
      const validReceivers = receivers.filter((r) => r.isValid);

      const newList: ReceiverList = {
        id: crypto.randomUUID(),
        name: formData.name,
        description: formData.description,
        createdAt: new Date(),
        updatedAt: new Date(),
        sourceFileName,
        totalReceivers: receivers.length,
        validReceivers: validReceivers.length,
        receivers,
      };

      // Save the complete list
      const updatedLists = [...fullLists, newList];
      saveLists(updatedLists);
      setCurrentList(newList);

      return newList;
    },
    [fullLists, saveLists]
  );

  // Update an existing receiver list
  const updateReceiverList = useCallback(
    (
      id: string,
      formData: ReceiverListForm,
      receivers?: ProcessedReceiver[]
    ) => {
      const existingList = fullLists.find((list) => list.id === id);
      if (!existingList) return;

      const validReceivers = receivers
        ? receivers.filter((r) => r.isValid)
        : [];

      const updatedList: ReceiverList = {
        id,
        name: formData.name,
        description: formData.description,
        createdAt: existingList.createdAt,
        updatedAt: new Date(),
        sourceFileName: existingList.sourceFileName,
        totalReceivers: receivers
          ? receivers.length
          : existingList.totalReceivers,
        validReceivers: receivers
          ? validReceivers.length
          : existingList.validReceivers,
        receivers: receivers || existingList.receivers || [],
      };

      // Update the lists array
      const updatedLists = fullLists.map((list) =>
        list.id === id ? updatedList : list
      );
      saveLists(updatedLists);

      if (currentList?.id === id) {
        setCurrentList(updatedList);
      }
    },
    [fullLists, currentList, saveLists]
  );

  // Delete a receiver list
  const deleteReceiverList = useCallback(
    (id: string) => {
      try {
        // Remove from lists
        const updatedLists = fullLists.filter((list) => list.id !== id);
        saveLists(updatedLists);

        // Clear current list if it's the one being deleted
        if (currentList?.id === id) {
          setCurrentList(null);
        }
      } catch (error) {
        console.error('Error deleting receiver list:', error);
      }
    },
    [fullLists, currentList, saveLists]
  );

  // Clear current list
  const clearCurrentList = useCallback(() => {
    setCurrentList(null);
  }, []);

  // Get list summary by ID
  const getListSummary = useCallback(
    (id: string): ReceiverListSummary | undefined => {
      const list = fullLists.find((list) => list.id === id);
      return list ? toSummary(list) : undefined;
    },
    [fullLists]
  );

  // Get list summaries (for components that only need metadata)
  const getListSummaries = useCallback((): ReceiverListSummary[] => {
    return fullLists.map(toSummary);
  }, [fullLists]);

  // Export list as CSV
  const exportList = useCallback(
    (id: string, includeInvalid = false) => {
      const summary = getListSummary(id);
      if (!summary) {
        console.error('List not found');
        return;
      }

      loadReceiverList(id).then((list) => {
        if (!list) return;

        const receiversToExport = includeInvalid
          ? list.receivers
          : list.receivers.filter((r) => r.isValid);

        if (receiversToExport.length === 0) {
          alert('No receivers to export');
          return;
        }

        const csvContent = [
          'full name,emails,location,timezone,timezone_source,tags,validation_status,errors',
          ...receiversToExport.map(
            (r) =>
              `"${r.fullName}","${r.emails.join(';')}","${r.location}","${r.timezone}","${r.timezoneSource}","${r.tags.map((t) => t.name).join(';')}","${r.isValid ? 'valid' : 'invalid'}","${r.validationErrors.join(';')}"`
          ),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${summary.name.replace(/[^a-zA-Z0-9]/g, '_')}_receivers.csv`;
        a.click();
        URL.revokeObjectURL(url);
      });
    },
    [getListSummary, loadReceiverList]
  );

  // Expose summaries as 'lists' for backward compatibility with components
  const listSummaries = useMemo(() => fullLists.map(toSummary), [fullLists]);

  return {
    lists: listSummaries, // Return summaries for backward compatibility
    currentList,
    loading,
    createReceiverList,
    updateReceiverList,
    deleteReceiverList,
    loadReceiverList,
    clearCurrentList,
    getListSummary,
    getListSummaries,
    exportList,
  };
};
