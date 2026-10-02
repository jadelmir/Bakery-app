import type {
  BakeryDomainSnapshot,
  DomainInventoryItem,
  DomainOrder,
  DomainOrderItem,
  DomainRecipe,
} from "./domain/types";

export type PrepListMaterialKind = "ingredient" | "packaging";

export interface PrepListSource {
  readonly orderId: string;
  readonly orderItemId: string;
  readonly recipeId?: string;
  readonly product: string;
  readonly customerName: string;
  readonly quantity: number;
  readonly fulfillmentDate: string;
  readonly orderStatus: DomainOrder["status"];
}

export interface PrepListProductRow {
  readonly key: string;
  readonly recipeId?: string;
  readonly product: string;
  readonly quantity: number;
  readonly prepLeadDays: number;
  readonly sources: readonly PrepListSource[];
}

export interface PrepListMaterialRow {
  readonly key: string;
  readonly itemId: string;
  readonly name: string;
  readonly unit: string;
  readonly kind: PrepListMaterialKind;
  readonly required: number;
  readonly available: number;
  readonly shortage: number;
  readonly sources: readonly PrepListSource[];
}

export interface PrepListWarning {
  readonly key: string;
  readonly message: string;
  readonly orderId: string;
  readonly orderItemId: string;
  readonly product: string;
  readonly customerName: string;
  readonly recipeId?: string;
}

export interface PrepListModel {
  readonly prepDate: string;
  readonly products: readonly PrepListProductRow[];
  readonly ingredients: readonly PrepListMaterialRow[];
  readonly packaging: readonly PrepListMaterialRow[];
  readonly warnings: readonly PrepListWarning[];
}

export interface PrepDateOption {
  readonly date: string;
  readonly productCount: number;
  readonly orderCount: number;
}

const ELIGIBLE_ORDER_STATUSES = new Set<DomainOrder["status"]>(["confirmed", "in-production", "ready"]);
const MATERIAL_KINDS = new Set<PrepListMaterialKind>(["ingredient", "packaging"]);
const SUPPORTED_UNITS = new Set(["g", "kg", "ml", "l", "unit", "units", "bag", "bags"]);

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function shiftDateKey(dateKey: string, dayDelta: number): string | null {
  const match = /^\d{4}-\d{2}-\d{2}$/.test(dateKey);
  if (!match) return null;
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  const [year, month, day] = dateKey.split("-").map(Number);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return null;
  date.setUTCDate(date.getUTCDate() + dayDelta);
  return date.toISOString().slice(0, 10);
}

export function prepDateForRecipe(fulfillmentDate: string, prepLeadDays = 1): string | null {
  if (!Number.isInteger(prepLeadDays) || prepLeadDays < 0) return null;
  return shiftDateKey(fulfillmentDate, -prepLeadDays);
}

export function listPrepDates(snapshot: BakeryDomainSnapshot): readonly PrepDateOption[] {
  const dates = new Map<string, { productCount: number; orderIds: Set<string> }>();
  for (const order of Object.values(snapshot.ordersById)) {
    if (!ELIGIBLE_ORDER_STATUSES.has(order.status)) continue;
    for (const item of Object.values(snapshot.orderItemsById).filter(candidate => candidate.orderId === order.id)) {
      const prepDate = prepDateForRecipe(order.pickupDate, snapshot.recipesById[item.recipeId]?.prepLeadDays ?? 1);
      if (!prepDate) continue;
      const option = dates.get(prepDate) ?? { productCount: 0, orderIds: new Set<string>() };
      option.productCount += Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 0;
      option.orderIds.add(order.id);
      dates.set(prepDate, option);
    }
  }
  return [...dates.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, option]) => ({ date, productCount: option.productCount, orderCount: option.orderIds.size }));
}

function sourceFor(order: DomainOrder, item: DomainOrderItem, recipe: DomainRecipe | undefined, customerName: string): PrepListSource {
  return {
    orderId: order.id,
    orderItemId: item.id,
    recipeId: recipe?.id ?? item.recipeId,
    product: item.product,
    customerName,
    quantity: item.quantity,
    fulfillmentDate: order.pickupDate,
    orderStatus: order.status,
  };
}

function warning(
  order: DomainOrder,
  item: DomainOrderItem,
  message: string,
  recipe?: DomainRecipe,
  customerName = "Customer order",
): PrepListWarning {
  return {
    key: `${order.id}:${item.id}:${message}`,
    message,
    orderId: order.id,
    orderItemId: item.id,
    product: item.product,
    customerName,
    recipeId: recipe?.id ?? item.recipeId,
  };
}

function availableQuantity(item: DomainInventoryItem): number {
  return Math.max(0, item.onHand - (item.reserved ?? 0));
}

export function buildPrepList(snapshot: BakeryDomainSnapshot, prepDate: string): PrepListModel {
  const products = new Map<string, { recipeId?: string; product: string; quantity: number; prepLeadDays: number; sources: PrepListSource[] }>();
  const materials = new Map<string, { item: DomainInventoryItem; kind: PrepListMaterialKind; required: number; sources: PrepListSource[] }>();
  const warnings: PrepListWarning[] = [];

  for (const order of Object.values(snapshot.ordersById)) {
    if (!ELIGIBLE_ORDER_STATUSES.has(order.status)) continue;
    const customerName = snapshot.customersById[order.customerId]?.name ?? "Customer order";

    const orderItems = Object.values(snapshot.orderItemsById).filter((item) => item.orderId === order.id);
    for (const item of orderItems) {
      const recipe = snapshot.recipesById[item.recipeId];
      const prepLeadDays = recipe?.prepLeadDays ?? 1;
      if (!order.pickupDate) {
        warnings.push(warning(order, item, "The order is missing a fulfillment date.", recipe, customerName));
        continue;
      }
      const derivedPrepDate = prepDateForRecipe(order.pickupDate, prepLeadDays);
      if (!derivedPrepDate || derivedPrepDate !== prepDate) continue;

      const source = sourceFor(order, item, recipe, customerName);
      const productKey = recipe?.id ?? `missing:${item.product}`;
      const product = products.get(productKey) ?? {
        recipeId: recipe?.id,
        product: item.product,
        quantity: 0,
        prepLeadDays,
        sources: [],
      };
      product.quantity = round(product.quantity + item.quantity);
      product.sources.push(source);
      products.set(productKey, product);

      if (!recipe) {
        warnings.push(warning(order, item, "This order item is missing its recipe mapping.", undefined, customerName));
        continue;
      }
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        warnings.push(warning(order, item, "The order item has an invalid quantity.", recipe, customerName));
        continue;
      }

      for (const line of recipe.ingredients) {
        const inventoryItem = snapshot.inventoryById[line.inventoryItemId];
        if (!inventoryItem) {
          warnings.push(warning(order, item, "A recipe material is missing from inventory.", recipe, customerName));
          continue;
        }
        if (inventoryItem.archived) {
          warnings.push(warning(order, item, `${inventoryItem.name} is archived and cannot be treated as available stock.`, recipe, customerName));
          continue;
        }
        if (!MATERIAL_KINDS.has(inventoryItem.kind as PrepListMaterialKind)) {
          warnings.push(warning(order, item, `${inventoryItem.name} is not an ingredient or packaging material.`, recipe, customerName));
          continue;
        }
        if (!SUPPORTED_UNITS.has(inventoryItem.unit.toLowerCase())) {
          warnings.push(warning(order, item, `${inventoryItem.name} uses an unsupported unit (${inventoryItem.unit}).`, recipe, customerName));
          continue;
        }
        if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
          warnings.push(warning(order, item, `${inventoryItem.name} has an invalid recipe quantity.`, recipe, customerName));
          continue;
        }

        const kind = inventoryItem.kind as PrepListMaterialKind;
        const key = `${inventoryItem.id}:${inventoryItem.unit}`;
        const material = materials.get(key) ?? { item: inventoryItem, kind, required: 0, sources: [] };
        material.required = round(material.required + line.quantity * item.quantity);
        material.sources.push(source);
        materials.set(key, material);
      }
    }
  }

  const mapMaterial = ({ item, kind, required, sources }: { item: DomainInventoryItem; kind: PrepListMaterialKind; required: number; sources: PrepListSource[] }): PrepListMaterialRow => {
    const available = round(availableQuantity(item));
    const normalizedRequired = round(required);
    return {
      key: `${item.id}:${item.unit}`,
      itemId: item.id,
      name: item.name,
      unit: item.unit,
      kind,
      required: normalizedRequired,
      available,
      shortage: round(Math.max(0, normalizedRequired - available)),
      sources,
    };
  };

  return {
    prepDate,
    products: [...products.values()]
      .sort((left, right) => left.product.localeCompare(right.product))
      .map((product) => ({ ...product, key: product.recipeId ?? `missing:${product.product}`, sources: [...product.sources] })),
    ingredients: [...materials.values()]
      .filter((material) => material.kind === "ingredient")
      .map(mapMaterial)
      .sort((left, right) => left.name.localeCompare(right.name)),
    packaging: [...materials.values()]
      .filter((material) => material.kind === "packaging")
      .map(mapMaterial)
      .sort((left, right) => left.name.localeCompare(right.name)),
    warnings,
  };
}
