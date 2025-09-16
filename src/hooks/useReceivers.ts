import { useCallback, useState } from 'react';

import {
  DEFAULT_TAGS,
  ProcessedReceiver,
  ReceiverTag,
  TagForm,
} from '@/types/receiver';

const STORAGE_KEY_RECEIVERS = 'batch_receivers';
const STORAGE_KEY_TAGS = 'receiver_tags';

export const useReceivers = () => {
  const [receivers, setReceivers] = useState<ProcessedReceiver[]>([]);
  const [tags, setTags] = useState<ReceiverTag[]>(() => {
    // Initialize with default tags
    const storedTags = localStorage.getItem(STORAGE_KEY_TAGS);
    if (storedTags) {
      try {
        return JSON.parse(storedTags).map((tag: unknown) => {
          const tagData = tag as Omit<ReceiverTag, 'createdAt'> & {
            createdAt: string;
          };
          return {
            ...tagData,
            createdAt: new Date(tagData.createdAt),
          };
        });
      } catch {
        // Fall back to default tags if parsing fails
      }
    }

    // Create default tags with IDs and timestamps
    return DEFAULT_TAGS.map((tag) => ({
      ...tag,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    }));
  });

  // Save tags to localStorage whenever they change
  const saveTags = useCallback((newTags: ReceiverTag[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_TAGS, JSON.stringify(newTags));
      setTags(newTags);
    } catch (error) {
      console.error('Error saving tags:', error);
    }
  }, []);

  // Save receivers to localStorage whenever they change
  const saveReceivers = useCallback((newReceivers: ProcessedReceiver[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_RECEIVERS, JSON.stringify(newReceivers));
      setReceivers(newReceivers);
    } catch (error) {
      console.error('Error saving receivers:', error);
    }
  }, []);

  // Add new tag
  const addTag = useCallback(
    (tagData: TagForm) => {
      const newTag: ReceiverTag = {
        id: crypto.randomUUID(),
        name: tagData.name,
        color: tagData.color,
        createdAt: new Date(),
      };

      const updatedTags = [...tags, newTag];
      saveTags(updatedTags);
      return newTag;
    },
    [tags, saveTags]
  );

  // Update existing tag
  const updateTag = useCallback(
    (id: string, tagData: TagForm) => {
      const updatedTags = tags.map((tag) =>
        tag.id === id
          ? { ...tag, name: tagData.name, color: tagData.color }
          : tag
      );
      saveTags(updatedTags);
    },
    [tags, saveTags]
  );

  // Delete tag
  const deleteTag = useCallback(
    (id: string) => {
      // Remove tag from all receivers first
      const updatedReceivers = receivers.map((receiver) => ({
        ...receiver,
        tags: receiver.tags.filter((tag) => tag.id !== id),
      }));
      saveReceivers(updatedReceivers);

      // Remove tag from tags list
      const updatedTags = tags.filter((tag) => tag.id !== id);
      saveTags(updatedTags);
    },
    [tags, receivers, saveTags, saveReceivers]
  );

  // Add tag to receiver
  const addTagToReceiver = useCallback(
    (receiverId: string, tagId: string) => {
      const tag = tags.find((t) => t.id === tagId);
      if (!tag) return;

      const updatedReceivers = receivers.map((receiver) => {
        if (receiver.id === receiverId) {
          // Check if tag is already assigned
          const hasTag = receiver.tags.some((t) => t.id === tagId);
          if (!hasTag) {
            return {
              ...receiver,
              tags: [...receiver.tags, tag],
            };
          }
        }
        return receiver;
      });

      saveReceivers(updatedReceivers);
    },
    [receivers, tags, saveReceivers]
  );

  // Add tag to multiple receivers at once
  const addTagToMultipleReceivers = useCallback(
    (receiverIds: string[], tagId: string) => {
      const tag = tags.find((t) => t.id === tagId);
      if (!tag) return 0;

      let assignedCount = 0;
      const updatedReceivers = receivers.map((receiver) => {
        if (receiverIds.includes(receiver.id)) {
          // Check if tag is already assigned
          const hasTag = receiver.tags.some((t) => t.id === tagId);
          if (!hasTag) {
            assignedCount++;
            return {
              ...receiver,
              tags: [...receiver.tags, tag],
            };
          }
        }
        return receiver;
      });

      saveReceivers(updatedReceivers);
      return assignedCount;
    },
    [receivers, tags, saveReceivers]
  );

  // Remove tag from receiver
  const removeTagFromReceiver = useCallback(
    (receiverId: string, tagId: string) => {
      const updatedReceivers = receivers.map((receiver) => {
        if (receiver.id === receiverId) {
          return {
            ...receiver,
            tags: receiver.tags.filter((tag) => tag.id !== tagId),
          };
        }
        return receiver;
      });

      saveReceivers(updatedReceivers);
    },
    [receivers, saveReceivers]
  );

  // Set all receivers
  const setAllReceivers = useCallback(
    (newReceivers: ProcessedReceiver[]) => {
      saveReceivers(newReceivers);
    },
    [saveReceivers]
  );

  // Update receiver
  const updateReceiver = useCallback(
    (id: string, updates: Partial<ProcessedReceiver>) => {
      const updatedReceivers = receivers.map((receiver) =>
        receiver.id === id ? { ...receiver, ...updates } : receiver
      );
      saveReceivers(updatedReceivers);
    },
    [receivers, saveReceivers]
  );

  // Delete receiver
  const deleteReceiver = useCallback(
    (id: string) => {
      const updatedReceivers = receivers.filter(
        (receiver) => receiver.id !== id
      );
      saveReceivers(updatedReceivers);
    },
    [receivers, saveReceivers]
  );

  // Clear all receivers
  const clearReceivers = useCallback(() => {
    setReceivers([]);
    localStorage.removeItem(STORAGE_KEY_RECEIVERS);
  }, []);

  // Get receivers by tag
  const getReceiversByTag = useCallback(
    (tagId: string) => {
      return receivers.filter((receiver) =>
        receiver.tags.some((tag) => tag.id === tagId)
      );
    },
    [receivers]
  );

  // Get valid receivers only
  const getValidReceivers = useCallback(() => {
    return receivers.filter((receiver) => receiver.isValid);
  }, [receivers]);

  return {
    receivers,
    tags,
    addTag,
    updateTag,
    deleteTag,
    addTagToReceiver,
    addTagToMultipleReceivers,
    removeTagFromReceiver,
    setAllReceivers,
    updateReceiver,
    deleteReceiver,
    clearReceivers,
    getReceiversByTag,
    getValidReceivers,
  };
};
