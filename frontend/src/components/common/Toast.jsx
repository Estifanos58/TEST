import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, X } from "lucide-react";

let toastId = 0;
const toasts = new Map();

export function showSavedToast(eventTitle) {
  const id = ++toastId;
  const event = new CustomEvent("show-toast", {
    detail: { id, title: eventTitle },
  });
  window.dispatchEvent(event);

  setTimeout(() => {
    window.dispatchEvent(new CustomEvent("hide-toast", { detail: { id } }));
  }, 5000);
}

export function ToastContainer() {
  const [visibleToasts, setVisibleToasts] = useState([]);

  useEffect(() => {
    const handleShow = (e) => {
      setVisibleToasts((prev) => [
        ...prev,
        { id: e.detail.id, title: e.detail.title },
      ]);
    };
    const handleHide = (e) => {
      setVisibleToasts((prev) => prev.filter((t) => t.id !== e.detail.id));
    };

    window.addEventListener("show-toast", handleShow);
    window.addEventListener("hide-toast", handleHide);

    return () => {
      window.removeEventListener("show-toast", handleShow);
      window.removeEventListener("hide-toast", handleHide);
    };
  }, []);

  if (visibleToasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:bottom-24 sm:left-auto sm:right-6 z-50 space-y-2 pointer-events-none">
      {visibleToasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-green-500 animate-slideUp w-full max-w-full sm:w-auto sm:min-w-[280px] pointer-events-auto"
        >
          <div className="flex items-start gap-3">
            <CheckCircle className="size-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                Event Saved!
              </p>
              <p className="text-xs text-gray-500">{toast.title}</p>
              <Link
                to="/saved-tickets"
                className="text-xs text-green-600 font-medium hover:text-green-700 mt-1 inline-block"
              >
                View Saved Tickets →
              </Link>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <X className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
