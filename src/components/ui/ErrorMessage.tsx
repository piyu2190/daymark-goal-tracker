import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle className="text-red-500" size={24} />
      </div>
      <p className="text-stone-600 mb-3">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-sm">
          Try again
        </button>
      )}
    </div>
  );
}

export function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
      <AlertCircle size={16} shrink-0 />
      <span>{message}</span>
    </div>
  );
}
