// types/workingHours.ts
interface TimeSlot {
    start: string;
    end: string;
  }
  
  interface DaySchedule {
    enabled: boolean;
    timeSlots: TimeSlot[];  // Birden fazla zaman dilimi için
  }
  
  interface WorkingHours {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
  }
  
  // Her personel için özel durumlar
  interface StaffScheduleException {
    date: string;
    enabled: boolean;
    timeSlots?: TimeSlot[];
    reason?: string;
  }