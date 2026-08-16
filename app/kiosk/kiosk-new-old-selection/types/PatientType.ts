export type PatientCategory = {
    id:number;
    label_en:string;
    label_fil:string;
    icon_src:string;
    order:number;
    type: "new" | "old";
}