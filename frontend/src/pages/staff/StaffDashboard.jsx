import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Calendar,
  Camera,
  CheckCircle,
  Clock,
  MapPin,
  QrCode,
  Ticket,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import jsQR from "jsqr";

import { staffAPI } from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";

export function StaffDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [staffInfo, setStaffInfo] = useState(null);
  const [stats, setStats] = useState({ total_tickets: 0, checked_in: 0 });
  const [scanning, setScanning] = useState(false);
  const [ticketCode, setTicketCode] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [imageDecodeError, setImageDecodeError] = useState("");
  const [decodingImage, setDecodingImage] = useState(false);
  const [supportsCameraAccess, setSupportsCameraAccess] = useState(false);
  const [supportsLiveScanner, setSupportsLiveScanner] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const detectorRef = useRef(null);
  const processingRef = useRef(false);

  useEffect(() => {
    fetchStaffDashboard();
    setSupportsCameraAccess(Boolean(navigator.mediaDevices?.getUserMedia));
    setSupportsLiveScanner(Boolean(window.BarcodeDetector));

    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStaffDashboard = async () => {
    try {
      const data = await staffAPI.getStaffDashboard();
      if (data.success) {
        setStaffInfo(data.staff);
        setStats(data.stats);
      } else {
        logout();
        navigate("/login");
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      logout();
      navigate("/login");
    }
  };

  const decodeBase64UrlSegment = (segment) => {
    if (
      typeof segment !== "string" ||
      segment.length === 0 ||
      typeof atob !== "function"
    ) {
      return null;
    }

    const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
    const remainder = normalized.length % 4;
    const padded =
      remainder === 0
        ? normalized
        : normalized.padEnd(normalized.length + (4 - remainder), "=");

    try {
      return atob(padded);
    } catch {
      return null;
    }
  };

  const decodeTicketPayloadFromQrToken = (qrToken) => {
    const parts = typeof qrToken === "string" ? qrToken.split(".") : [];
    if (parts.length !== 3) {
      return null;
    }

    const payloadText = decodeBase64UrlSegment(parts[1]);
    if (!payloadText) {
      return null;
    }

    try {
      const parsed = JSON.parse(payloadText);
      const ticketPayload = {
        ticket_id: parsed?.ticket_id || "",
        event_id: parsed?.event_id || "",
        attendee_id: parsed?.attendee_id || "",
        ticket_code: parsed?.ticket_code || "",
      };

      if (
        !ticketPayload.ticket_id ||
        !ticketPayload.event_id ||
        !ticketPayload.attendee_id ||
        !ticketPayload.ticket_code
      ) {
        return null;
      }

      return ticketPayload;
    } catch {
      return null;
    }
  };

  const getGateDecision = (status) => {
    if (status === "valid") {
      return {
        label: "ALLOW ENTRY",
        instruction: "Attendee can enter through this gate now.",
      };
    }

    if (status === "already_scanned") {
      return {
        label: "SEND TO HELP DESK",
        instruction:
          "Duplicate scan detected. Do not allow entry here; direct attendee to Help Desk.",
      };
    }

    return {
      label: "DENY ENTRY",
      instruction: "Invalid ticket. Do not allow entry at this gate.",
    };
  };

  const buildScanRequestPayload = (rawCode) => {
    const normalizedCode = (rawCode || "").trim();
    if (!normalizedCode) {
      return {
        payload: null,
        displayCode: "",
        message: "Please scan or enter a QR token/ticket code",
      };
    }

    const looksLikeJwt = normalizedCode.split(".").length === 3;
    if (!looksLikeJwt) {
      return {
        payload: { ticket_code: normalizedCode },
        displayCode: normalizedCode,
      };
    }

    const decodedTicketPayload = decodeTicketPayloadFromQrToken(normalizedCode);
    if (decodedTicketPayload) {
      return {
        payload: {
          qr_token: normalizedCode,
          ticket_payload: decodedTicketPayload,
        },
        displayCode: decodedTicketPayload.ticket_code,
      };
    }

    return {
      payload: { qr_token: normalizedCode },
      displayCode: normalizedCode,
    };
  };

  const normalizeScanResult = (status, message) => ({
    success: status === "valid",
    status,
    message,
    ...getGateDecision(status),
  });

  const appendRecentScan = (code, status) => {
    const decision = getGateDecision(status);

    setRecentScans((prev) => [
      {
        code,
        status,
        decision: decision.label,
        time: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 9),
    ]);
  };

  const handleScan = async (providedCode) => {
    const rawCode = (providedCode || ticketCode || "").trim();

    if (scanning) {
      return;
    }

    const requestData = buildScanRequestPayload(rawCode);
    if (!requestData.payload) {
      const message = requestData.message || "Invalid QR payload";
      setScanResult(normalizeScanResult("invalid", message));
      appendRecentScan(rawCode || "N/A", "invalid");
      setTicketCode("");
      setTimeout(() => setScanResult(null), 3500);
      return;
    }

    const displayedScanCode = requestData.displayCode || rawCode;

    setScanning(true);

    try {
      const data = await staffAPI.scanTicket(requestData.payload);

      setScanResult(normalizeScanResult(data.status, data.message));
      appendRecentScan(displayedScanCode, data.status);

      if (data.status === "valid") {
        setStats((prev) => ({ ...prev, checked_in: prev.checked_in + 1 }));
      }
    } catch (error) {
      const status = error?.data?.status || "invalid";
      const message = error?.data?.message || error.message || "Scan failed";

      setScanResult(normalizeScanResult(status, message));
      appendRecentScan(displayedScanCode, status);
    } finally {
      setTicketCode("");
      setScanning(false);
      setTimeout(() => setScanResult(null), 3500);
    }
  };

  const scanFrame = async () => {
    if (!cameraActive || !detectorRef.current || !videoRef.current) {
      return;
    }

    try {
      if (!processingRef.current && videoRef.current.readyState >= 2) {
        const barcodes = await detectorRef.current.detect(videoRef.current);

        if (barcodes.length > 0 && barcodes[0].rawValue) {
          processingRef.current = true;
          setTicketCode(barcodes[0].rawValue);
          await handleScan(barcodes[0].rawValue);

          setTimeout(() => {
            processingRef.current = false;
          }, 1200);
        }
      }
    } catch {
      // Ignore frame decode errors and continue scanning.
    }

    rafRef.current = requestAnimationFrame(scanFrame);
  };

  const startCamera = async () => {
    if (!supportsCameraAccess) {
      setCameraError(
        "Camera access is not supported in this browser. Use photo scan below.",
      );
      return;
    }

    try {
      setCameraError("");
      setImageDecodeError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);

      if (supportsLiveScanner) {
        detectorRef.current = new window.BarcodeDetector({
          formats: ["qr_code"],
        });
        rafRef.current = requestAnimationFrame(scanFrame);
      } else {
        detectorRef.current = null;
        setCameraError(
          "Live auto-scanning is not supported here. Camera is active: use Capture Frame or Scan From Photo.",
        );
      }
    } catch (error) {
      console.error("Failed to start camera:", error);
      setCameraError(
        "Unable to access camera. Please allow permission or use photo/manual scan.",
      );
      stopCamera();
    }
  };

  const captureAndDecodeFromCamera = async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      setImageDecodeError(
        "Camera is not ready yet. Please wait a moment and try again.",
      );
      return;
    }

    setImageDecodeError("");
    setDecodingImage(true);

    try {
      const sourceWidth =
        videoRef.current.videoWidth || videoRef.current.clientWidth;
      const sourceHeight =
        videoRef.current.videoHeight || videoRef.current.clientHeight;

      if (!sourceWidth || !sourceHeight) {
        setImageDecodeError("Unable to capture image from camera.");
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;

      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        setImageDecodeError("Unable to process camera frame for QR scanning.");
        return;
      }

      context.drawImage(videoRef.current, 0, 0, sourceWidth, sourceHeight);
      const imageData = context.getImageData(0, 0, sourceWidth, sourceHeight);
      const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });

      if (!decoded?.data) {
        setImageDecodeError(
          "No QR code found in captured frame. Try moving closer or improving lighting.",
        );
        return;
      }

      setTicketCode(decoded.data);
      await handleScan(decoded.data);
    } catch (error) {
      console.error("Camera frame decode failed:", error);
      setImageDecodeError(
        "Failed to decode QR from camera frame. Try again or use Scan From Photo.",
      );
    } finally {
      setDecodingImage(false);
    }
  };

  const decodeQrFromImageFile = async (file) =>
    new Promise((resolve, reject) => {
      const imageUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        try {
          const maxDimension = 2000;
          const sourceWidth = image.naturalWidth || image.width;
          const sourceHeight = image.naturalHeight || image.height;
          const scale = Math.min(
            1,
            maxDimension / Math.max(sourceWidth, sourceHeight),
          );

          const width = Math.max(1, Math.floor(sourceWidth * scale));
          const height = Math.max(1, Math.floor(sourceHeight * scale));

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (!context) {
            reject(new Error("Unable to process image for QR scanning."));
            return;
          }

          context.drawImage(image, 0, 0, width, height);
          const imageData = context.getImageData(0, 0, width, height);
          const decoded = jsQR(
            imageData.data,
            imageData.width,
            imageData.height,
            {
              inversionAttempts: "attemptBoth",
            },
          );

          resolve(decoded?.data || null);
        } catch (error) {
          reject(error);
        } finally {
          URL.revokeObjectURL(imageUrl);
        }
      };

      image.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        reject(new Error("Could not read the selected image."));
      };

      image.src = imageUrl;
    });

  const handleImageScan = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setImageDecodeError("");
    setDecodingImage(true);

    try {
      const decodedValue = await decodeQrFromImageFile(file);

      if (!decodedValue) {
        setImageDecodeError(
          "No QR code found in the selected image. Try a clearer photo.",
        );
        return;
      }

      setTicketCode(decodedValue);
      await handleScan(decodedValue);
    } catch (error) {
      console.error("Image QR decode failed:", error);
      setImageDecodeError(
        "Failed to decode QR from image. Please try a different photo or manual code.",
      );
    } finally {
      setDecodingImage(false);
    }
  };

  const stopCamera = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    detectorRef.current = null;
    processingRef.current = false;
    setCameraActive(false);
  };

  if (!staffInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin size-12 border-4 border-green-200 border-t-green-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold">Security Scanner</h1>
            <p className="text-xs text-gray-400">
              Role: {staffInfo.assigned_role}
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl p-5 mb-6">
          <h2 className="text-white font-bold text-lg mb-2">
            {staffInfo.event_name}
          </h2>
          <div className="flex flex-wrap gap-3 text-gray-400 text-sm">
            <span className="flex items-center gap-1">
              <Calendar className="size-4" />
              {new Date(staffInfo.start_datetime).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-4" />
              {new Date(staffInfo.start_datetime).toLocaleTimeString()}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-4" />
              {staffInfo.venue_name}, {staffInfo.city}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-700 rounded-xl p-3 text-center">
              <p className="text-gray-400 text-xs">Total Tickets</p>
              <p className="text-white text-2xl font-bold">
                {stats.total_tickets}
              </p>
            </div>
            <div className="bg-gray-700 rounded-xl p-3 text-center">
              <p className="text-gray-400 text-xs">Checked In</p>
              <p className="text-green-400 text-2xl font-bold">
                {stats.checked_in}
              </p>
            </div>
          </div>

          <div className="mt-3">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{
                  width: `${stats.total_tickets ? (stats.checked_in / stats.total_tickets) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl p-5 mb-6">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <QrCode className="size-5 text-green-400" />
            QR Scanner
          </h3>

          <div className="bg-gray-900/70 rounded-xl border border-gray-700 overflow-hidden mb-4">
            <video
              ref={videoRef}
              className="w-full h-56 object-cover bg-black"
              muted
              playsInline
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {!cameraActive ? (
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
              >
                <Camera className="size-4" /> Start Camera
              </button>
            ) : (
              <>
                <button
                  onClick={captureAndDecodeFromCamera}
                  disabled={decodingImage || scanning}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  <Camera className="size-4" /> Capture Frame
                </button>
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition flex items-center gap-2"
                >
                  <XCircle className="size-4" /> Stop Camera
                </button>
              </>
            )}

            {!supportsLiveScanner && (
              <span className="text-xs text-yellow-300 bg-yellow-900/40 px-2 py-1 rounded">
                Live auto-scan not supported. Use Capture Frame or Scan From
                Photo.
              </span>
            )}
          </div>

          {cameraError && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-200 text-sm flex items-center gap-2">
              <AlertCircle className="size-4" />
              {cameraError}
            </div>
          )}

          <div className="mb-4 p-3 rounded-lg bg-blue-900/30 border border-blue-700/60">
            <label className="text-sm text-blue-100 font-medium flex items-center gap-2 mb-2">
              <Upload className="size-4" /> Scan From Photo
            </label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageScan}
              disabled={decodingImage || scanning}
              className="w-full text-sm text-gray-200 file:mr-3 file:px-3 file:py-2 file:border-0 file:rounded-lg file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-60"
            />
            <p className="text-xs text-blue-200/90 mt-2">
              Works as fallback when live camera scanning is unsupported: take
              or select a QR photo.
            </p>
            {imageDecodeError && (
              <p className="text-xs text-red-300 mt-2">{imageDecodeError}</p>
            )}
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={ticketCode}
              onChange={(e) => setTicketCode(e.target.value)}
              placeholder="Paste QR token or ticket code"
              className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
              onKeyPress={(e) => e.key === "Enter" && handleScan()}
            />
            <button
              onClick={() => handleScan()}
              disabled={scanning || decodingImage}
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              {scanning || decodingImage ? "..." : "Validate"}
            </button>
          </div>

          {scanResult && (
            <div
              className={`mt-4 p-3 rounded-xl border ${
                scanResult.status === "valid"
                  ? "bg-green-500/20 border border-green-500 text-green-400"
                  : scanResult.status === "already_scanned"
                    ? "bg-yellow-500/20 border border-yellow-500 text-yellow-300"
                    : "bg-red-500/20 border border-red-500 text-red-400"
              }`}
            >
              <div className="flex items-start gap-2">
                {scanResult.status === "valid" ? (
                  <CheckCircle className="size-5 mt-0.5" />
                ) : (
                  <XCircle className="size-5 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">
                    Gate Decision: {scanResult.decision}
                  </p>
                  <p className="text-sm">{scanResult.message}</p>
                  <p className="text-xs opacity-90">{scanResult.instruction}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {recentScans.length > 0 && (
          <div className="bg-gray-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-3">Recent Scans</h3>
            <div className="space-y-2">
              {recentScans.map((scan, idx) => (
                <div
                  key={`${scan.time}-${idx}`}
                  className="flex items-center justify-between p-2 bg-gray-700 rounded-lg"
                >
                  <code className="text-xs text-gray-300 font-mono truncate max-w-[70%]">
                    {scan.code}
                  </code>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{scan.time}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        scan.status === "valid"
                          ? "bg-green-900/60 text-green-200"
                          : scan.status === "already_scanned"
                            ? "bg-yellow-900/60 text-yellow-200"
                            : "bg-red-900/60 text-red-200"
                      }`}
                    >
                      {scan.decision}
                    </span>
                    {scan.status === "valid" ? (
                      <CheckCircle className="size-4 text-green-400" />
                    ) : scan.status === "already_scanned" ? (
                      <AlertCircle className="size-4 text-yellow-400" />
                    ) : (
                      <XCircle className="size-4 text-red-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-between text-center text-xs text-gray-500">
          <div>
            <Users className="size-4 mx-auto mb-1" />
            <p>Total Tickets</p>
            <p className="text-white font-semibold">{stats.total_tickets}</p>
          </div>
          <div>
            <Ticket className="size-4 mx-auto mb-1" />
            <p>Remaining</p>
            <p className="text-white font-semibold">
              {Math.max(0, stats.total_tickets - stats.checked_in)}
            </p>
          </div>
          <div>
            <Clock className="size-4 mx-auto mb-1" />
            <p>Checked In</p>
            <p className="text-white font-semibold">{stats.checked_in}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Update for: feat(controlroom): add event list query params and filter persistence for organizer screens
// Update for: feat(controlroom): add payout history and reconciliation services