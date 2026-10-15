import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  ArrowLeft,
  Package,
  Clock,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Loader2,
  ShieldCheck,
  X,
  Smartphone,
  Globe,
  Zap,
} from "lucide-react";
import { getMyOrders, payForOrder, verifyPayment, loadRazorpayScript } from "../services/api";
import { useCart } from "../context/CartContext";

const Orders = () => {
  const navigate = useNavigate();
  const { fetchCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [payingOrderId, setPayingOrderId] = useState(null);
  const [actionError, setActionError] = useState("");

  // Test Mode Simulator Modal Fallback
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatorOrder, setSimulatorOrder] = useState(null);
  const [simulatorSubmitting, setSimulatorSubmitting] = useState(false);

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMyOrders();
      if (response.success) {
        setOrders(response.orders || []);
      } else {
        setError(response.message || "Failed to load orders");
      }
    } catch (err) {
      console.error("Fetch my orders error:", err);
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      const msg = err.response?.data?.message || "Failed to load your order history";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCompletePayment = async (order) => {
    setPayingOrderId(order._id);
    setActionError("");

    try {
      const scriptLoaded = await loadRazorpayScript();
      const res = await payForOrder(order._id);

      if (!res.success) {
        setActionError(res.message || "Failed to initiate payment for this order");
        setPayingOrderId(null);
        return;
      }

      const { shopKartOrderId, razorpayOrderId, amount, currency, key, isMock, shippingAddress } = res;

      // If mock or script unavailable, offer simulator
      if (isMock || !scriptLoaded || !window.Razorpay || !razorpayOrderId || razorpayOrderId.startsWith("order_mock_")) {
        setSimulatorOrder({
          shopKartOrderId,
          razorpayOrderId,
          amount,
          currency,
          shippingAddress,
          totalAmount: order.totalAmount,
        });
        setShowSimulator(true);
        setPayingOrderId(null);
        return;
      }

      // Launch Actual Razorpay Gateway
      const options = {
        key: key,
        amount: amount,
        currency: currency || "INR",
        name: "ShopKart",
        description: `Payment for Order #${shopKartOrderId}`,
        order_id: razorpayOrderId,
        prefill: {
          name: shippingAddress?.fullName || "",
          contact: shippingAddress?.phone || "",
        },
        theme: {
          color: "#18181b",
        },
        handler: async function (response) {
          setPayingOrderId(order._id);
          try {
            const verifyRes = await verifyPayment({
              shopKartOrderId,
              razorpay_order_id: response.razorpay_order_id || razorpayOrderId,
              razorpay_payment_id: response.razorpay_payment_id || `pay_rzp_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || "mock_test_signature",
            });

            if (verifyRes.success) {
              await fetchCart();
              navigate(`/order-success/${shopKartOrderId}`);
            } else {
              setActionError(verifyRes.message || "Payment verification failed");
              fetchOrders();
            }
          } catch (err) {
            console.error("Payment verification error:", err);
            setActionError(err.response?.data?.message || "Payment verification failed");
          } finally {
            setPayingOrderId(null);
          }
        },
        modal: {
          ondismiss: function () {
            setPayingOrderId(null);
            setActionError("Payment window was closed. You can complete payment anytime.");
          },
        },
      };

      try {
        const rzpModal = new window.Razorpay(options);
        rzpModal.on("payment.failed", function (resp) {
          console.error("Razorpay payment failed:", resp.error);
          setSimulatorOrder({
            shopKartOrderId,
            razorpayOrderId,
            amount,
            currency,
            shippingAddress,
            totalAmount: order.totalAmount,
          });
          setShowSimulator(true);
          setPayingOrderId(null);
        });
        rzpModal.open();
      } catch (err) {
        console.warn("Razorpay open error, falling back to simulator:", err);
        setSimulatorOrder({
          shopKartOrderId,
          razorpayOrderId,
          amount,
          currency,
          shippingAddress,
          totalAmount: order.totalAmount,
        });
        setShowSimulator(true);
        setPayingOrderId(null);
      }
    } catch (err) {
      console.error("handleCompletePayment error:", err);
      setActionError(err.response?.data?.message || "Failed to start payment process");
      setPayingOrderId(null);
    }
  };

  const handleSimulatorPay = async () => {
    if (!simulatorOrder) return;
    setSimulatorSubmitting(true);
    setActionError("");

    try {
      const mockPaymentId = `pay_sim_${Date.now()}`;
      const verifyRes = await verifyPayment({
        shopKartOrderId: simulatorOrder.shopKartOrderId,
        razorpay_order_id: simulatorOrder.razorpayOrderId || `order_rzp_mock_${simulatorOrder.shopKartOrderId}`,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: "mock_test_signature",
      });

      if (verifyRes.success) {
        setShowSimulator(false);
        await fetchCart();
        navigate(`/order-success/${simulatorOrder.shopKartOrderId}`);
      } else {
        setActionError(verifyRes.message || "Simulator verification failed");
        setSimulatorSubmitting(false);
      }
    } catch (err) {
      console.error("Simulator payment error:", err);
      setActionError(err.response?.data?.message || "Simulator payment failed");
      setSimulatorSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="full-screen-loader">
        <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }}></div>
        <p>Loading your order history...</p>
      </div>
    );
  }

  return (
    <div className="products-container" style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button onClick={() => navigate(-1)} className="btn-outline" style={{ padding: "0.5rem 0.8rem" }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: "1.75rem", margin: 0, display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <Package size={24} color="#ffffff" /> My Orders
            </h1>
            <p className="page-subtitle" style={{ margin: 0, fontSize: "0.9rem" }}>
              {orders.length} {orders.length === 1 ? "order" : "orders"} placed
            </p>
          </div>
        </div>

        <Link to="/products" className="btn-outline" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <ShoppingBag size={16} /> Continue Shopping
        </Link>
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <div className="glass-card error-state" style={{ marginBottom: "1.5rem", padding: "1rem 1.5rem", color: "#fca5a5", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertCircle size={18} color="#ef4444" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError("")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="glass-card error-state" style={{ marginBottom: "2rem", padding: "2rem", textAlign: "center" }}>
          <AlertCircle size={48} className="error-icon" style={{ color: "#ef4444", marginBottom: "1rem" }} />
          <h3>Unable to Load Orders</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.25rem" }}>{error}</p>
          <button onClick={fetchOrders} className="btn-primary" style={{ margin: "0 auto" }}>
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!error && orders.length === 0 && (
        <div className="glass-card empty-state" style={{ padding: "4rem 2rem", textAlign: "center", maxWidth: 600, margin: "2rem auto" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255, 255, 255, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <Package size={36} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>You have not placed any orders yet</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem", lineHeight: 1.6 }}>
            Explore our product catalog and place your first order today!
          </p>
          <Link to="/products" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.85rem 1.75rem" }}>
            <ShoppingBag size={18} /> Start Shopping <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Populated Orders List */}
      {!error && orders.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {orders.map((order) => {
            const isPending = order.paymentStatus === "PENDING" || order.status === "PENDING_PAYMENT";
            const formattedTotal = new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            }).format(order.totalAmount);

            const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <div key={order._id} className="glass-card" style={{ padding: "1.5rem" }}>
                {/* Order Card Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--bg-card-border)", paddingBottom: "1rem", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span>Order #{order._id}</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "9999px", background: order.paymentStatus === "PAID" ? "rgba(255, 255, 255, 0.12)" : "rgba(245, 158, 11, 0.15)", color: order.paymentStatus === "PAID" ? "#ffffff" : "#fde047" }}>
                        {order.status} • {order.paymentStatus}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.25rem" }}>
                      <Clock size={13} /> Placed on {orderDate}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800 }} className="price-gradient">{formattedTotal}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{order.items.length} {order.items.length === 1 ? "item" : "items"}</div>
                  </div>
                </div>

                {/* Items Preview */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: 44, height: 44, borderRadius: "8px", objectFit: "cover", background: "#0e0e12" }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&q=80";
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.92rem", fontWeight: 600, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          Qty: {item.quantity} × ₹{item.price}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Links & Complete Payment */}
                <div style={{ borderTop: "1px dashed var(--bg-card-border)", paddingTop: "0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    {isPending && (
                      <span style={{ fontSize: "0.82rem", color: "#fde047", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                        <Clock size={13} /> Payment pending for this order
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleCompletePayment(order)}
                        disabled={payingOrderId === order._id}
                        className="btn-primary"
                        style={{
                          padding: "0.45rem 1.15rem",
                          fontSize: "0.85rem",
                          background: "#ffffff",
                          color: "#09090b",
                          boxShadow: "0 4px 14px rgba(255, 255, 255, 0.2)",
                          cursor: "pointer",
                        }}
                      >
                        {payingOrderId === order._id ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Opening Razorpay...</span>
                          </>
                        ) : (
                          <>
                            <CreditCard size={14} />
                            <span>Complete Payment</span>
                          </>
                        )}
                      </button>
                    )}

                    <Link to={`/order-success/${order._id}`} className="btn-outline" style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}>
                      <span>View Details</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RAZORPAY TEST SIMULATOR MODAL FALLBACK */}
      {showSimulator && simulatorOrder && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0, 0, 0, 0.78)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div className="glass-card responsive-modal-card" style={{ borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.2)", background: "#09090b", position: "relative" }}>
            <button
              onClick={() => {
                setShowSimulator(false);
                setActionError("Payment was cancelled.");
              }}
              style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
            >
              <X size={20} />
            </button>

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

            <div style={{ background: "rgba(18, 18, 22, 0.9)", border: "1px solid var(--bg-card-border)", borderRadius: "12px", padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Order Total to Pay:</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800 }} className="price-gradient">
                {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(simulatorOrder.totalAmount)}
              </div>
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

            <button
              type="button"
              disabled={simulatorSubmitting}
              onClick={handleSimulatorPay}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "0.95rem", fontSize: "1rem" }}
            >
              {simulatorSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Verifying Payment...
                </>
              ) : (
                <>
                  <Zap size={18} /> Confirm Test Payment & Verify
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
