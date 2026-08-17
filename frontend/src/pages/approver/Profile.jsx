import ProfilePassword from "../../components/common/ProfilePassword";
import Card from "../../components/common/Card";
import { useAuth } from "../../context/AuthContext";

export default function ApproverProfile() {
  const { user } = useAuth();
  return (
    <ProfilePassword
      roleCard={
        <Card>
          <p className="mb-3 text-sm font-semibold text-text-primary">Department Role Info</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-text-secondary">Department</span><span className="font-medium text-text-primary">{user.department}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Role</span><span className="font-medium text-text-primary">Approver</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Assigned</span><span className="font-medium text-text-primary">Jan 10, 2025 by Super Admin</span></div>
          </div>
        </Card>
      }
    />
  );
}
