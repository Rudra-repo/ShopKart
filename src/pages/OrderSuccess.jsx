import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ShoppingBag,
  ArrowLeft,
  Package,
  MapPin,
  AlertCircle,
  RefreshCw,
  Clock,
  CreditCard,
  Trash2,
  Loader2,
  Truck,
  X,
  Smartphone,
  Globe,
  Zap,
} from "lucide-react";
import {
  getOrderById,
  verifyPayment,
  cancelOrder,
  payForOrder,
  loadRazorpayScript,
} from "../services/api";
import { useCart } from "../context/CartContext";

const OrderSuccess = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchCart } = useCart();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatorOrder, setSimulatorOrder] = useState(null);
  const [simulatorSubmitting, setSimulatorSubmitting] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getOrderById(id);
      if (response.success) {
        setOrder(response.order);
      } else {
        setError(response.message || "Failed to load order details");
      }
    } catch (err) {
      console.error("Fetch order error:", err);
      const msg = err.response?.data?.message || "Failed to load order";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const handleCompletePayment = async () => {
    if (!order) return;
    setActionLoading(true);
    setActionError("");

    try {
      const scriptLoaded = await loadRazorpayScript();
      const res = await payForOrder(order._id);

      if (!res.success) {
        setActionError(res.message || "Failed to initiate payment for this order");
        setActionLoading(false);
        return;
      }

      const { shopKartOrderId, razorpayOrderId, amount, currency, key, isMock, shippingAddress } = res;

      // If mock or script unavailable, fallback to simulator
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
        setActionLoading(false);
        return;
      }

      // Launch Actual Razorpay Gateway
      const options = {
        key: key || "rzp_test_Tnp5dB4Ut6LjAB",
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
          setActionLoading(true);
          try {
            const verifyRes = await verifyPayment({
              shopKartOrderId,
              razorpay_order_id: response.razorpay_order_id || razorpayOrderId,
              razorpay_payment_id: response.razorpay_payment_id || `pay_rzp_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || "mock_test_signature",
            });

            if (verifyRes.success) {
              setOrder(verifyRes.order);
              await fetchCart();
            } else {
              setActionError(verifyRes.message || "Payment verification failed");
              fetchOrder();
            }
          } catch (err) {
            console.error("Payment verification error:", err);
            setActionError(err.response?.data?.message || "Payment verification failed");
          } finally {
            setActionLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setActionLoading(false);
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
          setActionLoading(false);
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
        setActionLoading(false);
      }
    } catch (err) {
      console.error("handleCompletePayment error:", err);
      setActionError(err.response?.data?.message || "Failed to start payment process");
      setActionLoading(false);
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
        setOrder(verifyRes.order);
        await fetchCart();
      } else {
        setActionError(verifyRes.message || "Simulator verification failed");
      }
    } catch (err) {
      console.error("Simulator payment error:", err);
      setActionError(err.response?.data?.message || "Simulator payment failed");
    } finally {
      setSimulatorSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!window.confirm("Are you sure you want to cancel this pending order?")) return;

    setActionLoading(true);
    setActionError("");
    try {
      const res = await cancelOrder(order._id);
      if (res.success) {
        navigate("/orders");
      } else {
        setActionError(res.message || "Failed to cancel order");
      }
    } catch (err) {
      console.error("Cancel order error:", err);
      setActionError(err.response?.data?.message || "Failed to cancel order");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="full-screen-loader">
        <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }}></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="products-container" style={{ maxWidth: 600, margin: "3rem auto", textAlign: "center" }}>
        <div className="glass-card error-state" style={{ padding: "3rem 2rem" }}>
          <AlertCircle size={48} color="#ef4444" style={{ marginBottom: "1rem" }} />
          <h2>Order Not Found</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>{error || "The requested order could not be loaded."}</p>
          <button onClick={fetchOrder} className="btn-primary">
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const isPending = order.paymentStatus === "PENDING" || order.status === "PENDING_PAYMENT";

  const outOfStockItems = order.items.filter((item) => {
    if (!item.product) return true;
    const stock = typeof item.product === "object" ? item.product.stock : undefined;
    return stock === undefined || stock === null || stock < item.quantity;
  });
  const hasOutOfStockItem = isPending && outOfStockItems.length > 0;

  const formattedTotal = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(order.totalAmount);

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="products-container" style={{ maxWidth: 900, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      {actionError && (
        <div className="glass-card error-state" style={{ marginBottom: "1.5rem", padding: "1rem 1.5rem", color: "#fca5a5", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <AlertCircle size={18} color="#ef4444" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Banner: Pending vs Paid */}
      {isPending ? (
        <div
          className="glass-card"
          style={{
            padding: "2.5rem 2rem",
            textAlign: "center",
            marginBottom: "2rem",
            border: hasOutOfStockItem ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(245, 158, 11, 0.4)",
            background: hasOutOfStockItem ? "rgba(239, 68, 68, 0.08)" : "rgba(245, 158, 11, 0.08)",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: hasOutOfStockItem ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}
          >
            {hasOutOfStockItem ? <AlertCircle size={40} color="#ef4444" /> : <Clock size={40} color="#f59e0b" />}
          </div>

          {hasOutOfStockItem ? (
            <>
              <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#fca5a5", marginBottom: "0.5rem" }}>
                Item Out of Stock — Payment Unavailable
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: "1rem", maxWidth: 650, margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
                The following product(s) in this order are currently out of stock:{" "}
                <strong style={{ color: "#fca5a5" }}>
                  {outOfStockItems.map((i) => i.name).join(", ")}
                </strong>. Payment cannot be completed. You can cancel this order to browse and purchase other available products.
              </p>

              <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={handleCancelOrder}
                  disabled={actionLoading}
                  className="btn-primary"
                  style={{ padding: "0.85rem 1.75rem", background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                >
                  {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />} Cancel Order
                </button>

                <Link
                  to="/products"
                  className="btn-outline"
                  style={{ padding: "0.85rem 1.5rem", borderColor: "rgba(255, 255, 255, 0.2)" }}
                >
                  <ShoppingBag size={18} /> Continue Shopping
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#fde047", marginBottom: "0.5rem" }}>
                Payment Pending
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: "1rem", maxWidth: 600, margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
                Your order has been registered, but payment is still pending. Complete your payment below to confirm your order or cancel if no longer needed.
              </p>

              <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={handleCompletePayment}
                  disabled={actionLoading}
                  className="btn-primary"
                  style={{
                    padding: "0.85rem 1.75rem",
                    background: "#ffffff",
                    color: "#09090b",
                    boxShadow: "0 4px 14px rgba(255, 255, 255, 0.2)",
                  }}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Launching Razorpay...
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} /> Complete Your Payment ({formattedTotal})
                    </>
                  )}
                </button>

                <button
                  onClick={handleCancelOrder}
                  disabled={actionLoading}
                  className="btn-outline"
                  style={{ padding: "0.85rem 1.5rem", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.4)" }}
                >
                  <Trash2 size={16} /> Cancel Order
                </button>
              </div>
            </>
          )}

          <div className="order-meta-pill">
            <div className="order-meta-pill-col">
              <span style={{ color: "var(--text-muted)", display: "block" }}>Order ID</span>
              <span style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "0.95rem" }}>#{order._id}</span>
            </div>
            <div className="order-meta-pill-col">
              <span style={{ color: "var(--text-muted)", display: "block" }}>Date</span>
              <span style={{ fontWeight: 600 }}>{orderDate}</span>
            </div>
            <div className="order-meta-pill-col">
              <span style={{ color: "var(--text-muted)", display: "block" }}>Total Amount</span>
              <span style={{ fontWeight: 800 }} className="price-gradient">{formattedTotal}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: "clamp(1.5rem, 5vw, 3rem) clamp(1rem, 4vw, 2rem)", textAlign: "center", marginBottom: "2rem", border: "1px solid rgba(255, 255, 255, 0.2)", background: "rgba(255, 255, 255, 0.04)" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255, 255, 255, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <CheckCircle2 size={42} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.5rem" }}>
            Order Placed Successfully!
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
            Thank you for shopping with ShopKart. Your payment has been verified and your order is confirmed.
          </p>

          <div className="order-meta-pill">
            <div className="order-meta-pill-col">
              <span style={{ color: "var(--text-muted)", display: "block" }}>Order ID</span>
              <span style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "0.95rem" }}>#{order._id}</span>
            </div>
            <div className="order-meta-pill-col">
              <span style={{ color: "var(--text-muted)", display: "block" }}>Date</span>
              <span style={{ fontWeight: 600 }}>{orderDate}</span>
            </div>
            <div className="order-meta-pill-col">
              <span style={{ color: "var(--text-muted)", display: "block" }}>Total Amount</span>
              <span style={{ fontWeight: 800 }} className="price-gradient">{formattedTotal}</span>
            </div>
          </div>
        </div>
      )}

      {/* Visual Order Delivery Progression Timeline */}
      {!isPending && (
        <div className="glass-card" style={{ padding: "1.25rem clamp(1rem, 3vw, 2rem)", marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Truck size={18} color="#ffffff" /> Order Delivery Status
          </h3>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
            {["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"].map((step, idx) => {
              const statuses = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];
              const currentIdx = statuses.indexOf(order.status || "PLACED");
              const isCompleted = idx <= (currentIdx >= 0 ? currentIdx : 0);
              const isCurrent = idx === (currentIdx >= 0 ? currentIdx : 0);

              return (
                <div key={step} style={{ flex: 1, textAlign: "center", position: "relative", zIndex: 1 }}>
                  <div
                    className="timeline-step-badge"
                    style={{
                      background: isCompleted ? "#ffffff" : "rgba(18, 18, 22, 0.8)",
                      border: isCurrent ? "2px solid #ffffff" : isCompleted ? "1px solid #ffffff" : "1px solid var(--bg-card-border)",
                      color: isCompleted ? "#09090b" : "var(--text-dim)",
                      boxShadow: isCurrent ? "0 0 12px rgba(255, 255, 255, 0.4)" : "none",
                    }}
                  >
                    {isCompleted ? <CheckCircle2 size={16} color="#09090b" /> : idx + 1}
                  </div>
                  <span className="timeline-step-label" style={{ fontSize: "0.8rem", fontWeight: isCurrent ? 700 : 500, color: isCompleted ? "#fff" : "var(--text-muted)" }}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Details Grid */}
      <div className="order-details-grid">
        {/* Order Items */}
        <div className="glass-card" style={{ padding: "clamp(1.25rem, 3.5vw, 1.75rem)" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Package size={18} color="#ffffff" /> Purchased Items ({order.items.length})
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {order.items.map((item, index) => {
              const itemTotal = new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(item.price * item.quantity);

              const unitPrice = new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(item.price);

              const itemStock = item.product ? item.product.stock : undefined;
              const isItemOutOfStock = itemStock === undefined || itemStock === null || itemStock < item.quantity;

              return (
                <div key={index} style={{ display: "flex", gap: "1rem", alignItems: "center", borderBottom: index < order.items.length - 1 ? "1px solid var(--bg-card-border)" : "none", paddingBottom: index < order.items.length - 1 ? "1rem" : 0 }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{ width: 64, height: 64, borderRadius: "10px", objectFit: "cover", background: "#0e0e12" }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&q=80";
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>{item.name}</h3>
                      {isPending && isItemOutOfStock && (
                        <span style={{ background: "rgba(239, 68, 68, 0.2)", color: "#fca5a5", border: "1px solid rgba(239, 68, 68, 0.4)", padding: "0.15rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700 }}>
                          Out of Stock ({itemStock !== undefined && itemStock !== null ? itemStock : 0} left)
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                      {unitPrice} × {item.quantity}
                    </div>
                  </div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800 }} className="price-gradient">{itemTotal}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shipping & Payment Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="glass-card" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <MapPin size={18} color="#ffffff" /> Delivery Address
            </h3>
            <div style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "var(--text-muted)" }}>
              <strong style={{ color: "#fff", display: "block" }}>{order.shippingAddress.fullName}</strong>
              <div>{order.shippingAddress.addressLine1}</div>
              <div>
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
              </div>
              <div style={{ marginTop: "0.5rem" }}>Phone: {order.shippingAddress.phone}</div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>Payment Details</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.88rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Payment Status:</span>
                <span style={{ fontWeight: 700, color: isPending ? "#fde047" : "#ffffff", background: isPending ? "rgba(245, 158, 11, 0.15)" : "rgba(255, 255, 255, 0.12)", padding: "0.15rem 0.5rem", borderRadius: "4px" }}>
                  {order.paymentStatus}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Order Status:</span>
                <span style={{ fontWeight: 700, color: isPending ? "#fde047" : "#ffffff", background: isPending ? "rgba(245, 158, 11, 0.15)" : "rgba(255, 255, 255, 0.12)", padding: "0.15rem 0.5rem", borderRadius: "4px" }}>
                  {order.status}
                </span>
              </div>
              {order.razorpayPaymentId && (
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Payment Ref ID:</span>
                  <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-main)" }}>{order.razorpayPaymentId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation Buttons */}
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2.5rem" }}>
        <Link to="/orders" className="btn-primary" style={{ padding: "0.85rem 1.75rem" }}>
          View My Orders
        </Link>
        <Link to="/products" className="btn-outline" style={{ padding: "0.85rem 1.75rem" }}>
          <ShoppingBag size={16} /> Continue Shopping
        </Link>
      </div>

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

export default OrderSuccess;
