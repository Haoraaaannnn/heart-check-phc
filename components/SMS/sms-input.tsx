"use client";

interface Props {
  phone: string;
  onDelete: () => void;
}

const formatPhone = (raw: string) => {
  const d = raw.replace(/\D/g, "");
  if (d.length <= 4) return d;
  if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
  return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
};

export default function PhoneInput({ phone, onDelete }: Props) {
  return (
    <div className="mx-8 my-8 flex items-center bg-white rounded-[45px] px-4 py-3 gap-3 shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]">
      <div className="flex-1 text-[70px] font-semibold tracking-widest text-black flex-item-center p-[16px]">
        {phone.length > 0 ? (
          formatPhone(phone)
        ) : (
          <span className="text-gray-300 p-[16px]">0912 345 6780</span>
        )}
      </div>
      <button
        onClick={onDelete}
        className="h-full w-[150px] shrink-0 text-white text-center text-[70px] px-4 py-4 bg-red-700 active:scale-95 rounded-[45px] shadow-2xl"
      >
        ⌫
      </button>
    </div>
  );
}