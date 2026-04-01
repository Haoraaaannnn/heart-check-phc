'use client';

interface Props {
  isOpen: boolean;
  titleEng: string;
  titleFil: string;
  messageFil: string;
  messageEng: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
  phone: string;
}

export default function ConfirmationModal({
  isOpen,
  phone,
  titleEng,
  titleFil,
  messageFil,
  messageEng,
  confirmText = 'Magpatuloy - Continue',
  cancelText = 'Bumalik - Cancel',
  onConfirm,
  onCancel,
  isDangerous = false,
}: Props) {
  if (!isOpen) return null;

const formatPhone = (raw: string) => {
  const d = raw.replace(/\D/g, "");
  if (d.length <= 4) return d;
  if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
  return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
};

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[45px] p-8 md:p-12 max-w-2xl w-full shadow-2xl">
        <h2 className="mb-4 text-center flex flex-col gap-1 mb-8">
          {/* Filipino Title: Larger, bolder, darker */}
          <span className="text-3xl md:text-6xl font-baloo font-bold text-black">
            {titleFil}
          </span>
          
          {/* English Title: Smaller, lighter color, perhaps less bold */}
          <span className="text-xl md:text-3xl font-normal text-gray-600">
            {titleEng}
          </span>
        </h2>
        
        <p className="text-1xl md:text-4xl text-gray-600 gap-1 leading-relaxed text-center font-bold">
          {messageFil}
        </p>
        <p className="text-lg md:text-3xl text-gray-600 mb-8 leading-relaxed text-center font-extralight">
          {messageEng}
        </p>
        <p className="text-lg md:text-5xl text-black text-bold mb-8 leading-relaxed text-center">
          {formatPhone(phone)}
        </p>

        <div className="flex gap-4 flex-col md:flex-row">
          <button
            onClick={onCancel}
            className="flex-1 py-3 md:py-4 px-4 rounded-[25px] font-baloo font-bold text-2xl md:text-2xl
              bg-white border-gray-400 border-[5px] text-gray-400 transition-all active:scale-95"
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 md:py-4 px-4 rounded-[25px] font-baloo font-bold text-2xl md:text-2xl text-white
              transition-all active:scale-95 ${
              isDangerous
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
