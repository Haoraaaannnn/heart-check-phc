// TODO change fonts and colors later

import Image from "next/image";

interface ServiceButtonProps {
    label: string;
    iconSrc: string;
    bgColor: string;
    //onClick: () => void;
}

export function ServiceButton({ label, iconSrc, bgColor }: ServiceButtonProps) {
    return (
        <button
        //onClick={onClick}
        className={`flex flex-col items-center justify-center rounded-[30px] p-4 shadow-lg transition-transform active:scale-95`}
        style={{ backgroundColor: bgColor }}
        >
            <div className="grow flex items-center justify-center">
                <Image src={iconSrc}
                    alt={label}
                    width={150}
                    height={150}
                />
            </div>
            <span className="mt-4 text-lg font-medium text-white">
                {label}
            </span>
        </button>
    )
}