'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { 
  getAppointmentById, 
  updateAppointment 
} from '@/services/appointmentService'
import { Appointment } from '@/utils/appointment/formatters'

export default function EditAppointmentPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const id = params.id as string

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [amount, setAmount] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('')

  useEffect(() => {
    const fetchAppointmentData = async () => {
      try {
        setLoading(true)
        // Use the new service function to fetch appointment data
        const data = await getAppointmentById(id, true, false)
        setAppointment(data)
        setAmount(data.amount?.toString() || '')
        setPaymentMethod(data.paymentMethod || '')
        setError('')
      } catch (error: any) {
        console.error('Data loading error:', error)
        setError('Error loading appointment data: ' + (error.message || 'Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchAppointmentData()
  }, [id])

  const handleSave = async () => {
    try {
      if (appointment) {
        // Prepare data for update
        const updatedData = {
          notes: appointment.notes,
          amount: amount ? parseFloat(amount) : undefined,
          paymentMethod,
          attendance: appointment.attendance
        }

        // Use the new service function to update appointment
        await updateAppointment(id, updatedData, true)
        
        // Show success toast
        toast({
          title: 'Success',
          description: 'Appointment updated successfully',
        })

        // Navigate back to appointments page
        router.push('/appointments')
        router.refresh()
      }
    } catch (error: any) {
      console.error('Update error:', error)
      setError('Error updating appointment: ' + (error.message || 'Unknown error'))
      
      // Show error toast
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update appointment',
      })
    }
  }

  const handleAttendanceChange = (newAttendance: string) => {
    if (appointment) {
      setAppointment({
        ...appointment,
        attendance: newAttendance
      })
    }
  }

  if (loading || !appointment) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-xl font-bold mb-6">
          {appointment.customer?.name || 'Customer'} ({appointment.customer?.phone || 'No phone'})
        </h1>

        <div className="space-y-6">
          {/* Appointment Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Appointment Time
            </label>
            <input
              type="datetime-local"
              value={appointment.startTime?.slice(0, 16) || ''}
              disabled
              className="w-full p-2 border rounded bg-gray-50"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={appointment.notes || ''}
              onChange={(e) => setAppointment({ ...appointment, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Enter notes about the appointment..."
            />
          </div>

          {/* Attendance Status */}
          <div>
            <div className="flex gap-2">
              {[
                { value: 'NOT_SPECIFIED', label: 'Not Specified' },
                { value: 'ATTENDED', label: 'Attended' },
                { value: 'NOT_ATTENDED', label: 'Did Not Attend' }
              ].map((status) => (
                <button
                  key={status.value}
                  onClick={() => handleAttendanceChange(status.value)}
                  className={`px-4 py-2 rounded ${
                    appointment.attendance === status.value
                      ? status.value === 'ATTENDED'
                        ? 'bg-green-100 text-green-800'
                        : status.value === 'NOT_ATTENDED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                      : 'bg-white border hover:bg-gray-50'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Information - Only show if 'Attended' is selected */}
          {appointment.attendance === 'ATTENDED' && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-4">PAYMENT</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Enter payment amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select</option>
                    <option value="CASH">Cash</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}