import Link from "next/link";

interface Props {
  serviceId: number;
}

export default function ConfirmationActions({ serviceId }: Props) {
  return (
    <div className="w-full">
      <Link
        href={`/kiosk/sms-input?serviceId=${serviceId}`}
        className="block w-full bg-blue-600 text-white text-center py-3 rounded-t-lg"
      >
        Continue
      </Link>
      <Link
        href="/kiosk/kiosk-services"
        className="block w-full border-t border-gray-200 text-center py-3 rounded-b-lg bg-white text-gray-800"
      >
        Cancel
      </Link>
    </div>
  );
}