import { ServiceDashboard }from "@/components/dashboard/ServiceDashboard";

export default function ConsultationDashboard() {
  return (
    <ServiceDashboard
      title="Refill Prescription Dashboard"
      serviceFilter="%refill prescription%"
    />
  );
}