import { ServiceDashboard }from "@/components/dashboard/ServiceDashboard";

export default function ConsultationDashboard() {
  return (
    <ServiceDashboard
      title="ECG Dashboard"
      serviceFilter="%ecg%"
        icon="🫀"
    />
  );
}