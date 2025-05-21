'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAppointmentPermissions } from './useAppointmentPermissions';

/**
 * Hook props interface
 */
interface UseAppointmentNotesProps {
  initialNotes?: string;
  appointmentId?: string;
  onSave?: (appointmentId: string, notes: string) => Promise<boolean>;
  showToasts?: boolean;
}

/**
 * Hook for managing appointment notes
 */
export const useAppointmentNotes = ({
  initialNotes = '',
  appointmentId = '',
  onSave,
  showToasts = true
}: UseAppointmentNotesProps = {}) => {
  // State
  const [notes, setNotes] = useState<string>(initialNotes);
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);
  const [originalNotes, setOriginalNotes] = useState<string>(initialNotes);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Hooks
  const { toast } = useToast();
  const { canEditAppointmentNotes } = useAppointmentPermissions();
  
  /**
   * Start editing notes
   */
  const startEditingNotes = useCallback(() => {
    if (!canEditAppointmentNotes) {
      if (showToasts) {
        toast({
          variant: 'destructive',
          title: 'Yetkisiz İşlem',
          description: 'Not düzenleme yetkiniz bulunmamaktadır.'
        });
      }
      return;
    }
    
    setIsEditingNotes(true);
  }, [canEditAppointmentNotes, showToasts, toast]);
  
  /**
   * Cancel editing notes
   */
  const cancelEditingNotes = useCallback(() => {
    setIsEditingNotes(false);
    setNotes(originalNotes);
  }, [originalNotes]);
  
  /**
   * Save notes for the appointment
   */
  const saveNotes = useCallback(async () => {
    if (!canEditAppointmentNotes || !appointmentId) return false;
    
    // If no changes, just close edit mode
    if (notes === originalNotes) {
      setIsEditingNotes(false);
      return true;
    }
    
    try {
      setIsSaving(true);
      
      if (onSave) {
        const success = await onSave(appointmentId, notes);
        
        if (success) {
          // Update original notes to match current notes
          setOriginalNotes(notes);
          
          // Exit editing mode
          setIsEditingNotes(false);
          
          if (showToasts) {
            toast({
              title: 'Başarılı',
              description: 'Notlar kaydedildi'
            });
          }
          
          return true;
        } else {
          if (showToasts) {
            toast({
              variant: 'destructive',
              title: 'Hata',
              description: 'Notlar kaydedilirken bir hata oluştu'
            });
          }
          
          return false;
        }
      }
      
      // If no onSave callback provided
      return false;
    } catch (error) {
      console.error('Save notes error:', error);
      
      if (showToasts) {
        toast({
          variant: 'destructive',
          title: 'Hata',
          description: 'Notlar kaydedilirken bir hata oluştu'
        });
      }
      
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [canEditAppointmentNotes, appointmentId, notes, originalNotes, onSave, showToasts, toast]);
  
  /**
   * Update appointment notes (with new appointment)
   */
  const updateAppointmentNotes = useCallback((newNotes: string) => {
    setNotes(newNotes);
    setOriginalNotes(newNotes);
  }, []);
  
  return {
    // State
    notes,
    isEditingNotes,
    originalNotes,
    isSaving,
    
    // Setters
    setNotes,
    setIsEditingNotes,
    setOriginalNotes,
    
    // Actions
    startEditingNotes,
    cancelEditingNotes,
    saveNotes,
    updateAppointmentNotes,
    
    // Permissions
    canEditNotes: canEditAppointmentNotes
  };
};

export default useAppointmentNotes;