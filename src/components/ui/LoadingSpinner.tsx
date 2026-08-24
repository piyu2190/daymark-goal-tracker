export function LoadingSpinner({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-stone-200 border-t-sage-500 ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}

export function FullPageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream-50">
      <LoadingSpinner size={40} />
      <p className="mt-4 text-stone-500 text-sm">{message}</p>
    </div>
  );
}
