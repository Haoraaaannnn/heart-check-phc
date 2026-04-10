import { ServiceDashboard }from "@/components/dashboard/ServiceDashboard";

export default function ConsultationDashboard() {
  return (
    <ServiceDashboard
      title="Warfarin Dashboard"
      serviceFilter="%warfarin%"
        icon="💊"
    />
  );
}