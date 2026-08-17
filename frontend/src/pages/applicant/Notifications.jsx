import PageHeader from "../../components/common/PageHeader";
import NotificationsList from "../../components/common/NotificationsList";

export default function ApplicantNotifications() {
  return (
    <div>
      <PageHeader title="Notifications" description="Updates on your clearance requests." />
      <NotificationsList tabs={["All", "Unread", "Approval", "Reminder", "Certificate"]} />
    </div>
  );
}
