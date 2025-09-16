import { useCallback, useEffect, useState } from 'react';

import {
  ProcessedReceiver,
  ReceiverList,
  ReceiverListForm,
  ReceiverListSummary,
  ReceiverTag,
} from '@/types/receiver';

const STORAGE_KEY_LISTS = 'receiver_lists';

export const useReceiverLists = () => {
  const [lists, setLists] = useState<ReceiverListSummary[]>([]);
  const [currentList, setCurrentList] = useState<ReceiverList | null>(null);
  const [loading, setLoading] = useState(true);

  // Load list summaries from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LISTS);
      if (stored) {
        const parsedLists = JSON.parse(stored).map((list: unknown) => {
          const listData = list as Omit<
            ReceiverListSummary,
            'createdAt' | 'updatedAt'
          > & {
            createdAt: string;
            updatedAt: string;
          };
          return {
            ...listData,
            createdAt: new Date(listData.createdAt),
            updatedAt: new Date(listData.updatedAt),
          };
        });
        setLists(parsedLists);
      }
    } catch (error) {
      console.error('Error loading receiver lists:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save lists to localStorage
  const saveLists = useCallback((newLists: ReceiverListSummary[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_LISTS, JSON.stringify(newLists));
      setLists(newLists);
    } catch (error) {
      console.error('Error saving receiver lists:', error);
    }
  }, []);

  // Save a complete receiver list
  const saveReceiverList = useCallback((list: ReceiverList) => {
    try {
      const listKey = `receiver_list_${list.id}`;
      localStorage.setItem(listKey, JSON.stringify(list));
    } catch (error) {
      console.error('Error saving receiver list data:', error);
    }
  }, []);

  // Load a complete receiver list
  const loadReceiverList = useCallback(
    async (id: string): Promise<ReceiverList | null> => {
      try {
        const listKey = `receiver_list_${id}`;
        const stored = localStorage.getItem(listKey);
        if (stored) {
          const parsedList = JSON.parse(stored);

          // Convert date strings back to Date objects
          const list: ReceiverList = {
            ...parsedList,
            createdAt: new Date(parsedList.createdAt),
            updatedAt: new Date(parsedList.updatedAt),
            receivers: parsedList.receivers.map((receiver: unknown) => {
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

          setCurrentList(list);
          return list;
        }
      } catch (error) {
        console.error('Error loading receiver list:', error);
      }
      return null;
    },
    []
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
      saveReceiverList(newList);

      // Update the summaries
      const newSummary: ReceiverListSummary = {
        id: newList.id,
        name: newList.name,
        description: newList.description,
        createdAt: newList.createdAt,
        updatedAt: newList.updatedAt,
        sourceFileName: newList.sourceFileName,
        totalReceivers: newList.totalReceivers,
        validReceivers: newList.validReceivers,
      };

      const updatedLists = [...lists, newSummary];
      saveLists(updatedLists);
      setCurrentList(newList);

      return newList;
    },
    [lists, saveLists, saveReceiverList]
  );

  // Update an existing receiver list
  const updateReceiverList = useCallback(
    (
      id: string,
      formData: ReceiverListForm,
      receivers?: ProcessedReceiver[]
    ) => {
      const existingList = lists.find((list) => list.id === id);
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
        receivers: receivers || currentList?.receivers || [],
      };

      // Save the complete list
      saveReceiverList(updatedList);

      // Update the summaries
      const updatedSummary: ReceiverListSummary = {
        id: updatedList.id,
        name: updatedList.name,
        description: updatedList.description,
        createdAt: updatedList.createdAt,
        updatedAt: updatedList.updatedAt,
        sourceFileName: updatedList.sourceFileName,
        totalReceivers: updatedList.totalReceivers,
        validReceivers: updatedList.validReceivers,
      };

      const updatedLists = lists.map((list) =>
        list.id === id ? updatedSummary : list
      );
      saveLists(updatedLists);

      if (currentList?.id === id) {
        setCurrentList(updatedList);
      }
    },
    [lists, currentList, saveLists, saveReceiverList]
  );

  // Delete a receiver list
  const deleteReceiverList = useCallback(
    (id: string) => {
      try {
        // Remove from summaries
        const updatedLists = lists.filter((list) => list.id !== id);
        saveLists(updatedLists);

        // Remove the complete list data
        const listKey = `receiver_list_${id}`;
        localStorage.removeItem(listKey);

        // Clear current list if it's the one being deleted
        if (currentList?.id === id) {
          setCurrentList(null);
        }
      } catch (error) {
        console.error('Error deleting receiver list:', error);
      }
    },
    [lists, currentList, saveLists]
  );

  // Clear current list
  const clearCurrentList = useCallback(() => {
    setCurrentList(null);
  }, []);

  // Get list summary by ID
  const getListSummary = useCallback(
    (id: string) => {
      return lists.find((list) => list.id === id);
    },
    [lists]
  );

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

  return {
    lists,
    currentList,
    loading,
    createReceiverList,
    updateReceiverList,
    deleteReceiverList,
    loadReceiverList,
    clearCurrentList,
    getListSummary,
    exportList,
  };
};
