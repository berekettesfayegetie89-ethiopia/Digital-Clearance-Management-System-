import { useNavigate } from "react-router-dom";
import { MapPinOff } from "lucide-react";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { ROLE_HOME_PATH } from "../../data/navigation";

export default function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/8 text-primary">
        <MapPinOff size={26} />
      </div>
      <h1 className="text-xl font-bold text-text-primary">This page doesn't exist</h1>
      <p className="mt-2 max-w-sm text-sm text-text-secondary">
        The link you followed may be broken, or the page may have been moved.
      </p>
      <Button className="mt-6" onClick={() => navigate(user ? ROLE_HOME_PATH[user.role] : "/login")}>
        Back to Dashboard
      </Button>
    </div>
  );
}
