'use client';

import { useState, useEffect, useCallback } from 'react';
// MCP ile personel listesini getir
import { getStaff } from '@/services/staffService';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";
import StaffTable from '@/components/staff/StaffTable';
import NewStaffModal from '@/components/staff/NewStaffModal';
import EditStaffModal from '@/components/staff/EditStaffModal';
import { useSession } from "next-auth/react";
import { withPageAuth } from '@/lib/auth';
import { Permission } from '@prisma/client';

function StaffPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { data: session } = useSession();

  const fetchStaff = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Merkezi staff modülünü kullanarak personel verilerini getir
      const result = await getStaff(false); // includeInactive: false
      
      // API'den dönen veriyi doğru şekilde işle
      let staffData = [];
      
      if (result && typeof result === 'object') {
        // API yanıtı { activeStaff, allStaff } formatında ise
        if (result.activeStaff && Array.isArray(result.activeStaff)) {
          console.log('Active staff verisi bulundu:', result.activeStaff.length);
          staffData = result.activeStaff;
        } else if (result.allStaff && Array.isArray(result.allStaff)) {
          console.log('All staff verisi bulundu:', result.allStaff.length);
          staffData = result.allStaff;
        } 
        // API yanıtı doğrudan dizi olarak dönüyorsa
        else if (Array.isArray(result)) {
          console.log('Dizi formatında staff verisi bulundu:', result.length);
          staffData = result;
        }
        // API yanıtının içeriğini kontrol et (veri dönüp dönmediğini anlamak için)
        console.log('İşlenmiş personel verisi:', staffData);
      }
      
      setStaff(staffData);
    } catch (error) {
      console.error('Personel getirme hatası:', error);
      toast({ 
        variant: "destructive", 
        title: "Hata", 
        description: error instanceof Error ? error.message : "Personel listesi alınamadı" 
      });
      // Hata durumunda boş bir dizi ayarla
      setStaff([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleStaffAdded = useCallback(() => {
    setIsModalOpen(false);
    fetchStaff();
    toast({ title: "Başarılı", description: "Personel başarıyla eklendi" });
  }, [fetchStaff]);

  const handleEdit = useCallback((staff) => {
    setSelectedStaff(staff);
    setIsEditModalOpen(true);
  }, []);

  const handleEditSuccess = useCallback(() => {
    setIsEditModalOpen(false);
    fetchStaff();
    toast({ title: "Başarılı", description: "Personel başarıyla güncellendi" });
  }, [fetchStaff]);

  const canAdd = session?.user.role === 'ADMIN' || session?.user.permissions?.includes(Permission.CREATE_STAFF);
  const canEdit = session?.user.role === 'ADMIN' || session?.user.permissions?.includes(Permission.EDIT_STAFF);
  const canDelete = session?.user.role === 'ADMIN' || session?.user.permissions?.includes(Permission.DELETE_STAFF);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Personel Yönetimi</h1>
        {canAdd && (
          <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#204937] hover:bg-[#183b2d] text-white whitespace-nowrap shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="h-4 w-4 mr-2" /> Yeni Personel
        </Button>
        )}
      </div>

      <Card className="shadow-lg border border-gray-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="animate-pulse space-y-4 p-6">
            <div className="h-8 bg-gray-200 rounded-lg w-full mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        ) : (
          <StaffTable
            data={staff}
            isLoading={isLoading}
            onUpdate={fetchStaff}
            onEdit={handleEdit}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        )}
      </Card>

      <NewStaffModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleStaffAdded}
      />

      {selectedStaff && (
        <EditStaffModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onSuccess={handleEditSuccess}
          staff={selectedStaff}
        />
      )}
    </div>
  );
}

export default withPageAuth(StaffPage);