import React, { useState, useEffect } from 'react';

interface DecimalInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (val: number) => void;
  maxDecimals?: number;
  symbol?: React.ReactNode;
  rightSymbol?: React.ReactNode;
}

export const DecimalInput: React.FC<DecimalInputProps> = ({
  value,
  onChange,
  maxDecimals = 2,
  className,
  symbol,
  rightSymbol,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState(value.toString());

  useEffect(() => {
    // Only sync if the parsed display value is different from the prop value
    // This prevents overriding the user while they are typing "5."
    const parsed = parseFloat(displayValue);
    if (parsed !== value && !(isNaN(parsed) && value === 0)) {
      setDisplayValue(value.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayValue(raw);

    if (raw === '' || raw === '.') {
      // Don't push 0 or NaN immediately if user is just clearing or typing dot
      return;
    }

    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    setDisplayValue(value.toString());
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={(e) => e.target.select()}
        className={className}
        {...props}
      />
      {symbol && (
         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none">
            {symbol}
         </span>
      )}
      {rightSymbol && (
         <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none">
            {rightSymbol}
         </span>
      )}
    </div>
  );
};