
import React from 'react';

interface CurrencyInputProps { 
  value: number; 
  onChange: (val: number) => void; 
  className?: string;
  symbol?: string;
  placeholder?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({ 
  value, 
  onChange, 
  className,
  symbol,
  placeholder = "0"
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-digits (keeping it integer-only for simplicity in this context)
    const raw = e.target.value.replace(/[^0-9]/g, '');
    if (!raw) {
      onChange(0);
    } else {
      onChange(parseInt(raw, 10));
    }
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        inputMode="numeric"
        // Display empty if 0 to allow cleaner typing from scratch, unless it's acting as a controlled placeholder
        value={value === 0 ? '' : value.toLocaleString('en-US')} 
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
      />
      {symbol && (
         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none">
            {symbol}
         </span>
      )}
    </div>
  );
};
