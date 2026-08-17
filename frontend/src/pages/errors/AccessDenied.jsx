import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { ROLE_HOME_PATH } from "../../data/navigation";

export default function AccessDenied() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-error-bg text-error">
        <ShieldAlert size={26} />
      </div>
      <h1 className="text-xl font-bold text-text-primary">You don't have permission to view this page</h1>
      <p className="mt-2 max-w-sm text-sm text-text-secondary">
        Your account role doesn't include access to this section. If you think this is a mistake, contact
        your Super Admin.
      </p>
      <Button className="mt-6" onClick={() => navigate(user ? ROLE_HOME_PATH[user.role] : "/login")}>
        Back to My Dashboard
      </Button>
    </div>
  );
}
