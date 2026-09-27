import { SMSLayoutClasses } from "@/app/kiosk/pages/sms-input/constants/smsLayout";

/** Props for {@link SMSInputLayout}. */
interface SMSInputLayoutProps {
    /** Page contents for the SMS phone input step. */
    children: React.ReactNode;
}

/**
 * Shell layout for the kiosk phone number input flow (`/kiosk/pages/sms-input`).
 *
 * @param props - Layout props provided by Next.js.
 * @returns The full-height container for the SMS step.
 */
export default function SMSInputLayout({ children }: SMSInputLayoutProps) {
    return (
        <div className={SMSLayoutClasses.layoutContainer}>
            {children}
        </div>
    );
}