"use client"

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, Bell, ChefHat, CreditCard, ShoppingCart, Mail, Star, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STATUS_STEPS = [
  { key: "payment_verification", label: "Payment Verification", icon: CreditCard },
  { key: "payment_verified", label: "Payment Confirmed", icon: CheckCircle },
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "ready", label: "Ready", icon: Bell },
  { key: "completed", label: "Completed", icon: CheckCircle },
];

function getStatusIndex(status: string) {
  if (status === "payment_verification") return 0;
  if (status === "payment_verified") return 1;
  if (status === "preparing") return 2;
  if (status === "ready") return 3;
  if (status === "completed") return 4;
  if (status === "cancelled") return 4; // Show as completed/cancelled
  return 0;
}

function getCustomerStatusMessage(status: string) {
  switch (status) {
    case "payment_verification":
      return "Order placed – awaiting payment confirmation.";
    case "payment_verified":
      return "Payment confirmed – preparing your order.";
    case "preparing":
      return "We're preparing your order.";
    case "ready":
      return "Order ready for pickup.";
    case "completed":
      return "Order completed – enjoy!";
    case "cancelled":
      return "Order cancelled.";
    default:
      return "Order placed.";
  }
}

// Add helper for reservation status
function getReservationStatusMessage(status: string) {
  switch (status) {
    case "reservation_confirmed":
      return "Reservation confirmed. We look forward to serving you!";
    case "reservation_ready":
      return "Your table is ready!";
    case "cancelled":
      return "Reservation cancelled.";
    case "completed":
      return "Reservation completed. Thank you!";
    default:
      return "Reservation placed.";
  }
}

interface OrderItem {
  quantity: number;
  name: string;
  size: string;
  notes?: string;
  price: number;
}

interface Order {
  id: string;
  status: string;
  items: OrderItem[];
  total: number;
  order_notes?: string;
  updated_at?: string;
  created_at: string;
  dining_type?: string;
  reservation_date?: string;
  reservation_time?: string;
  table_preference?: string;
  table_number?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  number_of_people?: number;
}

export default function TrackOrderPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).single();
      if (error) {
        setError("Order not found.");
        setOrder(null);
      } else {
        setOrder(data);
        setError(null);
      }
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (order && order.status === "completed") {
      const updated = new Date(order.updated_at || order.created_at);
      const closeTime = new Date(updated.getTime() + 2 * 60 * 60 * 1000);
      const updateCountdown = () => {
        const now = new Date();
        const diff = closeTime.getTime() - now.getTime();
        setCountdown(Math.max(0, Math.floor(diff / 1000)));
        if (diff <= 0) {
          window.location.href = "/";
        }
      };
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [order]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600 font-semibold">{error || "Order not found."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Map status to progress bar index
  let statusKey = order.status;
  if (statusKey === "pending") statusKey = "paid";
  if (order.dining_type === "reservation" && order.status === "served") statusKey = "completed";
  const statusIndex = getStatusIndex(statusKey);

  const isReservation = order.dining_type === "reservation";

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50">
      <Card className="w-full max-w-lg shadow-xl border-0">
        <CardContent className="p-8">
          <h2 className="text-3xl font-bold mb-2 text-orange-900 text-center">
            {isReservation ? "Track Your Reservation" : "Track Your Order"}
          </h2>
          <div className="mb-6 text-center">
            <span className="text-base text-orange-700 font-mono">Order #: {order.id.slice(0, 8)}</span>
          </div>
          <div className="mb-4 text-center text-orange-700 font-semibold text-lg">
            {isReservation
              ? getReservationStatusMessage(order.status)
              : getCustomerStatusMessage(order.status)}
          </div>
          
          {/* Fixed Progress Bar */}
          <div className="mb-8 px-4">
            <div className="relative">
              {/* Container for the progress line */}
              <div className="flex items-center justify-between mb-6">
                {/* Background line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300 transform -translate-y-1/2" />
                
                {/* Progress line */}
                <div
                  className="absolute top-1/2 left-0 h-0.5 bg-green-500 transform -translate-y-1/2 transition-all duration-500 ease-in-out"
                  style={{
                    width: `${(statusIndex / (STATUS_STEPS.length - 1)) * 100}%`,
                  }}
                />
                
                {/* Step circles */}
                {STATUS_STEPS.map((step, idx) => {
                  const isActive = idx === statusIndex;
                  const isCompleted = idx < statusIndex;
                  const isCancelled = order.status === "cancelled" && idx === statusIndex;
                  
                  return (
                    <div key={step.key} className="relative z-10">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white
                          ${isCancelled
                            ? "border-red-500 text-red-500"
                            : isCompleted
                              ? "border-green-500 bg-green-500 text-white"
                              : isActive
                                ? "border-orange-500 bg-orange-500 text-white animate-pulse"
                                : "border-gray-300 text-gray-400"}`}
                      >
                        {isCancelled ? (
                          <X className="w-5 h-5" />
                        ) : (
                          <step.icon className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Labels below the progress bar */}
              <div className="flex items-center justify-between">
                {STATUS_STEPS.map((step, idx) => {
                  const isActive = idx === statusIndex;
                  const isCompleted = idx < statusIndex;
                  const isCancelled = order.status === "cancelled" && idx === statusIndex;
                  
                  return (
                    <div key={`label-${step.key}`} className="w-10 flex justify-center">
                      <span 
                        className={`text-xs font-medium text-center max-w-[80px] leading-tight
                          ${isCancelled 
                            ? "text-red-600" 
                            : isActive 
                              ? "text-orange-700" 
                              : isCompleted 
                                ? "text-green-700" 
                                : "text-gray-400"}`}
                      >
                        {isCancelled && idx === statusIndex ? "Cancelled" : step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reservation Details */}
          {isReservation && (
            <div className="mb-6">
              <h3 className="font-semibold text-orange-900 mb-2">Reservation Details</h3>
              <ul className="mb-2 text-orange-800">
                <li><strong>Date:</strong> {order.reservation_date || "-"}</li>
                <li><strong>Time:</strong> {order.reservation_time || "-"}</li>
                <li><strong>Table:</strong> {order.table_preference || order.table_number || "-"}</li>
                <li><strong>Name:</strong> {order.customer_name || "-"}</li>
                {order.customer_phone && <li><strong>Phone:</strong> {order.customer_phone}</li>}
                {order.customer_email && <li><strong>Email:</strong> {order.customer_email}</li>}
                {order.number_of_people && <li><strong>Party Size:</strong> {order.number_of_people}</li>}
              </ul>
              {order.order_notes && (
                <div className="mt-2 text-xs text-orange-700 bg-orange-100 rounded p-2">
                  <strong>Notes:</strong> {order.order_notes}
                </div>
              )}
            </div>
          )}

          {/* Order Details (for non-reservation) */}
          {!isReservation && (
            <div className="mb-6">
              <h3 className="font-semibold text-orange-900 mb-2">Order Details</h3>
              <ul className="mb-2">
                {order.items.map((item, idx) => (
                  <li key={idx} className="text-base text-orange-800">
                    {item.quantity}x {item.name} ({item.size})
                    {item.notes && <span className="text-orange-600 italic"> - {item.notes}</span>}
                  </li>
                ))}
              </ul>
              <div className="text-base text-orange-900 font-bold">Total: RM{order.total.toFixed(2)}</div>
              {order.order_notes && (
                <div className="mt-2 text-xs text-orange-700 bg-orange-100 rounded p-2">
                  <strong>Notes:</strong> {order.order_notes}
                </div>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-3 justify-center mt-6">
            <Link href={`/menu?mode=${order.dining_type === "dine_in" ? "dine_in" : "takeaway"}${order.dining_type === "dine_in" ? `&table=${order.table_number}` : ""}`} passHref legacyBehavior>
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2">
                <ShoppingCart className="w-4 h-4" /> Order More
              </Button>
            </Link>
            <Link href="/contact" passHref legacyBehavior>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" /> Contact Us
              </Button>
            </Link>
          </div>
          
          {/* Rate Us Section (only when ready) */}
          {statusKey === "ready" && !ratingSubmitted && (
            <div className="mt-8 text-center">
              <h4 className="text-lg font-semibold text-orange-900 mb-2">Rate Your Experience</h4>
              <div className="flex justify-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 mx-1 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                      fill={star <= rating ? "#facc15" : "none"}
                    />
                  </button>
                ))}
              </div>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white mt-2"
                disabled={rating === 0 || ratingLoading}
                onClick={async () => {
                  setRatingLoading(true);
                  setRatingError(null);
                  try {
                    const { error } = await supabase.from("order_ratings").insert({ order_id: order.id, rating });
                    if (error) throw error;
                    setRatingSubmitted(true);
                  } catch (err) {
                    setRatingError("Failed to submit rating. Please try again.");
                  } finally {
                    setRatingLoading(false);
                  }
                }}
              >
                {ratingLoading ? "Submitting..." : "Submit Rating"}
              </Button>
              {ratingError && <div className="text-red-600 text-sm mt-2">{ratingError}</div>}
            </div>
          )}
          
          {statusKey === "ready" && ratingSubmitted && (
            <div className="mt-8 text-center">
              <h4 className="text-lg font-semibold text-green-700 mb-2">Thank you for your feedback!</h4>
              <p className="text-sm text-green-800">We appreciate your rating.</p>
            </div>
          )}
          
          {/* Completed Section */}
          {statusKey === "completed" && (
            <div className="mt-8 text-center">
              <h4 className="text-2xl font-bold text-green-700 mb-2 flex items-center justify-center gap-2">
                <CheckCircle className="w-7 h-7" /> Order Completed
              </h4>
              <p className="text-base text-green-800 mb-2">Thank you for your order! This page will close automatically.</p>
              {countdown !== null && countdown > 0 && (
                <p className="text-sm text-gray-600">
                  Closing in {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")} minutes
                </p>
              )}
            </div>
          )}
          
          <div className="text-center mt-8">
            <span className="text-xs text-gray-500">
              Last updated: {new Date(order.updated_at || order.created_at).toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}