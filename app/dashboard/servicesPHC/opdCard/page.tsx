import { ServiceDashboard }from "@/components/dashboard/ServiceDashboard";

export default function ConsultationDashboard() {
  return (
    <ServiceDashboard
      title="OPD Card Dashboard"
      serviceFilter="%opd card%"
    />
  );
}