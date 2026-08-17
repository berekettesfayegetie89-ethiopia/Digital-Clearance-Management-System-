import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Modal from "../common/Modal";
import Button from "../common/Button";

// Demo timings are short so the behaviour is easy to see in a course demo.
// In production these would be much longer (e.g. 15 min idle -> 60s warning).
const IDLE_LIMIT_MS = 5 * 60 * 1000; // time of inactivity before warning
const WARNING_SECONDS = 60;

export default function SessionTimeoutWatcher() {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_SECONDS);
  const idleTimer = useRef(null);
  const countdownTimer = useRef(null);

  const resetIdleTimer = () => {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setWarning(true), IDLE_LIMIT_MS);
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetIdleTimer));
    resetIdleTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer));
      clearTimeout(idleTimer.current);
      clearInterval(countdownTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!warning) {
      setSecondsLeft(WARNING_SECONDS);
      return;
    }
    countdownTimer.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(countdownTimer.current);
          logout();
          navigate("/login");
          showToast("Your session expired due to inactivity. Please sign in again.", "info");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(countdownTimer.current);
  }, [warning]); // eslint-disable-line react-hooks/exhaustive-deps

  const stayActive = () => {
    setWarning(false);
    resetIdleTimer();
  };

  return (
    <Modal
      open={warning}
      onClose={stayActive}
      title="You've been idle for a while"
      footer={
        <>
          <Button
            variant="dangerOutline"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Log Out Now
          </Button>
          <Button variant="primary" onClick={stayActive}>
            Stay Signed In
          </Button>
        </>
      }
    >
      <p className="text-sm text-text-secondary">
        For your security, your session will expire in{" "}
        <span className="font-semibold text-text-primary">{secondsLeft} seconds</span> due to inactivity.
      </p>
    </Modal>
  );
}
