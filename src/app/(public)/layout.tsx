// src/app/(public)/layout.tsx
import { Suspense } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Toaster } from "@/components/ui/toaster";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen h-full bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800">Güzellik Merkezi</h1>
        </div>
      </header>
      <main className="flex-1 h-[calc(100vh-4rem)] overflow-hidden">
        <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
      </main>
      <div className="h-3 bg-white border-t border-gray-200 shadow-sm fixed bottom-0 left-0 right-0 z-50" />
      <Toaster />
    </div>
  );
}
