import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Truck,
  AlertCircle,
  Loader2,
  Lock,
  ShoppingBag,
  CheckCircle,
  X,
  Smartphone,
  Globe,
  Zap,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { createPaymentOrder, verifyPayment } from "../services/api";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, cartCount, subtotal, fetchCart } = useCart();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [paymentMode, setPaymentMode] = useState("razorpay");

  // Test Mode Payment Modal State
  const [showTestModal, setShowTestModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "Full Name is required";
    if (!form.phone.trim()) {
      errs.phone = "Phone number is required";
    } else if (!/^\d{10,}$/.test(form.phone.trim().replace(/[\s+-]/g, ""))) {
      errs.phone = "Enter a valid phone number (at least 10 digits)";
    }

    if (!form.addressLine1.trim()) errs.addressLine1 = "Street address is required";
    if (!form.city.trim()) errs.city = "City is required";
    if (!form.state.trim()) errs.state = "State is required";
    if (!form.pincode.trim()) {
      errs.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(form.pincode.trim())) {
      errs.pincode = "Pincode must contain exactly 6 digits";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (cartItems.length === 0) {
      setServerError("Your cart is empty. Please add products before checking out.");
      return;
    }

    setSubmitting(true);
    setServerError("");

    try {
      // Step 1: Create ShopKart Order + Razorpay Order
      const res = await createPaymentOrder(form);

      if (!res.success) {
        setServerError(res.message || "Failed to create payment order");
        setSubmitting(false);
        return;
      }

      const { shopKartOrderId, razorpayOrderId, amount, currency, key, isMock, mockReason } = res;
      setPendingOrder({ shopKartOrderId, razorpayOrderId, amount, currency, key, isMock });

      // If user selected Simulator OR backend generated a mock order (due to unauthenticated/expired Razorpay API keys):
      if (paymentMode === "simulator" || isMock || !razorpayOrderId || razorpayOrderId.startsWith("order_mock_")) {
        if (paymentMode === "razorpay" && isMock) {
          setServerError(
            "Razorpay API keys on the server failed authentication (401). Switched to Test Mode Simulator to complete your order."
          );
        }
        setShowTestModal(true);
        setSubmitting(false);
        return;
      }

      // Attempt standard Razorpay SDK
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        setShowTestModal(true);
        setSubmitting(false);
        return;
      }

      const options = {
        key: key || "rzp_test_Tnp5dB4Ut6LjAB",
        amount: amount,
        currency: currency || "INR",
        name: "ShopKart",
        description: "ShopKart Order Checkout Payment",
        order_id: razorpayOrderId,
        prefill: {
          name: form.fullName,
          contact: form.phone,
        },
        theme: {
          color: "#18181b",
        },
        handler: async function (response) {
          await executeVerification(
            shopKartOrderId,
            response.razorpay_order_id || razorpayOrderId,
            response.razorpay_payment_id || `pay_rzp_${Date.now()}`,
            response.razorpay_signature || "mock_test_signature"
          );
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
            setServerError("Payment window closed. You can complete your order anytime with the Test Simulator.");
          },
        },
      };

      try {
        const rzpModal = new window.Razorpay(options);
        rzpModal.on("payment.failed", function (resp) {
          console.error("Payment failed event:", resp.error);
          setShowTestModal(true);
          setSubmitting(false);
        });
        rzpModal.open();
      } catch (err) {
        console.warn("Razorpay iframe open failed, fallback to Test Modal:", err);
        setShowTestModal(true);
        setSubmitting(false);
      }
    } catch (err) {
      console.error("Place order error:", err);
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      const msg = err.response?.data?.message || "Failed to place order. Please try again.";
      setServerError(msg);
      setSubmitting(false);
    }
  };

  const executeVerification = async (shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
    setVerifyingPayment(true);
    try {
      const verifyRes = await verifyPayment({
        shopKartOrderId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      if (verifyRes.success) {
        await fetchCart();
        navigate(`/order-success/${shopKartOrderId}`);
      } else {
        setServerError(verifyRes.message || "Payment verification failed");
      }
    } catch (err) {
      console.error("Payment verification error:", err);
      setServerError(err.response?.data?.message || "Payment verification failed");
    } finally {
      setVerifyingPayment(false);
      setSubmitting(false);
      setShowTestModal(false);
    }
  };

  const handleSimulateTestPaymentSuccess = async () => {
    if (!pendingOrder) return;
    const mockPaymentId = `pay_test_${Date.now()}`;
    await executeVerification(
      pendingOrder.shopKartOrderId,
      pendingOrder.razorpayOrderId,
      mockPaymentId,
      "mock_test_signature"
    );
  };

  const formattedSubtotal = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(subtotal);

  if (cartItems.length === 0 && !submitting && !showTestModal) {
    return (
      <div className="products-container" style={{ maxWidth: 600, margin: "3rem auto", textAlign: "center" }}>
        <div className="glass-card" style={{ padding: "3rem 2rem" }}>
          <ShoppingBag size={48} color="#ffffff" style={{ marginBottom: "1rem" }} />
          <h2>Your Cart is Empty</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            Add items to your cart before proceeding to checkout.
          </p>
          <Link to="/products" className="btn-primary">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="products-container" style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem", position: "relative" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <button onClick={() => navigate("/cart")} className="btn-outline" style={{ padding: "0.5rem 0.8rem" }}>
          <ArrowLeft size={16} /> Return to Cart
        </button>
        <div>
          <h1 className="page-title" style={{ fontSize: "1.75rem", margin: 0, display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Lock size={22} color="#ffffff" /> Secure Checkout
          </h1>
          <p className="page-subtitle" style={{ margin: 0, fontSize: "0.9rem" }}>
            Enter shipping details & complete Razorpay payment
          </p>
        </div>
      </div>

      {serverError && (
        <div className="glass-card error-state" style={{ marginBottom: "2rem", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", color: "#fca5a5" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 260 }}>
            <AlertCircle size={22} color="#ef4444" style={{ flexShrink: 0 }} />
            <div>{serverError}</div>
          </div>
          {pendingOrder && (
            <button
              type="button"
              onClick={() => {
                setShowTestModal(true);
                setServerError("");
              }}
              className="btn-primary"
              style={{ fontSize: "0.88rem", padding: "0.55rem 1rem", flexShrink: 0, background: "#ffffff", color: "#09090b" }}
            >
              <Zap size={16} /> Open Test Payment Simulator
            </button>
          )}
        </div>
      )}

      {/* Main Grid */}
      <div className="checkout-layout-grid">
        {/* Shipping Form */}
        <div className="glass-card" style={{ padding: "clamp(1.25rem, 3.5vw, 2rem)" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Truck size={20} color="#ffffff" /> Shipping Details
          </h2>

          <form onSubmit={handlePlaceOrder} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Full Name */}
            <div>
              <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="e.g. Aarav Sharma"
                style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", background: "rgba(15, 23, 42, 0.6)", border: errors.fullName ? "1px solid #ef4444" : "1px solid var(--bg-card-border)", color: "#fff" }}
              />
              {errors.fullName && <span style={{ color: "#fca5a5", fontSize: "0.8rem", marginTop: "0.25rem", display: "block" }}>{errors.fullName}</span>}
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
                style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", background: "rgba(15, 23, 42, 0.6)", border: errors.phone ? "1px solid #ef4444" : "1px solid var(--bg-card-border)", color: "#fff" }}
              />
              {errors.phone && <span style={{ color: "#fca5a5", fontSize: "0.8rem", marginTop: "0.25rem", display: "block" }}>{errors.phone}</span>}
            </div>

            {/* Address Line 1 */}
            <div>
              <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                Street Address *
              </label>
              <input
                type="text"
                name="addressLine1"
                value={form.addressLine1}
                onChange={handleChange}
                placeholder="e.g. Flat 402, 22 MG Road"
                style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", background: "rgba(15, 23, 42, 0.6)", border: errors.addressLine1 ? "1px solid #ef4444" : "1px solid var(--bg-card-border)", color: "#fff" }}
              />
              {errors.addressLine1 && <span style={{ color: "#fca5a5", fontSize: "0.8rem", marginTop: "0.25rem", display: "block" }}>{errors.addressLine1}</span>}
            </div>

            {/* City & State Grid */}
            <div className="form-grid-2col">
              <div>
                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g. Bengaluru"
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", background: "rgba(15, 23, 42, 0.6)", border: errors.city ? "1px solid #ef4444" : "1px solid var(--bg-card-border)", color: "#fff" }}
                />
                {errors.city && <span style={{ color: "#fca5a5", fontSize: "0.8rem", marginTop: "0.25rem", display: "block" }}>{errors.city}</span>}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="e.g. Karnataka"
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", background: "rgba(15, 23, 42, 0.6)", border: errors.state ? "1px solid #ef4444" : "1px solid var(--bg-card-border)", color: "#fff" }}
                />
                {errors.state && <span style={{ color: "#fca5a5", fontSize: "0.8rem", marginTop: "0.25rem", display: "block" }}>{errors.state}</span>}
              </div>
            </div>

            {/* Pincode */}
            <div>
              <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                Pincode *
              </label>
              <input
                type="text"
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                placeholder="e.g. 560001"
                maxLength={6}
                style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", background: "rgba(15, 23, 42, 0.6)", border: errors.pincode ? "1px solid #ef4444" : "1px solid var(--bg-card-border)", color: "#fff" }}
              />
              {errors.pincode && <span style={{ color: "#fca5a5", fontSize: "0.8rem", marginTop: "0.25rem", display: "block" }}>{errors.pincode}</span>}
            </div>

            {/* Payment Mode Selection */}
            <div>
              <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                Payment Method *
              </label>
              <div className="payment-grid-2col">
                <div
                  onClick={() => setPaymentMode("simulator")}
                  style={{
                    padding: "0.85rem",
                    borderRadius: "10px",
                    border: paymentMode === "simulator" ? "2px solid #ffffff" : "1px solid var(--bg-card-border)",
                    background: paymentMode === "simulator" ? "rgba(255, 255, 255, 0.12)" : "rgba(18, 18, 22, 0.6)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontWeight: 700, fontSize: "0.92rem", color: paymentMode === "simulator" ? "#ffffff" : "#fff" }}>
                    <CheckCircle size={16} color={paymentMode === "simulator" ? "#ffffff" : "#64748b"} />
                    <span>⚡ Test Simulator</span>
                  </div>
                  <p style={{ margin: "0.3rem 0 0 0", fontSize: "0.76rem", color: "var(--text-muted)", lineHeight: 1.3 }}>
                    Instant 1-click test checkout (Recommended)
                  </p>
                </div>

                <div
                  onClick={() => setPaymentMode("razorpay")}
                  style={{
                    padding: "0.85rem",
                    borderRadius: "10px",
                    border: paymentMode === "razorpay" ? "2px solid #ffffff" : "1px solid var(--bg-card-border)",
                    background: paymentMode === "razorpay" ? "rgba(255, 255, 255, 0.12)" : "rgba(18, 18, 22, 0.6)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontWeight: 700, fontSize: "0.92rem", color: paymentMode === "razorpay" ? "#ffffff" : "#fff" }}>
                    <CreditCard size={16} color={paymentMode === "razorpay" ? "#ffffff" : "#64748b"} />
                    <span>💳 Razorpay Gateway</span>
                  </div>
                  <p style={{ margin: "0.3rem 0 0 0", fontSize: "0.76rem", color: "var(--text-muted)", lineHeight: 1.3 }}>
                    Standard Razorpay modal (requires active API key)
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "0.95rem", fontSize: "1.05rem", marginTop: "0.5rem" }}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> {paymentMode === "simulator" ? "Preparing Payment..." : "Opening Payment..."}
                </>
              ) : (
                <>
                  {paymentMode === "simulator" ? <Zap size={18} /> : <CreditCard size={18} />}
                  {paymentMode === "simulator"
                    ? `Pay with Test Simulator (${formattedSubtotal})`
                    : `Pay with Razorpay (${formattedSubtotal})`}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem", borderBottom: "1px solid var(--bg-card-border)", paddingBottom: "0.75rem" }}>
            Order Items ({cartCount} units)
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: 300, overflowY: "auto", marginBottom: "1.25rem" }}>
            {cartItems.map((item) => {
              if (!item.product) return null;
              const formattedPrice = new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(item.product.price * item.quantity);

              return (
                <div key={item.product._id} style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    style={{ width: 44, height: 44, borderRadius: "8px", objectFit: "cover", background: "#0e0e12" }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&q=80";
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      {item.product.name}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Qty: {item.quantity} × ₹{item.product.price}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700 }} className="price-gradient">{formattedPrice}</div>
                </div>
              );
            })}
          </div>

          <div style={{ borderTop: "1px dashed var(--bg-card-border)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.95rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
              <span>Subtotal:</span>
              <span>{formattedSubtotal}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
              <span>Express Delivery:</span>
              <span style={{ color: "#ffffff", fontWeight: 600 }}>FREE</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: 800, color: "#fff", paddingTop: "0.5rem", borderTop: "1px solid var(--bg-card-border)" }}>
              <span>Total Payable:</span>
              <span className="price-gradient">{formattedSubtotal}</span>
            </div>
          </div>

          <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)", justifyContent: "center" }}>
            <ShieldCheck size={16} color="#06b6d4" />
            <span>Encrypted Razorpay Payment Gateway</span>
          </div>
        </div>
      </div>

      {/* RAZORPAY TEST PAYMENT MODAL */}
      {showTestModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0, 0, 0, 0.78)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div className="glass-card responsive-modal-card" style={{ borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.2)", background: "#09090b", position: "relative" }}>
            <button
              onClick={() => {
                setShowTestModal(false);
                setServerError("Payment was cancelled. Your cart has been preserved.");
              }}
              style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
            >
              <X size={20} />
            </button>

            {/* Header branding */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div style={{ background: "#ffffff", width: 42, height: 42, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#09090b", fontSize: "1.2rem" }}>
                R
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800 }}>Razorpay Test Gateway</h3>
                <span style={{ fontSize: "0.75rem", background: "rgba(255, 255, 255, 0.1)", color: "#ffffff", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontWeight: 700 }}>
                  Test Mode Simulator
                </span>
              </div>
            </div>

            {/* Amount Box */}
            <div style={{ background: "rgba(18, 18, 22, 0.9)", border: "1px solid var(--bg-card-border)", borderRadius: "12px", padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Total Amount to Pay:</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800 }} className="price-gradient">{formattedSubtotal}</div>
            </div>

            {/* Simulated Payment Methods */}
            <div style={{ marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>Select Test Payment Method:</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div style={{ flex: 1, padding: "0.6rem 0.8rem", borderRadius: "8px", background: "rgba(255, 255, 255, 0.12)", border: "1px solid #ffffff", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem", color: "#ffffff", fontWeight: 600 }}>
                  <Smartphone size={16} /> UPI / QR
                </div>
                <div style={{ flex: 1, padding: "0.6rem 0.8rem", borderRadius: "8px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--bg-card-border)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)" }}>
                  <Globe size={16} /> NetBanking
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                onClick={handleSimulateTestPaymentSuccess}
                disabled={verifyingPayment}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "0.85rem", fontSize: "1rem", background: "#ffffff", color: "#09090b" }}
              >
                {verifyingPayment ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Verifying Signature...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} /> Simulate Successful Payment
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setShowTestModal(false);
                  setServerError("Payment was cancelled. Your cart has been preserved.");
                }}
                disabled={verifyingPayment}
                className="btn-outline"
                style={{ width: "100%", justifyContent: "center", padding: "0.7rem", fontSize: "0.9rem" }}
              >
                Cancel Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
