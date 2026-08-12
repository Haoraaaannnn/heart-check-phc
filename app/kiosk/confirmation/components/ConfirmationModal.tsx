'use client';

import { useEffect } from "react";
import * as TablerIcons from "@tabler/icons-react";
import type { Service } from "@/types/Services";
import ConfirmationDescriptions from "@/app/kiosk/confirmation/components/ConfimationDescription";
import ConfirmationActions from "@/app/kiosk/confirmation/components/ConfirmationActions";

interface Props {
  service: Service | null;
  patientType?: "new" | "old";
  isOpen: boolean;
  onClose: () => void;
}

export default function ConfirmationModal({ service, patientType, isOpen, onClose }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !service) return null;

  const Icon = (TablerIcons as Record<string, any>)[service.icon_src] ?? TablerIcons.IconCircleDashed;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-[900px] max-h-[95vh] overflow-y-auto bg-white rounded-[24px] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact header replaces the old full-page ServiceBanner */}
        <div className="relative flex items-center gap-4 px-8 py-6 rounded-t-[24px] bg-[#7f0407] shrink-0">
          <Icon
            className="w-14 h-14 shrink-0"
            size={56}
            stroke={1.5}
            color="#ffffff"
          />
          <div className="flex flex-col text-white min-w-0">
            <span className="font-black text-2xl leading-tight truncate">{service.label_fil}</span>
            <span className="w-fit inline-block bg-white/20 border border-white/35 text-white text-sm font-bold px-3 py-1 rounded-full mt-1">
            {service.label_en}
            </span>
          </div>
        </div>

        <div className="px-8 py-6">
          <ConfirmationDescriptions service={service} />
        </div>

        <div className="px-8 pb-8">
          <ConfirmationActions
            service={service}
            patientType={patientType}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}