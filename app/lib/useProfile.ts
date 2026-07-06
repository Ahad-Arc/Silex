"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "./supabase/client";

export interface UserProfile {
  id: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string | null;
  language: string | null;
  currency_preference: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileState {
  profile: UserProfile | null;
  email: string;
  createdAt: string;
  loading: boolean;
  saving: boolean;
}

export interface ProfileActions {
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  uploadAvatar: (file: File, onProgress?: (p: number) => void) => Promise<string | null>;
  removeAvatar: () => Promise<void>;
  signOut: () => Promise<void>;
  signOutAllDevices: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export type ProfileHook = ProfileState & ProfileActions;

export function useProfile(): ProfileHook {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const supabase = createClient() as any;

  // Load profile and auth details on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        setEmail(user.email || "");
        setCreatedAt(user.created_at || "");

        // Get custom profile columns from public.users table
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error loading profile details:", error.message);
        } else if (data) {
          setProfile(data as UserProfile);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  // Realtime subscription for profile changes
  useEffect(() => {
    if (!profile?.id) return;

    const supabase = createClient() as any;

    const channel = supabase.channel(`realtime-users-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${profile.id}`,
        },
        (payload: any) => {
          setProfile(payload.new as UserProfile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  // Update profile database columns
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", profile.id);

      if (error) throw error;

      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err: any) {
      console.error("Error updating profile fields:", err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [profile]);

  // Update account email
  const updateEmail = useCallback(async (newEmail: string) => {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) throw error;
  }, []);

  // Update account password
  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }, []);

  // Upload profile photo to storage and update db URL
  const uploadAvatar = useCallback(async (file: File, onProgress?: (p: number) => void) => {
    if (!profile) return null;
    setSaving(true);

    try {
      // 1. Delete old avatar file from storage if there was one
      if (profile.avatar_url) {
        try {
          const oldUrl = new URL(profile.avatar_url);
          const oldPath = oldUrl.pathname.split("/storage/v1/object/public/avatars/")[1];
          if (oldPath) {
            await supabase.storage.from("avatars").remove([decodeURIComponent(oldPath)]);
          }
        } catch (e) {
          console.error("Failed to clean up old avatar file from storage:", e);
        }
      }

      // 2. Upload the file to avatars bucket
      const fileExt = file.name.split(".").pop() || "png";
      const filePath = `${profile.id}/avatar-${Date.now()}.${fileExt}`;

      // Simulate progress for smooth UI animation
      let currentProgress = 0;
      const progressTimer = setInterval(() => {
        currentProgress += 15;
        if (currentProgress > 90) clearInterval(progressTimer);
        if (onProgress) onProgress(Math.min(currentProgress, 90));
      }, 100);

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      clearInterval(progressTimer);

      if (uploadErr) throw uploadErr;
      if (onProgress) onProgress(100);

      // 3. Get the public asset URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // 4. Persist the avatar URL in database
      const { error: dbErr } = await supabase
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);

      if (dbErr) throw dbErr;

      setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : null));
      return publicUrl;
    } catch (err: any) {
      console.error("Failed to upload avatar photo:", err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [profile]);

  // Remove avatar photo
  const removeAvatar = useCallback(async () => {
    if (!profile) return;
    setSaving(true);

    try {
      // 1. Delete file from storage
      if (profile.avatar_url) {
        try {
          const oldUrl = new URL(profile.avatar_url);
          const oldPath = oldUrl.pathname.split("/storage/v1/object/public/avatars/")[1];
          if (oldPath) {
            await supabase.storage.from("avatars").remove([decodeURIComponent(oldPath)]);
          }
        } catch (e) {
          console.error("Failed to parse old avatar URL for deletion:", e);
        }
      }

      // 2. Set DB column to null
      const { error: dbErr } = await supabase
        .from("users")
        .update({ avatar_url: null })
        .eq("id", profile.id);

      if (dbErr) throw dbErr;

      setProfile((prev) => (prev ? { ...prev, avatar_url: null } : null));
    } catch (err: any) {
      console.error("Failed to remove avatar:", err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [profile]);

  // Sign out current session
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }, []);

  // Sign out all sessions
  const signOutAllDevices = useCallback(async () => {
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) throw error;
    window.location.href = "/login";
  }, []);

  // Delete account cascading operation
  const deleteAccount = useCallback(async () => {
    if (!profile) return;
    
    // 1. Delete storage files
    if (profile.avatar_url) {
      try {
        const oldUrl = new URL(profile.avatar_url);
        const oldPath = oldUrl.pathname.split("/storage/v1/object/public/avatars/")[1];
        if (oldPath) {
          await supabase.storage.from("avatars").remove([decodeURIComponent(oldPath)]);
        }
      } catch (e) {
        console.error("Failed storage cleanup during delete:", e);
      }
    }

    // 2. Invoke security-definer PostgreSQL RPC delete function
    const { error } = await supabase.rpc("delete_own_account");
    if (error) throw error;

    // 3. Clear auth cookies and redirect
    await supabase.auth.signOut();
    window.location.href = "/login";
  }, [profile]);

  return {
    profile,
    email,
    createdAt,
    loading,
    saving,
    updateProfile,
    updateEmail,
    updatePassword,
    uploadAvatar,
    removeAvatar,
    signOut,
    signOutAllDevices,
    deleteAccount,
  };
}
