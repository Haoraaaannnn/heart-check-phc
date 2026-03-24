import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default async function ConfirmationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-10">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md text-center">
        <Image
          src={settings?.confirmation_icon_src || "/icons/WalangIcon.png"}
          alt="Wala pang Icon"
          width={80}
          height={80}
          className="w-20 h-20 mb-6 mx-auto"
        />
        <h1 className="text-2xl font-bold mb-4">
          {settings?.confirmation_message ||
            "Your appointment has been confirmed!"}
        </h1>
        <p className="text-gray-600 mb-6">
          {settings?.confirmation_submessage ||
            "Thank you for choosing our service. Please wait for your number to be called on the screen or for a message on your phone."}
        </p>
        {children}
      </div>
    </div>
  );
}
//Thank you for using our service. Please wait for your turn.
