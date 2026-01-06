import { useCallback, useEffect, useState } from 'react';

import { Profile, ProfileForm } from '@/types/profile';

const STORAGE_KEY = 'email_profiles';

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Load profiles from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedProfiles = JSON.parse(stored).map((profile: unknown) => {
          const profileData = profile as Omit<
            Profile,
            'createdAt' | 'updatedAt'
          > & {
            createdAt: string;
            updatedAt: string;
          };
          return {
            ...profileData,
            createdAt: new Date(profileData.createdAt),
            updatedAt: new Date(profileData.updatedAt),
          };
        });
        setProfiles(parsedProfiles);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save profiles to localStorage whenever they change
  const saveProfiles = useCallback((newProfiles: Profile[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfiles));
      setProfiles(newProfiles);
    } catch (error) {
      console.error('Error saving profiles:', error);
    }
  }, []);

  // Add new profile
  const addProfile = useCallback(
    (profileData: ProfileForm) => {
      const newProfile: Profile = {
        id: crypto.randomUUID(),
        fullName: profileData.fullName,
        smtpConfigId: profileData.smtpConfigId,
        templateIds: profileData.templateIds,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedProfiles = [...profiles, newProfile];
      saveProfiles(updatedProfiles);
      return newProfile;
    },
    [profiles, saveProfiles]
  );

  // Update existing profile
  const updateProfile = useCallback(
    (id: string, profileData: ProfileForm) => {
      const updatedProfiles = profiles.map((profile) => {
        if (profile.id === id) {
          return {
            ...profile,
            fullName: profileData.fullName,
            smtpConfigId: profileData.smtpConfigId,
            templateIds: profileData.templateIds,
            updatedAt: new Date(),
          };
        }
        return profile;
      });

      saveProfiles(updatedProfiles);
    },
    [profiles, saveProfiles]
  );

  // Delete profile
  const deleteProfile = useCallback(
    (id: string) => {
      const updatedProfiles = profiles.filter((profile) => profile.id !== id);
      saveProfiles(updatedProfiles);
    },
    [profiles, saveProfiles]
  );

  // Get profile by ID
  const getProfile = useCallback(
    (id: string) => {
      return profiles.find((profile) => profile.id === id);
    },
    [profiles]
  );

  return {
    profiles,
    loading,
    addProfile,
    updateProfile,
    deleteProfile,
    getProfile,
  };
};
