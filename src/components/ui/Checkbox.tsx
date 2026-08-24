import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
  ariaLabel?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Checkbox({ checked, onChange, label, ariaLabel, size = 'md' }: CheckboxProps) {
  const boxSize = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-7 h-7' : 'w-6 h-6';
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel || label}
      onClick={onChange}
      className={`${boxSize} shrink-0 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
        checked
          ? 'bg-sage-500 border-sage-500 text-white'
          : 'bg-white border-stone-300 hover:border-sage-400 hover:bg-sage-50'
      }`}
    >
      {checked && <Check size={iconSize} className="checkmark-animate" strokeWidth={3} />}
    </button>
  );
}
