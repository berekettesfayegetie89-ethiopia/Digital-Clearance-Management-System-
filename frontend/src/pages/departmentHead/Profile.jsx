import ProfilePassword from "../../components/common/ProfilePassword";
import Card from "../../components/common/Card";
import { useAuth } from "../../context/AuthContext";

export default function DeptHeadProfile() {
  const { user } = useAuth();
  return (
    <ProfilePassword
      roleCard={
        <Card>
          <p className="mb-3 text-sm font-semibold text-text-primary">Department Oversight</p>
          <div className="flex justify-between text-sm"><span className="text-text-secondary">Department</span><span className="font-medium text-text-primary">{user.department}</span></div>
          <div className="mt-2 flex justify-between text-sm"><span className="text-text-secondary">Approvers Managed</span><span className="font-medium text-text-primary">3</span></div>
        </Card>
      }
    />
  );
}
