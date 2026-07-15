export type Service = {
    id: number;
    label_en: string;
    label_fil: string;
    icon_src: string;
    display_order: number;
    description_en: string;
    description_fil: string
    patient_type: "new" | "old" | "both";
};