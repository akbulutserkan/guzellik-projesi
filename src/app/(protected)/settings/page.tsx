'use client';

import { withPageAuth } from '@/lib/auth';
import { BusinessHoursForm } from '@/components/Settings/BusinessHoursForm';
import { SystemSettingsForm } from '@/components/Settings/SystemSettingsForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function SettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Ayarlar</h1>
      
      <Tabs defaultValue="business-hours" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="business-hours">Çalışma Saatleri</TabsTrigger>
          <TabsTrigger value="system-settings">Sistem Ayarları</TabsTrigger>
        </TabsList>
        
        <TabsContent value="business-hours">
          <BusinessHoursForm />
        </TabsContent>
        
        <TabsContent value="system-settings">
          <SystemSettingsForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default withPageAuth(SettingsPage);