import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Store,
  MapPin,
  Clock,
  Search,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  ArrowRight,
  Leaf,
} from "lucide-react";
import { createLocalBakeryAdapter } from "../../domain/localAdapter";
import { CartDrawer, type PublicCartItem } from "./CartDrawer";
import { CheckoutForm } from "./CheckoutForm";
import { OrderConfirmation } from "./OrderConfirmation";
import type {
  DomainStorefront,
  DomainStorefrontProduct,
  DomainPickupWindow,
  DomainClosedDate,
  OnlineCheckoutInput,
  PaymentMethodType,
  OnlineOrderResult,
  BakeryDomainAdapter,
} from "../../domain/types";

export interface PublicStorefrontProps {
  slug?: string;
  adapter?: BakeryDomainAdapter;
}

export function PublicStorefront({ slug: propSlug, adapter: customAdapter }: PublicStorefrontProps) {
  const targetSlug =
    propSlug ??
    window.location.pathname.match(/^\/store\/([^/]+)$/)?.[1] ??
    "jadore-bakery";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [storefront, setStorefront] = useState<DomainStorefront | null>(null);
  const [products, setProducts] = useState<readonly DomainStorefrontProduct[]>([]);
  const [pickupWindows, setPickupWindows] = useState<readonly DomainPickupWindow[]>([]);
  const [closedDates, setClosedDates] = useState<readonly DomainClosedDate[]>([]);

  const [cartItems, setCartItems] = useState<PublicCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<"pickup" | "delivery">("pickup");

  // Order Confirmation State
  const [confirmedOrder, setConfirmedOrder] = useState<{
    result: OnlineOrderResult;
    details: {
      customerName: string;
      customerEmail: string;
      customerPhone?: string;
      fulfillmentType: "pickup" | "delivery";
      fulfillmentDate: string;
      fulfillmentTimeWindow: string;
      deliveryAddress?: string;
      paymentMethodType: PaymentMethodType;
      items: readonly PublicCartItem[];
      totalCents: number;
    };
  } | null>(null);

  const localAdapter = customAdapter ?? createLocalBakeryAdapter();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    localAdapter
      .getStorefrontBySlug(targetSlug)
      .then((res) => {
        if (!mounted) return;
        if (res.ok) {
          setStorefront(res.data.storefront);
          setProducts(res.data.products);
          setPickupWindows(res.data.pickupWindows);
          setClosedDates(res.data.closedDates);
        } else {
          setError(res.error.message);
        }
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load storefront.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [targetSlug, customAdapter]);

  const handleAddToCart = (product: DomainStorefrontProduct) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as PublicCartItem[]
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartCents = cartItems.reduce(
    (sum, item) => sum + item.product.onlinePriceCents * item.quantity,
    0
  );

  const publishedProducts = products.filter((p) => p.isPublished);
  const filteredProducts = publishedProducts.filter(
    (p) =>
      p.publicName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.publicDescription && p.publicDescription.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (confirmedOrder) {
    return (
      <OrderConfirmation
        orderId={confirmedOrder.result.orderId}
        customerName={confirmedOrder.details.customerName}
        customerEmail={confirmedOrder.details.customerEmail}
        customerPhone={confirmedOrder.details.customerPhone}
        fulfillmentType={confirmedOrder.details.fulfillmentType}
        fulfillmentDate={confirmedOrder.details.fulfillmentDate}
        fulfillmentTimeWindow={confirmedOrder.details.fulfillmentTimeWindow}
        deliveryAddress={confirmedOrder.details.deliveryAddress}
        paymentMethodType={confirmedOrder.details.paymentMethodType}
        items={confirmedOrder.details.items}
        totalCents={confirmedOrder.details.totalCents}
        onReturnToStore={() => {
          setConfirmedOrder(null);
          setCartItems([]);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF8F3] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#7A3E24] text-white flex items-center justify-center mx-auto animate-bounce">
            <Leaf size={24} />
          </div>
          <p className="font-extrabold text-lg text-[#2F2925]">Loading Storefront...</p>
        </div>
      </div>
    );
  }

  if (error || !storefront) {
    return (
      <div className="min-h-screen bg-[#FBF8F3] flex items-center justify-center p-6">
        <div className="bg-white rounded-[20px] p-8 max-w-md w-full border border-[#E5DDD3] shadow-lg text-center space-y-4">
          <div className="w-14 h-14 bg-[#FCE9E7] text-[#B8443C] rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle size={28} />
          </div>
          <h1 className="text-xl font-extrabold text-[#2F2925]">Store Not Found</h1>
          <p className="text-sm text-[#6F655E]">
            {error ?? `The storefront "${targetSlug}" could not be loaded.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF8F3] pb-24">
      {/* Header Banner */}
      <header className="bg-gradient-to-r from-[#7A3E24] via-[#934E2E] to-[#B4643B] text-white pt-10 pb-16 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-[16px] bg-white text-[#7A3E24] flex items-center justify-center font-extrabold text-2xl shadow-lg border-2 border-white/20">
                {storefront.logoUrl ? (
                  <img src={storefront.logoUrl} alt={storefront.name} className="w-full h-full object-cover rounded-[14px]" />
                ) : (
                  <Leaf size={32} />
                )}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{storefront.name}</h1>
                {storefront.description && (
                  <p className="text-sm text-white/80 mt-1 max-w-lg leading-relaxed">{storefront.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  storefront.isEnabled ? "bg-[#E8F3EB] text-[#3F7A55]" : "bg-[#FCE9E7] text-[#B8443C]"
                }`}
              >
                {storefront.isEnabled ? "Accepting Orders Online" : "Currently Closed"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 relative z-20 space-y-6">
        {/* Controls Card */}
        <div className="bg-white rounded-[20px] p-4 sm:p-6 border border-[#E5DDD3] shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Pickup vs Delivery Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFulfillmentType("pickup")}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-[10px] text-xs font-bold transition-all ${
                fulfillmentType === "pickup"
                  ? "bg-[#7A3E24] text-white shadow-xs"
                  : "bg-[#FBF8F3] border border-[#E5DDD3] text-[#6F655E] hover:bg-[#F6F0E8]"
              }`}
            >
              Store Pickup
            </button>
            <button
              onClick={() => setFulfillmentType("delivery")}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-[10px] text-xs font-bold transition-all ${
                fulfillmentType === "delivery"
                  ? "bg-[#7A3E24] text-white shadow-xs"
                  : "bg-[#FBF8F3] border border-[#E5DDD3] text-[#6F655E] hover:bg-[#F6F0E8]"
              }`}
            >
              Local Delivery
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#988D84]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sourdough, pastries..."
              className="w-full h-10 pl-10 pr-4 bg-[#FBF8F3] border border-[#E5DDD3] rounded-[10px] text-xs text-[#2F2925] focus:outline-none focus:border-[#7A3E24]"
            />
          </div>
        </div>

        {/* Product Catalog Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-xl text-[#2F2925]">Fresh Bakery Menu</h2>
            <span className="text-xs text-[#988D84] font-semibold">{filteredProducts.length} items</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-[20px] p-10 border border-[#E5DDD3] text-center text-[#988D84]">
              <Store size={40} className="mx-auto mb-2 opacity-40" />
              <p className="font-bold text-base text-[#2F2925]">No storefront products available</p>
              <p className="text-xs mt-1">Check back soon for freshly published artisanal baked goods.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((product) => {
                const inCart = cartItems.find((item) => item.product.id === product.id);
                const priceFormatted = (product.onlinePriceCents / 100).toFixed(2);

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-[16px] border border-[#E5DDD3] overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Product Image / Gradient Cover */}
                      <div className="h-40 bg-gradient-to-br from-[#7A3E24] via-[#934E2E] to-[#B4643B] p-4 flex items-end justify-between relative">
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white font-extrabold text-xs flex items-center justify-center">
                          {product.publicName.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[#7A3E24] font-extrabold font-['DM_Mono',monospace] text-sm rounded-full shadow-xs">
                          ${priceFormatted}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-1.5">
                        <h3 className="font-bold text-base text-[#2F2925]">{product.publicName}</h3>
                        {product.publicDescription && (
                          <p className="text-xs text-[#6F655E] line-clamp-2 leading-relaxed">
                            {product.publicDescription}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 pt-0">
                      {product.isSoldOut ? (
                        <button
                          disabled
                          className="w-full h-10 rounded-[10px] bg-[#F6F0E8] text-[#988D84] text-xs font-bold cursor-not-allowed"
                        >
                          Sold Out
                        </button>
                      ) : inCart ? (
                        <div className="flex items-center justify-between bg-[#FAF1EB] border border-[#7A3E24] rounded-[10px] p-1">
                          <button
                            onClick={() => handleUpdateQuantity(product.id, -1)}
                            className="w-8 h-8 rounded-[8px] bg-white text-[#7A3E24] font-bold flex items-center justify-center hover:bg-[#F6F0E8]"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="font-extrabold text-xs font-['DM_Mono',monospace] text-[#7A3E24]">
                            {inCart.quantity} in order
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(product.id, 1)}
                            className="w-8 h-8 rounded-[8px] bg-[#7A3E24] text-white font-bold flex items-center justify-center hover:bg-[#934E2E]"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="w-full h-10 rounded-[10px] bg-[#7A3E24] hover:bg-[#934E2E] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Plus size={14} /> Add to Order
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Floating Cart Bar */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-md w-full px-4">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full h-14 bg-[#7A3E24] hover:bg-[#934E2E] text-white rounded-[16px] px-6 flex items-center justify-between shadow-2xl transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 text-white font-extrabold text-xs flex items-center justify-center">
                {totalCartCount}
              </div>
              <span className="font-bold text-sm">View Your Order</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base font-['DM_Mono',monospace]">
                ${(totalCartCents / 100).toFixed(2)}
              </span>
              <ArrowRight size={18} />
            </div>
          </button>
        </div>
      )}

      {/* Embedded Modals */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutForm
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        slug={targetSlug}
        items={cartItems}
        pickupWindows={pickupWindows}
        closedDates={closedDates}
        minimumLeadTimeHours={storefront.capacityRules.minimumLeadTimeHours}
        onSubmitOrder={(input) => localAdapter.submitOnlineOrder(input)}
        onOrderConfirmed={(res, details) => {
          setIsCheckoutOpen(false);
          setConfirmedOrder({ result: res, details });
        }}
      />
    </div>
  );
}
