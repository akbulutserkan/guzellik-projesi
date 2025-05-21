'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { formatName, formatServiceName } from '@/lib/utils';

// ActionButtons bileşeni
interface ActionButtonsProps {
  isEditing?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  showEdit?: boolean;
  showDelete?: boolean;
}

const ActionButtons = ({
  isEditing = false,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  showEdit = true,
  showDelete = true,
}: ActionButtonsProps) => {
  if (isEditing) {
    return (
      <div className="flex gap-2">
        {onSave && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSave}
            className="hover:bg-green-50"
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
        )}
        {onCancel && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="hover:bg-red-50"
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {showEdit && onEdit && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="hover:bg-blue-50"
        >
          <Pencil className="h-4 w-4 text-blue-600" />
        </Button>
      )}
      {showDelete && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 text-red-600" />
        </Button>
      )}
    </div>
  );
};

// EditableField arayüzü
interface EditableField {
  key: string;
  label: string;
  type: 'text' | 'number';
  value: string | number;
  min?: number;
  step?: number;
}

// EditableItemProps arayüzü
interface EditableItemProps {
  title: string;
  subtitle?: string;
  fields: EditableField[];
  onUpdate: (data: Record<string, any>) => Promise<void>;
  onDelete?: () => Promise<void>;
  renderCustomView?: (isEditing: boolean) => React.ReactNode;
  showEditButton?: boolean;
  showDeleteButton?: boolean;
}

// EditableItem bileşeni
export const EditableItem = ({
  title,
  subtitle,
  fields,
  onUpdate,
  onDelete,
  renderCustomView,
  showEditButton = true,
  showDeleteButton = true,
}: EditableItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Record<string, any>>(
    fields.reduce((acc, field) => ({ ...acc, [field.key]: field.value }), {})
  );

  const handleFieldChange = (key: string, value: string | number) => {
    setEditedData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      // Eğer başlık alanı varsa ve düzenlenebilir ise, onu formatlayın
      if (editedData.title) {
        editedData.title = formatServiceName(editedData.title);
      }
      
      // Form verilerini gönder
      await onUpdate(editedData);
      setIsEditing(false);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center justify-between p-4 border rounded bg-gray-50">
        <div className="flex-1">
          <h3 className="font-medium">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
        
        {/* Sağ tarafta input'lar ve butonlar */}
        <div className="flex items-center gap-6">
          {/* İnput'lar */}
          <div className="flex items-center gap-4">
            {fields.map((field) => (
              <div key={field.key} className="flex items-center gap-2">
                <label className="text-sm whitespace-nowrap">{field.label}:</label>
                <Input
                  type={field.type}
                  value={editedData[field.key] || ''}
                  onChange={(e) =>
                    handleFieldChange(
                      field.key,
                      field.type === 'number'
                        ? parseFloat(e.target.value)
                        : e.target.value
                    )
                  }
                  className="w-24 h-8"
                  min={field.min}
                  step={field.step}
                />
              </div>
            ))}
          </div>
          
          {/* Kaydet/İptal Butonları */}
          <ActionButtons
            isEditing={true}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded hover:bg-gray-50">
      {/* Sol tarafta başlık */}
      <div className="flex-1">
        <h3 className="font-medium">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
      
      {/* Sağ tarafta butonlar ve değerler */}
      <div className="flex items-center gap-6">
        {/* Düzenle/Sil Butonları */}
        <ActionButtons
          onEdit={() => setIsEditing(true)}
          onDelete={onDelete}
          showEdit={showEditButton}
          showDelete={showDeleteButton}
        />
        
        {/* Değerler (Süre ve Fiyat) */}
        {renderCustomView?.(false)}
      </div>
    </div>
  );
};

export default EditableItem;