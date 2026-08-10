'use client';
import { DoctorsPanel } from './DoctorsPanel';

type DoctorsModalProps = {
  onClose: () => void;
};

export function DoctorsModal({ onClose }: DoctorsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
      <div className="bg-gray-50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition shadow-sm"
        >
          <i className="bx bx-x text-xl text-gray-500"></i>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Doctors</h1>
        <DoctorsPanel />
      </div>
    </div>
  );
}