'use client';

interface FormErrorProps {
  error: string;
}

export default function FormError({ error }: FormErrorProps) {
  if (!error) return null;
  
  // Check if error is a conflict error
  const isConflictError = 
    error.includes("çakışma") || 
    error.includes("conflict") || 
    error.includes("randevu bulunmaktadır");

  return (
    <div className={`p-4 mb-4 rounded-lg ${isConflictError ? 'bg-red-50 border border-red-100' : 'bg-red-100'}`}>
      <p className="text-sm text-red-600">{error}</p>
    </div>
  );
}