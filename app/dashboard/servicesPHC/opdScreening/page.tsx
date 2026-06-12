import { ServiceDashboard }from "@/app/dashboard/servicesPHC/components/ServiceDashboard";

export default function ConsultationDashboard() {
  return (
    <ServiceDashboard
      title="OPD Screening Dashboard"
      serviceFilter="%opd screening%"
    />
  );
}