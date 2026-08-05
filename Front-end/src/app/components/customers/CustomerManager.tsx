import React, { useState, useMemo, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  FileText,
  Edit3,
  Building2,
  User,
  ShoppingBag,
  DollarSign,
  Filter,
  XCircle,
  TrendingUp,
} from "lucide-react";
import {
  CustomerEditorDialog,
  type CustomerFormData,
  type CustomerSaveResult,
  type CustomerType,
} from "./CustomerEditorDialog";

export interface DomainCustomerItem {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
  readonly type?: CustomerType;
  readonly address?: string;
  readonly notes?: string;
  readonly totalOrders?: number;
  readonly totalSpent?: number;
}

export interface CustomerManagerProps {
  customers?: readonly DomainCustomerItem[];
  onAddCustomer?: (customer: CustomerFormData) => CustomerSaveResult | Promise<CustomerSaveResult>;
  onUpdateCustomer?: (id: string, patch: Partial<CustomerFormData>) => CustomerSaveResult | Promise<CustomerSaveResult>;
  onDeleteCustomer?: (id: string) => void;
}

const DEFAULT_CUSTOMERS: readonly DomainCustomerItem[] = [
  {
    id: "cust-1",
    name: "Golden Grain Cafe",
    email: "orders@goldengraincafe.com",
    phone: "(555) 234-5678",
    type: "wholesale",
    address: "123 Market St, Suite 4, San Francisco, CA 94105",
    notes: "Weekly sourdough order on Tuesday & Friday mornings. Net 30 terms.",
    totalOrders: 28,
    totalSpent: 3450.00,
  },
  {
    id: "cust-2",
    name: "Sarah Jenkins",
    email: "sarah.j@example.com",
    phone: "(555) 987-6543",
    type: "retail",
    address: "742 Evergreen Terrace, Springfield, OR 97477",
    notes: "Prefers gluten-free pastries and sesame loafs.",
    totalOrders: 14,
    totalSpent: 285.50,
  },
  {
    id: "cust-3",
    name: "Artisan Coffee House",
    email: "manager@artisancoffee.io",
    phone: "(555) 456-7890",
    type: "wholesale",
    address: "880 Broadway Ave, New York, NY 10003",
    notes: "Requires organic vegan croissants for morning coffee crowd.",
    totalOrders: 42,
    totalSpent: 7890.00,
  },
  {
    id: "cust-4",
    name: "Michael Chen",
    email: "m.chen@example.org",
    phone: "(555) 321-7654",
    type: "retail",
    address: "1540 Pine Street, Apt 3B, Seattle, WA 98101",
    notes: "Weekend sourdough loaf subscriber.",
    totalOrders: 6,
    totalSpent: 96.00,
  },
  {
    id: "cust-5",
    name: "Bay Area Bakery Co-op",
    email: "coop@bayareabakery.com",
    phone: "(555) 888-1212",
    type: "wholesale",
    address: "450 Industrial Pkwy, Oakland, CA 94607",
    notes: "Bulk flour and pre-ferment dough supplier customer.",
    totalOrders: 19,
    totalSpent: 5120.75,
  },
];

export function CustomerManager({
  customers: externalCustomers,
  onAddCustomer,
  onUpdateCustomer,
}: CustomerManagerProps) {
  const [internalCustomers, setInternalCustomers] = useState<DomainCustomerItem[]>(
    () => (externalCustomers ? [...externalCustomers] : [...DEFAULT_CUSTOMERS])
  );

  useEffect(() => {
    if (externalCustomers) {
      setInternalCustomers([...externalCustomers]);
    }
  }, [externalCustomers]);

  const activeCustomers = internalCustomers;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "wholesale" | "retail">("all");
  
  // Dialog state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerFormData | null>(null);

  // Compute counts for tab badges
  const counts = useMemo(() => {
    let wholesale = 0;
    let retail = 0;
    activeCustomers.forEach((c) => {
      if (c.type === "wholesale") wholesale++;
      else retail++;
    });
    return {
      all: activeCustomers.length,
      wholesale,
      retail,
    };
  }, [activeCustomers]);

  // Compute overall statistics
  const stats = useMemo(() => {
    const totalSpent = activeCustomers.reduce((acc, c) => acc + (c.totalSpent ?? 0), 0);
    const totalOrders = activeCustomers.reduce((acc, c) => acc + (c.totalOrders ?? 0), 0);
    return { totalSpent, totalOrders };
  }, [activeCustomers]);

  // Filter customers by tab and search query
  const filteredCustomers = useMemo(() => {
    return activeCustomers.filter((customer) => {
      // Filter by type tab
      if (activeTab === "wholesale" && customer.type !== "wholesale") return false;
      if (activeTab === "retail" && customer.type !== "retail") return false;

      // Filter by search query (name, email, phone)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = customer.name.toLowerCase().includes(query);
        const emailMatch = customer.email.toLowerCase().includes(query);
        const phoneMatch = customer.phone ? customer.phone.toLowerCase().includes(query) : false;
        return nameMatch || emailMatch || phoneMatch;
      }

      return true;
    });
  }, [activeCustomers, activeTab, searchQuery]);

  const handleOpenAddDialog = () => {
    setEditingCustomer(null);
    setIsEditorOpen(true);
  };

  const handleOpenEditDialog = (customer: DomainCustomerItem) => {
    setEditingCustomer({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone ?? "",
      type: customer.type ?? "retail",
      address: customer.address ?? "",
      notes: customer.notes ?? "",
    });
    setIsEditorOpen(true);
  };

  const getMutationError = (result: CustomerSaveResult) => {
    if (!result || result.ok) return null;
    return typeof result.error === "string" ? result.error : result.error?.message ?? "Unable to save customer. Please try again.";
  };

  const getReturnedCustomer = (result: CustomerSaveResult): DomainCustomerItem | undefined => {
    if (!result || !result.ok) return undefined;
    const candidate = result.data?.changes?.customers?.[0];
    if (!candidate || typeof candidate !== "object") return undefined;
    const customer = candidate as Partial<DomainCustomerItem>;
    if (typeof customer.id !== "string" || typeof customer.name !== "string" || typeof customer.email !== "string") {
      return undefined;
    }
    return customer as DomainCustomerItem;
  };

  const handleSaveCustomer = async (formData: CustomerFormData) => {
    if (formData.id) {
      if (onUpdateCustomer) {
        const result = await onUpdateCustomer(formData.id, formData);
        const error = getMutationError(result);
        if (error) throw new Error(error);
        const returnedCustomer = getReturnedCustomer(result);
        setInternalCustomers((prev) =>
          prev.map((customer) => customer.id === formData.id
            ? returnedCustomer ?? { ...customer, ...formData }
            : customer)
        );
      } else {
        setInternalCustomers((prev) =>
          prev.map((customer) => customer.id === formData.id ? { ...customer, ...formData } : customer)
        );
      }
    } else {
      if (onAddCustomer) {
        const result = await onAddCustomer(formData);
        const error = getMutationError(result);
        if (error) throw new Error(error);
        const returnedCustomer = getReturnedCustomer(result);
        if (returnedCustomer) {
          setInternalCustomers((prev) => [returnedCustomer, ...prev]);
        }
      } else {
        setInternalCustomers((prev) => [{
          id: `cust-${Date.now()}`,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          type: formData.type,
          address: formData.address,
          notes: formData.notes,
          totalOrders: 0,
          totalSpent: 0,
        }, ...prev]);
      }
    }
    setIsEditorOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 pb-28 lg:pb-12 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 bg-white rounded-[20px] border border-[#E5DDD3] shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-[14px] bg-[#F6F0E8] text-[#7A3E24]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#2F2925] tracking-tight">
              Customer Directory
            </h1>
            <p className="text-xs text-[#6F655E] mt-0.5">
              Manage retail accounts, wholesale partners, contact details, and order notes
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAddDialog}
          className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-[#7A3E24] hover:bg-[#934E2E] active:bg-[#60301B] text-white font-extrabold text-xs rounded-[12px] shadow-sm hover:shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Metrics Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="p-5 bg-white rounded-[16px] border border-[#E5DDD3] shadow-xs flex items-center space-x-4 hover:shadow-sm transition-all">
          <div className="p-3 bg-[#F6F0E8] text-[#7A3E24] rounded-[12px]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#6F655E] font-semibold">Total Customers</p>
            <p className="text-2xl font-extrabold text-[#2F2925]">{counts.all}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-[16px] border border-[#E5DDD3] shadow-xs flex items-center space-x-4 hover:shadow-sm transition-all">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-[12px]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#6F655E] font-semibold">Wholesale Partners</p>
            <p className="text-2xl font-extrabold text-[#2F2925]">{counts.wholesale}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-[16px] border border-[#E5DDD3] shadow-xs flex items-center space-x-4 hover:shadow-sm transition-all">
          <div className="p-3 bg-amber-50 text-amber-800 rounded-[12px]">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#6F655E] font-semibold">Retail Accounts</p>
            <p className="text-2xl font-extrabold text-[#2F2925]">{counts.retail}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-[16px] border border-[#E5DDD3] shadow-xs flex items-center space-x-4 hover:shadow-sm transition-all">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-[12px]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#6F655E] font-semibold">Lifetime Directory Spend</p>
            <p className="text-2xl font-extrabold text-[#2F2925]">
              ${stats.totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-[16px] border border-[#E5DDD3] shadow-sm">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#988D84]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by name, email, or phone..."
            className="w-full h-11 pl-10 pr-8 text-xs rounded-[12px] border border-[#E5DDD3] bg-[#F6F0E8]/50 text-[#2F2925] placeholder-[#988D84] focus:outline-none focus:border-[#7A3E24] focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#988D84] hover:text-[#2F2925]"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Segmented Filter Tabs */}
        <div className="flex items-center space-x-1 bg-[#F6F0E8] p-1 rounded-[12px] border border-[#E5DDD3]">
          <button
            type="button"
            role="tab"
            onClick={() => setActiveTab("all")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-[10px] text-xs font-bold transition-all ${
              activeTab === "all"
                ? "bg-white text-[#2F2925] shadow-xs"
                : "text-[#6F655E] hover:text-[#2F2925]"
            }`}
          >
            <span>All</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === "all"
                  ? "bg-[#7A3E24] text-white"
                  : "bg-[#E5DDD3] text-[#6F655E]"
              }`}
            >
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            onClick={() => setActiveTab("wholesale")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-[10px] text-xs font-bold transition-all ${
              activeTab === "wholesale"
                ? "bg-white text-purple-900 shadow-xs"
                : "text-[#6F655E] hover:text-[#2F2925]"
            }`}
          >
            <span>Wholesale</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === "wholesale"
                  ? "bg-purple-700 text-white"
                  : "bg-[#E5DDD3] text-[#6F655E]"
              }`}
            >
              {counts.wholesale}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("retail")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-[10px] text-xs font-bold transition-all ${
              activeTab === "retail"
                ? "bg-white text-amber-900 shadow-xs"
                : "text-[#6F655E] hover:text-[#2F2925]"
            }`}
          >
            <span>Retail</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === "retail"
                  ? "bg-amber-700 text-white"
                  : "bg-[#E5DDD3] text-[#6F655E]"
              }`}
            >
              {counts.retail}
            </span>
          </button>
        </div>
      </div>

      {/* Customer Directory Cards Grid */}
      {filteredCustomers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => {
            const isWholesale = customer.type === "wholesale";
            const initials = customer.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase();

            return (
              <div
                key={customer.id}
                className="group flex flex-col justify-between p-6 bg-white rounded-[20px] border border-[#E5DDD3] shadow-xs hover:shadow-md hover:border-[#7A3E24]/40 transition-all duration-200"
              >
                <div>
                  {/* Card Header: Initials, Name & Type Badge */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-11 h-11 rounded-[14px] flex items-center justify-center font-extrabold text-sm ${
                          isWholesale
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : "bg-[#F6F0E8] text-[#7A3E24] border border-[#E5DDD3]"
                        }`}
                      >
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-bold text-[#2F2925] text-base group-hover:text-[#7A3E24] transition-colors">
                          {customer.name}
                        </h3>
                        <p className="text-[11px] text-[#988D84] font-mono">ID: {customer.id}</p>
                      </div>
                    </div>

                    {/* Wholesale/Retail Badge */}
                    <span
                      className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold border ${
                        isWholesale
                          ? "bg-purple-50 text-purple-800 border-purple-200"
                          : "bg-amber-50 text-amber-900 border-amber-200"
                      }`}
                    >
                      {isWholesale ? (
                        <>
                          <Building2 className="w-3 h-3 mr-1" />
                          Wholesale
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3 mr-1" />
                          Retail
                        </>
                      )}
                    </span>
                  </div>

                  {/* Customer Contact Info */}
                  <div className="space-y-2.5 py-3.5 border-y border-[#E5DDD3]/70 text-xs">
                    <div className="flex items-center text-[#2F2925]">
                      <Mail className="w-3.5 h-3.5 mr-2 text-[#988D84] shrink-0" />
                      <a
                        href={`mailto:${customer.email}`}
                        className="hover:underline hover:text-[#7A3E24] truncate font-medium"
                      >
                        {customer.email}
                      </a>
                    </div>

                    {customer.phone && (
                      <div className="flex items-center text-[#2F2925]">
                        <Phone className="w-3.5 h-3.5 mr-2 text-[#988D84] shrink-0" />
                        <a
                          href={`tel:${customer.phone}`}
                          className="hover:underline hover:text-[#7A3E24] font-medium"
                        >
                          {customer.phone}
                        </a>
                      </div>
                    )}

                    {customer.address && (
                      <div className="flex items-start text-[#6F655E]">
                        <MapPin className="w-3.5 h-3.5 mr-2 mt-0.5 text-[#988D84] shrink-0" />
                        <span className="line-clamp-2">{customer.address}</span>
                      </div>
                    )}

                    {customer.notes && (
                      <div className="flex items-start text-[#6F655E] italic bg-[#F6F0E8]/70 p-3 rounded-[12px] border border-[#E5DDD3]/60">
                        <FileText className="w-3.5 h-3.5 mr-2 mt-0.5 text-[#7A3E24] shrink-0" />
                        <span className="line-clamp-2">{customer.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Stats & Actions */}
                <div className="mt-4 pt-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-xs text-[#6F655E]">
                    <span className="flex items-center font-medium" title="Total Orders">
                      <ShoppingBag className="w-3.5 h-3.5 mr-1 text-[#988D84]" />
                      {customer.totalOrders ?? 0} orders
                    </span>
                    <span className="flex items-center font-bold text-[#2F2925]" title="Total Spent">
                      <DollarSign className="w-3.5 h-3.5 mr-0.5 text-[#7A3E24]" />
                      {(customer.totalSpent ?? 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenEditDialog(customer)}
                    className="inline-flex items-center space-x-1 px-3.5 py-1.5 text-xs font-bold text-[#7A3E24] bg-[#F6F0E8] hover:bg-[#7A3E24] hover:text-white rounded-[10px] transition-all shadow-2xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center bg-white rounded-[20px] border border-[#E5DDD3] shadow-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[14px] bg-[#F6F0E8] text-[#7A3E24] mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#2F2925]">
            No customers found
          </h3>
          <p className="text-xs text-[#6F655E] max-w-sm mx-auto mt-1 mb-4">
            {searchQuery
              ? `No customer matches "${searchQuery}" in ${activeTab} filter.`
              : `There are currently no ${activeTab} customers.`}
          </p>
          {(searchQuery || activeTab !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveTab("all");
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-[#7A3E24] hover:bg-[#934E2E] rounded-[10px] transition-colors"
            >
              Reset Filters & Search
            </button>
          )}
        </div>
      )}

      {/* Editor Modal Dialog */}
      <CustomerEditorDialog
        isOpen={isEditorOpen}
        customer={editingCustomer}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveCustomer}
      />
    </div>
  );
}
