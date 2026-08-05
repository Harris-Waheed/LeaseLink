import React, { useRef } from 'react';

export default function OTPInput({ length = 6, value, onChange }) {
  const inputRefs = useRef([]);
  // Ensure we have an array of the exact length, padded with empty strings
  const otpArray = value.split('').concat(Array(length).fill('')).slice(0, length);

  const handleChange = (e, index) => {
    const val = e.target.value;
    // Allow only numeric characters
    if (val && isNaN(val)) return;

    const char = val.slice(-1); // Get only the last typed character
    const newOtpArray = [...otpArray];
    newOtpArray[index] = char;
    
    onChange(newOtpArray.join(''));

    // Move to next input if there's a value and we are not at the end
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    // Get pasted data, strip non-digits, and slice to required length
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      // Focus on the next empty box, or the last box if full
      const nextFocus = pastedData.length < length ? pastedData.length : length - 1;
      inputRefs.current[nextFocus]?.focus();
    }
  };

  return (
    <div className="flex justify-between gap-2 w-full max-w-sm mx-auto">
      {otpArray.map((char, index) => (
        <input
          key={index}
          type="text"
          inputMode="numeric"
          maxLength={1}
          ref={(ref) => (inputRefs.current[index] = ref)}
          value={char}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className="w-12 sm:w-14 h-14 sm:h-16 text-center text-xl sm:text-2xl font-bold border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all bg-gray-50 focus:bg-white text-gray-900"
        />
      ))}
    </div>
  );
}
