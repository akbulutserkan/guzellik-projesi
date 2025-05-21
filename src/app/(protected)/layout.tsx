import { Suspense } from "react";
import { requireAuth } from "@/lib/auth-utils";
import AuthProvider from "@/components/providers/AuthProvider";
import LoadingSpinner from "@/components/LoadingSpinner";
import AppLayout from "@/components/layout/AppLayout";
import { Toaster } from "@/components/ui/toaster";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="flex flex-col min-h-screen h-full bg-gray-100 w-full">
      <AppLayout>
        <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
      </AppLayout>
      <Toaster />
    </div>
  );
}
