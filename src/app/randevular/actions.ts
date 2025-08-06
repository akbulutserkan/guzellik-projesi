
'use server';

import { 
    getAppointmentsAction as getAppointments,
    getCalendarPageData as getCalendarData,
    getCustomerPackagesAction as getCustomerPackages,
    getSalesForAppointmentGroupAction as getSalesForGroup
} from './services/appointmentRead';

import {
    performAddAppointmentAction as addAppointment,
    performUpdateAppointmentAction as updateAppointment,
    performFullUpdateAppointmentAction as fullUpdateAppointment,
    performDeleteAppointmentAction as deleteAppointment,
    deleteSingleAppointmentAction as deleteSingleAppointment,
    addServiceToAppointmentAction as addServiceToAppointment,
    updateAppointmentServicePriceAction as updateServicePrice
} from './services/appointmentWrite';

import {
    performPaymentAndUseSessionAction as paymentAndUseSession
} from './services/paymentActions';
import type { Appointment, CalendarPageData, PaymentMethod, AppointmentUpdatePayload, PaymentPayload } from './services/types';

export async function getAppointmentsAction(): Promise<Appointment[]> {
    return getAppointments();
}

export async function getCalendarPageData(): Promise<CalendarPageData> {
    return getCalendarData();
}

export async function getCustomerPackagesAction(customerId: string) {
    return getCustomerPackages(customerId);
}

export async function getSalesForAppointmentGroupAction(groupIds: string[]) {
    return getSalesForGroup(groupIds);
}

export async function performAddAppointmentAction(formData: FormData) {
    return addAppointment(formData);
}

export async function performUpdateAppointmentAction(payload: AppointmentUpdatePayload) {
    return updateAppointment(payload);
}

export async function performFullUpdateAppointmentAction(formData: FormData) {
    return fullUpdateAppointment(formData);
}

export async function performDeleteAppointmentAction(groupId: string) {
    return deleteAppointment(groupId);
}

export async function deleteSingleAppointmentAction(appointmentId: string) {
    return deleteSingleAppointment(appointmentId);
}

export async function addServiceToAppointmentAction(payload: any) {
    return addServiceToAppointment(payload);
}

export async function updateAppointmentServicePriceAction(appointmentId: string, newPrice: number) {
    return updateServicePrice(appointmentId, newPrice);
}

export async function performPaymentAndUseSessionAction(payload: PaymentPayload) {
    return paymentAndUseSession(payload);
}


export type { 
    Appointment, 
    CalendarPageData,
    PaymentMethod 
};
