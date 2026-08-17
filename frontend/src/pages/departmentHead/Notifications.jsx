import PageHeader from "../../components/common/PageHeader";
import NotificationsList from "../../components/common/NotificationsList";

export default function DeptHeadNotifications() {
  return (
    <div>
      <PageHeader title="Notifications" />
      <NotificationsList tabs={["All", "Unread", "Escalation"]} />
    </div>
  );
}
