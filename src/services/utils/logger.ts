/**
 * Merkezi loglama sistemi
 * Tüm servislerde kullanılabilecek ortak loglama mekanizması sunar
 */

/**
 * Loglama seviyeleri
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

/**
 * Varsayılan loglama seçenekleri
 */
const defaultOptions = {
  includeTimestamp: true,
  includeContext: true,
  logLevel: LogLevel.INFO
};

/**
 * Merkezi logger sınıfı
 */
export class Logger {
  private context: string;
  private options: typeof defaultOptions;
  
  /**
   * Logger oluşturur
   * @param context Loglama yapılacak modül/servis adı
   * @param options Loglama seçenekleri
   */
  constructor(context: string, options: Partial<typeof defaultOptions> = {}) {
    this.context = context;
    this.options = { ...defaultOptions, ...options };
  }
  
  /**
   * Debug seviyesinde log yazar
   * @param message Log mesajı
   * @param data Opsiyonel veriler
   */
  debug(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message), data || '');
    }
  }
  
  /**
   * Info seviyesinde log yazar
   * @param message Log mesajı
   * @param data Opsiyonel veriler
   */
  info(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage(LogLevel.INFO, message), data || '');
    }
  }
  
  /**
   * Warn seviyesinde log yazar
   * @param message Log mesajı
   * @param data Opsiyonel veriler
   */
  warn(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message), data || '');
    }
  }
  
  /**
   * Error seviyesinde log yazar
   * @param message Log mesajı
   * @param error Hata nesnesi veya açıklama
   */
  error(message: string, error?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message), error || '');
    }
  }
  
  /**
   * Belirli bir seviyede log yazılıp yazılmayacağını kontrol eder
   * @param level Kontrol edilecek log seviyesi
   * @returns Log yazılıp yazılmayacağı
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const configuredLevelIndex = levels.indexOf(this.options.logLevel);
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex >= configuredLevelIndex;
  }
  
  /**
   * Log mesajını formatlar
   * @param level Log seviyesi
   * @param message Log mesajı
   * @returns Formatlanmış log mesajı
   */
  private formatMessage(level: LogLevel, message: string): string {
    let formattedMessage = '';
    
    if (this.options.includeTimestamp) {
      formattedMessage += `[${new Date().toISOString()}] `;
    }
    
    formattedMessage += `[${level}] `;
    
    if (this.options.includeContext) {
      formattedMessage += `[${this.context}] `;
    }
    
    formattedMessage += message;
    
    return formattedMessage;
  }
}

/**
 * Belirli bir bağlam için logger oluşturur
 * @param context Loglama yapılacak modül/servis adı
 * @param options Loglama seçenekleri
 * @returns Logger nesnesi
 */
export function createLogger(context: string, options?: Partial<typeof defaultOptions>): Logger {
  return new Logger(context, options);
}
