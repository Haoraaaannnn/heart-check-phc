'use client';
import { DoctorsPanel } from '@/app/transfer/components/DoctorsPanel';
import { transferTexts } from '@/app/transfer/constants/transferTexts';

type DoctorsModalProps = {
  onClose: () => void;
};

export function DoctorsModal({ onClose }: DoctorsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6 backdrop-blur-xs">
      <div className="bg-gray-50 dark:bg-[#1a1a1a] border border-transparent dark:border-[#2e2e2e] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 px-3 py-1 bg-white dark:bg-[#242424] rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-[#a3a3a3] dark:hover:text-[#f5f5f5] dark:hover:bg-[#2e2e2e] border border-gray-200 dark:border-[#2e2e2e] transition shadow-xs cursor-pointer"
        >
          {transferTexts.closeBtn}
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[#f5f5f5] mb-6">Doctors</h1>
        <DoctorsPanel />
      </div>
    </div>
  );
}