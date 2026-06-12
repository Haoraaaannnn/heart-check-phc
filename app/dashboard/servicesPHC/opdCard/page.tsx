import { ServiceDashboard }from "@/app/dashboard/servicesPHC/components/ServiceDashboard";

export default function ConsultationDashboard() {
  return (
    <ServiceDashboard
      title="OPD Card Dashboard"
      serviceFilter="%opd card%"
    />
  );
}