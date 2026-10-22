'use client';

export function Footer() {
  return (
    <div className="bg-gray-100 dark:bg-[#141414] border-t border-gray-200 dark:border-[#2e2e2e] px-[clamp(16px,3vw,48px)] py-[clamp(6px,1.2vh,20px)] flex items-center justify-between gap-4">
      <p className="text-gray-500 text-[clamp(11px,2vh,22px)]">Please wait for your number to be called</p>
      <p className="text-gray-500 text-[clamp(11px,2vh,22px)] text-right">Hintayin ang inyong numero na tawagin</p>
    </div>
  );
}