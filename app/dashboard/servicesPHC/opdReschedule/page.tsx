import { ServiceDashboard }from "@/components/dashboard/ServiceDashboard";

export default function ConsultationDashboard() {
  return (
    <ServiceDashboard
      title="OPD Reschedule Dashboard"
      serviceFilter="%opd reschedule%"
    />
  );
}