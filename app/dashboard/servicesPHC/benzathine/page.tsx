import { ServiceDashboard }from "@/components/dashboard/ServiceDashboard";

export default function ConsultationDashboard() {
  return (
    <ServiceDashboard
      title="Benzathine Dashboard"
      serviceFilter="%benzathine%"
        icon="💉"
    />
  );
}