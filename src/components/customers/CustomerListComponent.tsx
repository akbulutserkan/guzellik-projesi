'use client';

import { useState, useEffect } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import useCustomerManagement from '@/hooks/useCustomerManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Search, RefreshCw, Plus, Phone, Mail, UserPlus } from 'lucide-react';

interface CustomerListProps {
  onSelectCustomer?: (customerId: string) => void;
  onCreateNew?: () => void;
}

export const CustomerListComponent = ({ onSelectCustomer, onCreateNew }: CustomerListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  
  const {
    customers,
    isLoading,
    error,
    searchResults,
    isSearching,
    loadCustomers,
    searchCustomers
  } = useCustomerManagement();
  
  // Arama işlemi
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery && searchQuery.length >= 2) {
        searchCustomers(searchQuery);
        setIsSearchMode(true);
      } else {
        setIsSearchMode(false);
      }
    }, 500);
    
    return () => clearTimeout(delaySearch);
  }, [searchQuery, searchCustomers]);
  
  // Müşteri seçme
  const handleSelectCustomer = (customerId: string) => {
    if (onSelectCustomer) {
      onSelectCustomer(customerId);
    }
  };
  
  // Yeni müşteri oluşturma
  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew();
    }
  };
  
  // Yenileme
  const handleRefresh = () => {
    loadCustomers(true);
    toast({
      title: 'Yenilendi',
      description: 'Müşteri listesi güncellendi',
      variant: 'default'
    });
  };
  
  // Görüntülenecek müşteriler
  const displayedCustomers = isSearchMode ? searchResults : customers;
  
  return (
    <Card className="min-h-[400px]">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Müşteriler</CardTitle>
            <CardDescription>
              {isSearchMode 
                ? `${searchResults.length} arama sonucu` 
                : `Toplam ${customers.length} müşteri`}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="default" size="sm" onClick={handleCreateNew}>
              <UserPlus className="h-4 w-4 mr-2" />
              Yeni Müşteri
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Müşteri ara..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {(isLoading || isSearching) ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2" 
              onClick={() => loadCustomers(true)}
            >
              Yeniden Dene
            </Button>
          </div>
        ) : displayedCustomers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {isSearchMode ? (
              <p>Aranan kriterlere uygun müşteri bulunamadı</p>
            ) : (
              <div>
                <p>Henüz müşteri kaydı bulunmuyor</p>
                <Button 
                  variant="link" 
                  onClick={handleCreateNew}
                  className="mt-2"
                >
                  Yeni müşteri ekle
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {displayedCustomers.map((customer) => (
              <div 
                key={customer.id}
                className="border rounded-md p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleSelectCustomer(customer.id)}
              >
                <div className="font-medium">{customer.name}</div>
                <div className="flex items-center text-sm text-muted-foreground space-x-4 mt-1">
                  <div className="flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    <span>{customer.phone}</span>
                  </div>
                  {customer.email && (
                    <div className="flex items-center">
                      <Mail className="h-3 w-3 mr-1" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="justify-between text-xs text-muted-foreground">
        <div>Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}</div>
        {isSearchMode && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setSearchQuery('');
              setIsSearchMode(false);
            }}
          >
            Aramayı Temizle
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default CustomerListComponent;
