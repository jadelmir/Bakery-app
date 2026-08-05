import React, { useState, useMemo } from "react";
import {
  Store,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Settings,
  ShoppingBag,
  DollarSign,
  Package,
  TrendingUp,
  Eye,
  EyeOff,
  AlertCircle,
  Plus,
} from "lucide-react";
import { useBakeryDomain, useBakeryDomainSelector } from "../../state/provider";
import { selectSnapshot } from "../../state/selectors";
import { createLocalBakeryAdapter } from "../../domain/localAdapter";
import { StoreSettingsForm } from "./StoreSettingsForm";
import type { DomainStorefrontProduct, DomainRecipe, BakeryDomainAdapter, UpdateStorefrontSettingsInput } from "../../domain/types";

export interface StorefrontDashboardProps {
  adapter?: BakeryDomainAdapter;
}

export function StorefrontDashboard({ adapter: customAdapter }: StorefrontDashboardProps) {
  const domainContext = useBakeryDomain();
  const snapshot = useBakeryDomainSelector(selectSnapshot);
  const activeAdapter = useMemo(() => customAdapter ?? createLocalBakeryAdapter(), [customAdapter]);

  const storefront = snapshot?.storefront;
  const productsObj = snapshot?.storefrontProducts ?? {};
  const products = Object.values(productsObj);
  const pickupWindows = Object.values(snapshot?.pickupWindows ?? {});
  const closedDates = Object.values(snapshot?.closedDates ?? {});
  const recipes = Object.values(snapshot?.recipesById ?? {});
  const orders = Object.values(snapshot?.ordersById ?? {});

  const bakeryId = storefront?.bakeryId ?? "bakery-north";
  const slug = storefront?.slug ?? "jadore-bakery";
  const isEnabled = storefront?.isEnabled ?? true;

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const publicUrl = `${window.location.origin}/store/${slug}`;

  const publishedCount = products.filter((p) => p.isPublished).length;

  // Calculate online order metrics
  const onlineOrders = orders;
  const totalOnlineOrders = onlineOrders.length;
  const totalRevenue = onlineOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrdersCount = onlineOrders.filter((o) => o.status === "confirmed" || o.status === "in-production").length;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleToggleStoreEnabled = async () => {
    await activeAdapter.updateStorefrontSettings({
      bakeryId,
      operationId: `toggle-store-${Date.now()}`,
      isEnabled: !isEnabled,
    });
    void domainContext.commands.load(bakeryId);
  };

  const handleToggleProductPublish = async (prod: DomainStorefrontProduct) => {
    await activeAdapter.publishRecipeToStorefront({
      bakeryId,
      operationId: `pub-recipe-${prod.recipeId}-${Date.now()}`,
      recipeId: prod.recipeId,
      publicName: prod.publicName,
      onlinePriceCents: prod.onlinePriceCents,
      isPublished: !prod.isPublished,
      isSoldOut: prod.isSoldOut,
    });
    void domainContext.commands.load(bakeryId);
  };

  const handleToggleSoldOut = async (prod: DomainStorefrontProduct) => {
    await activeAdapter.publishRecipeToStorefront({
      bakeryId,
      operationId: `soldout-recipe-${prod.recipeId}-${Date.now()}`,
      recipeId: prod.recipeId,
      publicName: prod.publicName,
      onlinePriceCents: prod.onlinePriceCents,
      isPublished: prod.isPublished,
      isSoldOut: !prod.isSoldOut,
    });
    void domainContext.commands.load(bakeryId);
  };

  const handlePublishRecipe = async (recipe: DomainRecipe) => {
    const defaultPriceCents = Math.round(recipe.sellingPrice * 100);
    await activeAdapter.publishRecipeToStorefront({
      bakeryId,
      operationId: `publish-new-${recipe.id}-${Date.now()}`,
      recipeId: recipe.id,
      publicName: recipe.name,
      onlinePriceCents: defaultPriceCents > 0 ? defaultPriceCents : 1200,
      isPublished: true,
      isSoldOut: false,
    });
    void domainContext.commands.load(bakeryId);
  };

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto space-y-6 pb-28 lg:pb-10">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-[#2F2925]">Online Storefront</h1>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                isEnabled ? "bg-[#E8F3EB] text-[#3F7A55]" : "bg-[#FCE9E7] text-[#B8443C]"
              }`}
            >
              {isEnabled ? "Live & Accepting Orders" : "Storefront Disabled"}
            </span>
          </div>
          <p className="text-xs text-[#6F655E] mt-1">
            Manage your public storefront URL, published products, pickup windows, and checkout rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleStoreEnabled}
            className={`h-10 px-4 rounded-[10px] text-xs font-bold transition-all shadow-xs ${
              isEnabled
                ? "bg-[#B8443C] text-white hover:bg-[#A13A33]"
                : "bg-[#3F7A55] text-white hover:bg-[#326244]"
            }`}
          >
            {isEnabled ? "Turn Store Off" : "Turn Store On"}
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="h-10 px-4 rounded-[10px] bg-[#7A3E24] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#934E2E] transition-colors shadow-xs"
          >
            <Settings size={15} /> Store Settings
          </button>
        </div>
      </div>

      {/* URL & QR Card */}
      <div className="bg-white rounded-[20px] p-6 border border-[#E5DDD3] shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2 space-y-3">
          <p className="text-xs font-bold uppercase text-[#988D84] tracking-wider">
            Public Store URL Preview
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="flex-1 h-11 px-4 bg-[#FBF8F3] border border-[#E5DDD3] rounded-[10px] text-sm font-mono text-[#2F2925] truncate"
            />
            <button
              onClick={handleCopyUrl}
              className="h-11 px-4 bg-[#FAF1EB] text-[#7A3E24] border border-[#E5DDD3] rounded-[10px] text-xs font-bold flex items-center gap-1.5 hover:bg-[#F6F0E8] transition-colors"
            >
              {copiedUrl ? <Check size={16} className="text-[#3F7A55]" /> : <Copy size={16} />}
              {copiedUrl ? "Copied!" : "Copy"}
            </button>
            <a
              href={`/store/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="h-11 px-4 bg-[#7A3E24] text-white rounded-[10px] text-xs font-bold flex items-center gap-1.5 hover:bg-[#934E2E] transition-colors"
            >
              <ExternalLink size={16} /> Open
            </a>
          </div>
          <p className="text-xs text-[#6F655E]">
            Share this link with your customers or add it to your social media bio for direct online orders.
          </p>
        </div>

        {/* QR Code Presentation */}
        <div className="bg-[#FAF1EB] rounded-[16px] p-4 border border-[#E5DDD3] flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-white p-2 rounded-[12px] border border-[#E5DDD3] shadow-xs flex items-center justify-center mb-2">
            {/* Styled SVG QR Code representation */}
            <svg viewBox="0 0 100 100" className="w-full h-full text-[#2F2925] fill-current">
              <rect x="5" y="5" width="25" height="25" fill="#7A3E24" />
              <rect x="10" y="10" width="15" height="15" fill="#FFF" />
              <rect x="13" y="13" width="9" height="9" fill="#7A3E24" />
              <rect x="70" y="5" width="25" height="25" fill="#7A3E24" />
              <rect x="75" y="10" width="15" height="15" fill="#FFF" />
              <rect x="78" y="13" width="9" height="9" fill="#7A3E24" />
              <rect x="5" y="70" width="25" height="25" fill="#7A3E24" />
              <rect x="10" y="75" width="15" height="15" fill="#FFF" />
              <rect x="13" y="78" width="9" height="9" fill="#7A3E24" />
              <rect x="35" y="35" width="10" height="10" fill="#7A3E24" />
              <rect x="50" y="35" width="15" height="10" fill="#7A3E24" />
              <rect x="35" y="50" width="20" height="15" fill="#7A3E24" />
              <rect x="60" y="60" width="25" height="25" fill="#7A3E24" />
            </svg>
          </div>
          <p className="text-xs font-bold text-[#7A3E24] flex items-center gap-1">
            <QrCode size={13} /> Store QR Code
          </p>
          <p className="text-[10px] text-[#988D84] mt-0.5">Scan to order on mobile</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-[16px] border border-[#E5DDD3] p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] text-[#988D84] font-bold uppercase tracking-wider">Published Products</p>
            <p className="text-2xl font-extrabold text-[#2F2925] mt-1">{publishedCount}</p>
            <p className="text-[11px] text-[#6F655E] mt-0.5">{products.length} storefront items created</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#E8F0FB] text-[#4B6F8C] flex items-center justify-center">
            <Package size={22} />
          </div>
        </div>

        <div className="bg-white rounded-[16px] border border-[#E5DDD3] p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] text-[#988D84] font-bold uppercase tracking-wider">Online Orders</p>
            <p className="text-2xl font-extrabold text-[#2F2925] mt-1">{totalOnlineOrders}</p>
            <p className="text-[11px] text-[#3F7A55] font-semibold mt-0.5">{pendingOrdersCount} active in queue</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#E8F3EB] text-[#3F7A55] flex items-center justify-center">
            <ShoppingBag size={22} />
          </div>
        </div>

        <div className="bg-white rounded-[16px] border border-[#E5DDD3] p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] text-[#988D84] font-bold uppercase tracking-wider">Online Revenue</p>
            <p className="text-2xl font-extrabold text-[#2F2925] mt-1">${totalRevenue.toFixed(2)}</p>
            <p className="text-[11px] text-[#6F655E] mt-0.5">Automated task creation</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#FAF1EB] text-[#7A3E24] flex items-center justify-center">
            <DollarSign size={22} />
          </div>
        </div>
      </div>

      {/* Product Publishing Table / Section */}
      <section className="bg-white rounded-[20px] border border-[#E5DDD3] p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold text-[#2F2925]">Storefront Product Catalog</h2>
            <p className="text-xs text-[#6F655E]">
              Publish or unpublish recipes to your public storefront without exposing ingredient costs.
            </p>
          </div>
        </div>

        {/* Existing Published Storefront Products */}
        <div className="divide-y divide-[#F0E9E0] border border-[#E5DDD3] rounded-[14px] overflow-hidden">
          {products.length === 0 ? (
            <div className="p-8 text-center text-[#988D84]">
              <p className="font-bold text-sm text-[#2F2925]">No products added to storefront yet</p>
              <p className="text-xs mt-1">Publish recipes below to show them on your public store.</p>
            </div>
          ) : (
            products.map((prod) => {
              const recipe = recipes.find((r) => r.id === prod.recipeId);
              return (
                <div key={prod.id} className="p-4 flex items-center justify-between gap-4 bg-white hover:bg-[#FBF8F3] transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-[#2F2925]">{prod.publicName}</p>
                      {prod.isPublished ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F3EB] text-[#3F7A55]">Published</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F6F0E8] text-[#988D84]">Unpublished</span>
                      )}
                      {prod.isSoldOut && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FCE9E7] text-[#B8443C]">Sold Out</span>
                      )}
                    </div>
                    <p className="text-xs text-[#6F655E] mt-0.5">
                      Linked Recipe: {recipe?.name ?? prod.recipeId} · Online Price: ${(prod.onlinePriceCents / 100).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggleSoldOut(prod)}
                      className={`h-8 px-3 rounded-[8px] text-xs font-bold border transition-colors ${
                        prod.isSoldOut
                          ? "bg-[#E8F3EB] text-[#3F7A55] border-[#3F7A55]/30"
                          : "bg-white text-[#B8443C] border-[#E5DDD3] hover:bg-[#FCE9E7]"
                      }`}
                    >
                      {prod.isSoldOut ? "In Stock" : "Mark Sold Out"}
                    </button>

                    <button
                      onClick={() => handleToggleProductPublish(prod)}
                      className={`h-8 px-3 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-colors ${
                        prod.isPublished
                          ? "bg-[#7A3E24] text-white hover:bg-[#934E2E]"
                          : "bg-[#FAF1EB] text-[#7A3E24] border border-[#E5DDD3] hover:bg-[#F6F0E8]"
                      }`}
                    >
                      {prod.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                      {prod.isPublished ? "Unpublish" : "Publish"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Available Recipes to Publish */}
        {recipes.length > 0 && (
          <div className="pt-4 border-t border-[#F0E9E0] space-y-3">
            <h3 className="text-xs font-bold uppercase text-[#988D84] tracking-wider">
              Publish Other Recipes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recipes.map((r) => {
                const alreadyPublished = products.some((p) => p.recipeId === r.id);
                if (alreadyPublished) return null;

                return (
                  <div
                    key={r.id}
                    className="p-3 bg-[#FBF8F3] border border-[#E5DDD3] rounded-[12px] flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-xs text-[#2F2925]">{r.name}</p>
                      <p className="text-[11px] text-[#6F655E]">Price: ${r.sellingPrice.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => handlePublishRecipe(r)}
                      className="h-8 px-3 bg-[#7A3E24] text-white rounded-[8px] text-xs font-bold flex items-center gap-1 hover:bg-[#934E2E]"
                    >
                      <Plus size={13} /> Publish to Store
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Settings Modal */}
      <StoreSettingsForm
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        storefront={storefront}
        pickupWindows={pickupWindows}
        closedDates={closedDates}
        onSaveSettings={async (input) => {
          await activeAdapter.updateStorefrontSettings(input);
          void domainContext.commands.load(bakeryId);
        }}
      />
    </div>
  );
}
