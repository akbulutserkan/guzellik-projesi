'use client'

import { useState, useEffect } from 'react'
import { withPageAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import AppointmentDetailModal from '@/components/appointments/AppointmentDetailModal'

// Import the appointment management hook
import { useAppointmentManagement } from '@/hooks/appointment'

// Import formatters
import { 
  formatDateTime, 
  getStatusColor, 
  getStatusText 
} from '@/utils/appointment/formatters'

// Status filters enum
const STATUS_FILTERS = {
  ALL: 'Tümü',
  ACTIVE: 'Aktif Randevular',
  NO_SHOW: 'Gelmeyen Randevular',
  COMPLETED: 'Tamamlanan Randevular'
} as const;

// AppointmentStats component
const AppointmentStats = ({ stats }: { stats: any }) => {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-gray-500">Toplam Randevu</h3>
        <p className="text-2xl font-bold">{stats.total}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-gray-500">Aktif Randevular</h3>
        <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-gray-500">Gelmeyenler</h3>
        <p className="text-2xl font-bold text-purple-600">{stats.noShow}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-gray-500">Tamamlananlar</h3>
        <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
      </div>
    </div>
  );
};

function AppointmentsPage() {
  // Use the appointment management hook
  const {
    // State
    loading,
    error,
    deleteError,
    currentFilter,
    filteredGroupedAppointments,
    selectedAppointment,
    isEditModalOpen,
    appointmentsForModal,
    stats,
    
    // Actions
    setCurrentFilter,
    setIsEditModalOpen,
    setSelectedAppointment,
    fetchAppointments,
    handleDeleteAppointment,
    handleOpenAppointmentDetail,
    permissions
  } = useAppointmentManagement({
    autoFetch: true,
    showToasts: true
  });

  // Check if user has permission to view appointments
  if (!permissions.canView) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Yetkisiz Erişim</h1>
          <p className="mt-2">
            Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Randevular</h1>
      </div>

      {/* Statistics */}
      <AppointmentStats stats={stats} />

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {Object.entries(STATUS_FILTERS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setCurrentFilter(key)}
            className={`px-4 py-2 rounded ${
              currentFilter === key
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Error messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {deleteError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {deleteError}
        </div>
      )}

      {/* Appointments table */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Müşteri
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hizmet
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tarih
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(filteredGroupedAppointments || {}).flatMap(([dateKey, appointmentsForDate]) => {
              // Get unique customer names
              const customerNames = [...new Set(appointmentsForDate.map(app => app.customer?.name))];
              
              // Get unique service names
              const serviceNames = appointmentsForDate.map(app => app.service?.name);
              const uniqueServiceNames = [...new Set(serviceNames)];
              
              // Get all statuses for this group
              const statuses = appointmentsForDate.map(app => app.status);
              
              // Format date (use the first appointment's time)
              const formattedDate = formatDateTime(appointmentsForDate[0].startTime);
              
              return (
                <tr key={dateKey}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customerNames.join(', ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {uniqueServiceNames.join(', ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formattedDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {statuses.map((status, index) => (
                      <span key={index} className={`px-2 mr-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)}`}>
                        {getStatusText(status)}
                      </span>
                    ))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button
                      variant="ghost"
                      className="text-indigo-600 hover:text-indigo-900"
                      onClick={() => handleOpenAppointmentDetail(appointmentsForDate)}
                    >
                      Düzenle
                    </Button>
                    {permissions.canDelete && (
                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteAppointment(appointmentsForDate[0].id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Sil
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <AppointmentDetailModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          appointment={selectedAppointment}
          allAppointments={appointmentsForModal}
          onUpdate={fetchAppointments}
        />
      )}
    </div>
  );
}

export default withPageAuth(AppointmentsPage);
