import React from 'react'
import { PenSquare, ChevronDown, Search } from 'lucide-react'

interface Service {
  id: string
  name: string
  duration: number
  price: number
}

interface Staff {
  id: string
  firstName: string
  lastName: string
}

interface Props {
  currentService?: Service
  currentStaff?: Staff
  services: Service[]
  staffList: Staff[]
  searchTerm: string
  showServiceDropdown: boolean
  showStaffDropdown: boolean
  onServiceSelect: (service: Service) => void
  onStaffSelect: (staff: Staff) => void
  onSearchChange: (value: string) => void
  onToggleServiceDropdown: () => void
  onToggleStaffDropdown: () => void
}

export default function ServiceAndStaffSelector({
  currentService,
  currentStaff,
  services,
  staffList,
  searchTerm,
  showServiceDropdown,
  showStaffDropdown,
  onServiceSelect,
  onStaffSelect,
  onSearchChange,
  onToggleServiceDropdown,
  onToggleStaffDropdown
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Hizmet Seçimi */}
      <div className="relative">
        <div 
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer"
          onClick={onToggleServiceDropdown}
        >
          <div className="flex items-center">
            <span className="truncate">{currentService?.name || 'Hizmet Seçin'}</span>
            <button className="ml-2 text-gray-400 hover:text-gray-600">
              <PenSquare className="w-4 h-4" />
            </button>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showServiceDropdown ? 'transform rotate-180' : ''}`} />
        </div>

        {showServiceDropdown && (
          <div className="absolute z-10 mt-2 w-full bg-white border rounded-lg shadow-lg">
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Hizmet Ara..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => onServiceSelect(service)}
                >
                  <div className="font-medium">{service.name}</div>
                  <div className="text-sm text-gray-500">
                    {service.duration} dk - {service.price} TL
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Personel Seçimi */}
      <div className="relative">
        <div 
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer"
          onClick={onToggleStaffDropdown}
        >
          <span className="truncate">
            {currentStaff ? `${currentStaff.firstName} ${currentStaff.lastName}` : 'Personel Seçin'}
          </span>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showStaffDropdown ? 'transform rotate-180' : ''}`} />
        </div>

        {showStaffDropdown && (
          <div className="absolute z-10 mt-2 w-full bg-white border rounded-lg shadow-lg">
            <div className="py-1">
              {staffList.map((staff) => (
                <div
                  key={staff.id}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm"
                  onClick={() => onStaffSelect(staff)}
                >
                  {staff.firstName} {staff.lastName}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}