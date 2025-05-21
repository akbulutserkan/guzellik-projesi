// /src/types/service.ts içine eklenecek
export interface BulkUpdateBody {
    type: 'increase' | 'decrease';
    amount: number;
    isPercentage: boolean;
    categoryId?: string;
  }
  
  export interface BulkUpdatePreview {
    affectedServices: number;
    currentPriceRange: {
      min: number;
      max: number;
    };
    newPriceRange: {
      min: number;
      max: number;
    };
  }