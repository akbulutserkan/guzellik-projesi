'use client';

import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Service } from './useServiceData';
import { ServiceCategory } from './useServiceCategory';

interface UseServiceUIProps {
  initialModalState?: boolean;
}

/**
 * Hizmet UI hook'u
 */
export const useServiceUI = ({ initialModalState = false }: UseServiceUIProps = {}) => {
  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(initialModalState);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(initialModalState);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(initialModalState);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(initialModalState);
  
  // Seçili item state
  const [selectedServiceForEdit, setSelectedServiceForEdit] = useState<Service | null>(null);
  const [selectedServiceForDelete, setSelectedServiceForDelete] = useState<Service | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  
  // Tab kontrol state
  const [activeTab, setActiveTab] = useState<string>('services');
  
  /**
   * Modal açma/kapama işlemleri
   */
  const openCreateModal = useCallback(() => setIsCreateModalOpen(true), []);
  const closeCreateModal = useCallback(() => setIsCreateModalOpen(false), []);
  
  const openEditModal = useCallback((service: Service) => {
    setSelectedServiceForEdit(service);
    setIsEditModalOpen(true);
  }, []);
  
  const closeEditModal = useCallback(() => {
    setSelectedServiceForEdit(null);
    setIsEditModalOpen(false);
  }, []);
  
  const openDeleteModal = useCallback((service: Service) => {
    setSelectedServiceForDelete(service);
    setIsDeleteModalOpen(true);
  }, []);
  
  const closeDeleteModal = useCallback(() => {
    setSelectedServiceForDelete(null);
    setIsDeleteModalOpen(false);
  }, []);
  
  const openCategoryModal = useCallback(() => setIsCategoryModalOpen(true), []);
  const closeCategoryModal = useCallback(() => setIsCategoryModalOpen(false), []);
  
  /**
   * Tab değiştirme işlemi
   */
  const switchTab = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);
  
  /**
   * Başarı toast mesajı gösterir
   */
  const showSuccessToast = useCallback((message: string) => {
    toast({
      title: 'Başarılı',
      description: message,
      variant: 'default'
    });
  }, []);
  
  /**
   * Hata toast mesajı gösterir
   */
  const showErrorToast = useCallback((message: string) => {
    toast({
      title: 'Hata',
      description: message,
      variant: 'destructive'
    });
  }, []);
  
  /**
   * Uyarı toast mesajı gösterir
   */
  const showWarningToast = useCallback((message: string) => {
    toast({
      title: 'Uyarı',
      description: message,
      variant: 'warning'
    });
  }, []);
  
  /**
   * Hizmet verilerini görüntüleme için formatlar
   */
  const formatService = useCallback((service: any): Service => {
    return {
      ...service,
      id: service.id || '',
      name: service.name || '',
      description: service.description || '',
      price: typeof service.price === 'number' ? service.price : 0,
      duration: typeof service.duration === 'number' ? service.duration : 30,
      categoryId: service.categoryId || '',
      categoryName: service.categoryName || '',
      isActive: service.isActive !== undefined ? service.isActive : true
    };
  }, []);
  
  return {
    // Modal state
    isCreateModalOpen,
    isEditModalOpen,
    isDeleteModalOpen,
    isCategoryModalOpen,
    
    // Seçili itemler
    selectedServiceForEdit,
    selectedServiceForDelete,
    selectedCategory,
    setSelectedCategory,
    
    // Tab kontrol
    activeTab,
    switchTab,
    
    // Modal işlemleri
    openCreateModal,
    closeCreateModal,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
    openCategoryModal,
    closeCategoryModal,
    
    // UI işlemleri
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    formatService
  };
};

export default useServiceUI;