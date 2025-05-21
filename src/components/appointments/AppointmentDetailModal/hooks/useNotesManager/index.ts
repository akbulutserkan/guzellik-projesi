'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

/**
 * Hook for managing notes functionality in AppointmentDetailModal
 */
export const useNotesManager = ({
  appointment,
  onUpdate
}: {
  appointment: any;
  onUpdate: () => Promise<void>;
}) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<string>(appointment?.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);
  const [originalNotes, setOriginalNotes] = useState<string>(appointment?.notes || '');
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * Save notes to the appointment
   */
  const saveNotes = useCallback(async () => {
    // Only save if notes have changed
    if (notes === originalNotes) {
      setIsEditingNotes(false);
      return true;
    }
    
    try {
      setLoading(true);
      
      // Import and use the service instead of direct fetch
      const { updateAppointment } = await import('@/services/appointmentService');
      await updateAppointment(appointment.id, { notes }, true);
      
      // Update original notes to match current notes
      setOriginalNotes(notes);
      
      // Exit editing mode
      setIsEditingNotes(false);
      
      // Show success message
      toast({
        title: 'Başarılı',
        description: 'Notlar başarıyla kaydedildi'
      });
      
      // Update UI
      onUpdate();
      
      return true;
    } catch (error) {
      console.error('Error saving notes:', error);
      
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Notlar kaydedilirken bir hata oluştu'
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [appointment, notes, originalNotes, toast, onUpdate]);

  /**
   * Cancel editing notes
   */
  const cancelNotesEdit = useCallback(() => {
    // Revert to original notes
    setNotes(originalNotes);
    setIsEditingNotes(false);
  }, [originalNotes]);

  /**
   * Start editing notes
   */
  const startEditingNotes = useCallback(() => {
    setIsEditingNotes(true);
  }, []);

  /**
   * Check if notes have changed
   */
  const hasNotesChanged = useCallback(() => {
    return notes !== originalNotes;
  }, [notes, originalNotes]);

  // Return state and functions
  return {
    notes,
    setNotes,
    isEditingNotes,
    setIsEditingNotes,
    originalNotes,
    setOriginalNotes,
    loading,
    saveNotes,
    cancelNotesEdit,
    startEditingNotes,
    hasNotesChanged
  };
};

export default useNotesManager;
