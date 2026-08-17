import PageHeader from "../../components/common/PageHeader";
import NotificationsList from "../../components/common/NotificationsList";

export default function ApproverNotifications() {
  return (
    <div>
      <PageHeader title="Notifications" />
      <NotificationsList tabs={["All", "Unread", "Assignment", "Reminder"]} />
    </div>
  );
}
