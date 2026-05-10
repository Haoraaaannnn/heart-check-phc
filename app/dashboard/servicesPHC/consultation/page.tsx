import { ServiceDashboard }from "@/components/dashboard/ServiceDashboard";

export default function ConsultationDashboard() {
  return (
    <ServiceDashboard
      title="Consultation Dashboard"
      serviceFilter="%consultation%"
    />
  );
}