'use client';

import { useEffect, useRef } from 'react';

interface NoteEditorProps {
  notes: string;
  setNotes: (notes: string) => void;
  isEditingNotes: boolean;
  setIsEditingNotes: (isEditing: boolean) => void;
  originalNotes: string;
  loading: boolean;
  saveNotes: () => Promise<void>;
}

export default function NoteEditor({
  notes,
  setNotes,
  isEditingNotes,
  setIsEditingNotes,
  originalNotes,
  loading,
  saveNotes
}: NoteEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previousNotesRef = useRef(notes);
  
  // Modal dışına tıklandığında veya herhangi bir yere tıklandığında değişiklik varsa kaydet
  useEffect(() => {
    // Notlar düzenleniyorsa ve input referansı varsa
    if (isEditingNotes && inputRef.current) {
      const handleBlur = async () => {
        if (notes !== previousNotesRef.current) {
          await saveNotes();
          previousNotesRef.current = notes;
        }
        setIsEditingNotes(false);
      };

      const input = inputRef.current;
      input.addEventListener('blur', handleBlur);
      
      return () => {
        input.removeEventListener('blur', handleBlur);
      };
    }
  }, [isEditingNotes, notes, saveNotes, setIsEditingNotes, previousNotesRef]);

  return (
    <div className="mb-3">
      {isEditingNotes ? (
        <input 
          ref={inputRef}
          type="text" 
          className="w-full bg-[#fffce6] border-0 rounded-[8px] py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-md text-gray-700 placeholder-gray-400"
          style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notlar..."
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !loading) {
              e.preventDefault();
              saveNotes();
              setIsEditingNotes(false);
            }
          }}
        />
      ) : (
        <input 
          type="text" 
          className="w-full bg-[#fffce6] border-0 rounded-[8px] py-2 px-3 text-sm focus:outline-none text-gray-700 placeholder-gray-400 cursor-pointer shadow-md hover:shadow-lg transition-all"
          style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
          value={notes}
          placeholder="Notlar..."
          onClick={() => setIsEditingNotes(true)}
          readOnly
        />
      )}
    </div>
  );
}
