'use client';

/**
 * Merkezi API Servis sınıfı
 * Tüm API servislerini tek bir noktadan erişilebilir kılar
 */

import * as productSaleService from './productSaleService';
import * as productService from './productService';
import * as customerService from './customerService';
import * as staffService from './staffService';
import * as paymentService from './paymentService';
import * as packageSaleService from './packageSaleService';
import * as packageService from './packageService';
import * as serviceService from './serviceService';
import * as serviceCategoryService from './serviceCategoryService';
import * as appointmentService from './appointmentService';
import * as settingsService from './settingsService';
import * as calendarService from './calendarService';
import * as workingHoursService from './workingHoursService';

/**
 * API Servis sınıfı
 * Tüm servis modüllerini birleştirir ve tek bir noktadan erişim sağlar
 */
export class ApiService {
  // Ürün satışları için API servisleri
  static productSales = {
    getList: productSaleService.getProductSales,
    getById: productSaleService.getProductSaleById,
    getByCustomer: productSaleService.getProductSalesByCustomer,
    create: productSaleService.createProductSale,
    update: productSaleService.updateProductSale,
    delete: productSaleService.deleteProductSale,
    getPayments: productSaleService.getPaymentsByProductSale,
    createPayment: productSaleService.createProductSalePayment,
    deletePayment: productSaleService.deleteProductSalePayment,
    getAuthorizedStaff: productSaleService.getAuthorizedStaff
  };

  // Ürünler için API servisleri
  static products = {
    getList: productService.getProducts,
    getById: productService.getProductById,
    create: productService.createProduct,
    update: productService.updateProduct,
    delete: productService.deleteProduct,
  };

  // Müşteriler için API servisleri
  static customers = {
    getList: customerService.getCustomers,
    getById: customerService.getCustomerById,
    create: customerService.createCustomer,
    update: customerService.updateCustomer,
    delete: customerService.deleteCustomer,
    getAll: customerService.getCustomers, // getAll metodu ekledik
  };

  // Personeller için API servisleri
  static staff = {
    getList: staffService.getStaff,
    getById: staffService.getStaffById,
    create: staffService.createStaff,
    update: staffService.updateStaff,
    delete: staffService.deleteStaff,
    getAll: staffService.getStaff, // getAll metodu ekledik
  };

  // Ödemeler için API servisleri
  static payments = {
    getList: paymentService.getPayments,
    getById: paymentService.getPaymentById,
    create: paymentService.createPayment,
    update: paymentService.updatePayment,
    delete: paymentService.deletePayment,
  };

  // Paket satışları için API servisleri
  static packageSales = {
    getList: packageSaleService.getPackageSales,
    getById: packageSaleService.getPackageSaleById,
    getByCustomer: packageSaleService.getPackageSalesByCustomer,
    create: packageSaleService.createPackageSale,
    update: packageSaleService.updatePackageSale,
    delete: packageSaleService.deletePackageSale,
    getPayments: packageSaleService.getPackageSalePayments,
    addPayment: packageSaleService.addPackageSalePayment,
    deletePayment: packageSaleService.deletePackageSalePayment,
    createSession: packageSaleService.createPackageSession,
    updateSession: packageSaleService.updatePackageSession,
    deleteSession: packageSaleService.deletePackageSession,
  };

  // Paketler için API servisleri
  static packages = {
    getList: packageService.getPackages,
    getById: packageService.getPackageById,
    create: packageService.createPackage,
    update: packageService.updatePackage,
    delete: packageService.deletePackage,
  };

  // Hizmetler için API servisleri
  static services = {
    getList: serviceService.getServices,
    getById: serviceService.getServiceById,
    create: serviceService.createService,
    update: serviceService.updateService,
    delete: serviceService.deleteService,
  };

  // Hizmet kategorileri için API servisleri
  static serviceCategories = {
    getList: serviceCategoryService.getServiceCategories,
    getById: serviceCategoryService.getServiceCategoryById,
    create: serviceCategoryService.createServiceCategory,
    update: serviceCategoryService.updateServiceCategory,
    delete: serviceCategoryService.deleteServiceCategory,
  };

  // Randevular için API servisleri
  static appointments = {
    getList: appointmentService.getAppointments,
    getById: appointmentService.getAppointmentById,
    create: appointmentService.createAppointment,
    update: appointmentService.updateAppointment,
    delete: appointmentService.deleteAppointment,
  };

  // Ayarlar için API servisleri
  static settings = {
    getSettings: settingsService.getSystemSettings,
    updateSettings: settingsService.updateSystemSettings,
  };

  // Takvim için API servisleri
  static calendar = {
    getEvents: calendarService.getCalendarData,
  };

  // Çalışma saatleri için API servisleri
  static workingHours = {
    getForStaff: workingHoursService.getWorkingHoursByStaff,
    update: workingHoursService.updateWorkingHour,
  };
}
