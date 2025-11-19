import React, { useState, useEffect } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  symbol?: React.ReactNode;
  placeholder?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  className,
  symbol,
  placeholder = "0"
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    if (!isFocused) {
        setLocalValue(value === 0 ? '' : value.toLocaleString('en-US'));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setLocalValue(raw);
    if (!raw) {
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
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        inputMode="numeric"
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