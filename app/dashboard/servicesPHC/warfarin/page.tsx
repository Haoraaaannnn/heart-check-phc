import { ServiceDashboard }from "@/app/dashboard/servicesPHC/components/ServiceDashboard";

export default function ConsultationDashboard() {
  return (
    <ServiceDashboard
      title="Warfarin Dashboard"
      serviceFilter="%warfarin%"
    />
  );
}