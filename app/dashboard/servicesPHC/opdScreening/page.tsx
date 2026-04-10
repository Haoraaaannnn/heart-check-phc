import { ServiceDashboard }from "@/components/dashboard/ServiceDashboard";

export default function ConsultationDashboard() {
  return (
    <ServiceDashboard
      title="OPD Screening Dashboard"
      serviceFilter="%opd screening%"
        icon="📋"
    />
  );
}