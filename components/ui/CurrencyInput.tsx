import React, { useState, useEffect } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  symbol?: React.ReactNode;
  placeholder?: string;
  allowNegative?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  className,
  symbol,
  placeholder = "0",
  allowNegative = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    if (!isFocused) {
        setLocalValue(value === 0 ? '' : value.toLocaleString('en-US'));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    
    // Regex: If allowNegative, keep digits and hyphen. Else just digits.
    if (allowNegative) {
        raw = raw.replace(/[^0-9-]/g, '');
        // Ensure hyphen is only at the start
        if (raw.indexOf('-') > 0) {
            raw = raw.replace(/-/g, '');
        }
        // Prevent multiple hyphens
        if ((raw.match(/-/g) || []).length > 1) {
             raw = '-';
        }
    } else {
        raw = raw.replace(/[^0-9]/g, '');
    }

    setLocalValue(raw);

    if (!raw || raw === '-') {
      onChange(0);
    } else {
      onChange(parseInt(raw, 10));
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      setLocalValue(value === 0 ? '' : value.toString());
      e.target.select();
  };

  const handleBlur = () => {
      setIsFocused(false);
      // Force re-render of formatted value
      setLocalValue(value === 0 ? '' : value.toLocaleString('en-US'));
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        inputMode={allowNegative ? "text" : "numeric"}
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
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