# Bakery App - Full API Specifications & Endpoint Audit (`API.md`)

This document defines every API endpoint, RPC function, HTTP request payload, response schema, consuming component, and current status across the Bakery App platform.

---

## 1. Store & Workspace Management API

### `POST /rest/v1/rpc/create_default_bakery` (Create Store)
- **Method & Endpoint**: `POST /rest/v1/rpc/create_default_bakery` (`WorkspaceAdapter.createDefaultBakery`)
- **Request Body**:
  ```json
  {
    "bakery_name": "J'adore Bakery"
  }
  ```
- **Response Format**: `"b1111111-1111-1111-1111-111111111111"` (UUID string of created bakery)
- **Frontend Consumer**: [WorkspaceSelector.tsx](file:///c:/Users/Jad/Desktop/BakeryApp/Front-end/src/app/WorkspaceSelector.tsx)
- **Current Status**: 🟢 Active & Connected to Supabase RPC.

### `DELETE /rest/v1/bakeries?id=eq.{bakeryId}` (Delete Store)
- **Method & Endpoint**: `DELETE /rest/v1/bakeries?id=eq.{bakeryId}` (`WorkspaceAdapter.deleteBakery`)
- **Request Parameters**: `bakeryId` (UUID)
- **Response Format**: `204 No Content`
- **Frontend Consumer**: [DeleteBakeryDialog.tsx](file:///c:/Users/Jad/Desktop/BakeryApp/Front-end/src/app/DeleteBakeryDialog.tsx)
- **Current Status**: 🟢 Active & Connected to Supabase RLS table.

### `POST /functions/v1/send-bakery-invite` (Invite Team Member)
- **Method & Endpoint**: `POST /functions/v1/send-bakery-invite` (`WorkspaceAdapter.inviteMember`)
- **Request Body**:
  ```json
  {
    "bakeryId": "b1111111-1111-1111-1111-111111111111",
    "email": "baker@example.com",
    "role": "staff"
  }
  ```
- **Response Format**: `{ "ok": true, "invitationId": "<uuid>" }`
- **Frontend Consumer**: [TeamManagement.tsx](file:///c:/Users/Jad/Desktop/BakeryApp/Front-end/src/app/TeamManagement.tsx)
- **Current Status**: 🟡 Implemented locally; staging delivery initiation was verified on 2026-08-17 after configuring the hosted `APP_URL`. Auth redirect-list verification and invite acceptance remain pending as documented in [Frontend CI/CD](../deployment/frontend-ci-cd.md).

---

## 2. Customer Orders & Production Tasks API

### `GET /rest/v1/orders` (Load Orders & Items)
- **Method & Endpoint**: `GET /rest/v1/orders?bakery_id=eq.{bakeryId}&select=*,order_items(*)`
- **Response Format**:
  ```json
  [
    {
      "id": "55555555-5555-5555-5555-555555555501",
      "bakery_id": "b1111111-1111-1111-1111-111111111111",
      "customer_id": "e1111111-1111-1111-1111-111111111111",
      "pickup_date": "2026-07-31",
      "pickup_time": "10:00 AM",
      "status": "confirmed",
      "total_cents": 2800,
      "amount_paid_cents": 2800,
      "payment_status": "paid",
      "notes": "Extra dark crust requested",
      "order_items": [
        {
          "id": "66666666-6666-6666-6666-666666666601",
          "product_name": "Classic Sourdough Loaf",
          "quantity": 2,
          "unit_price_cents": 1400,
          "total_price_cents": 2800
        }
      ]
    }
  ]
  ```
- **Frontend Consumer**: [BakeryWorkspace.tsx](file:///c:/Users/Jad/Desktop/BakeryApp/Front-end/src/app/BakeryWorkspace.tsx), [OrdersScreen.tsx](file:///c:/Users/Jad/Desktop/BakeryApp/Front-end/src/app/screens/OrdersScreen.tsx), [HomeScreen.tsx](file:///c:/Users/Jad/Desktop/BakeryApp/Front-end/src/app/screens/HomeScreen.tsx)
- **Current Status**: 🟢 Connected to real Supabase database orders via Domain Adapter.

### `POST /rest/v1/orders` (Create Order)
- **Method & Endpoint**: `POST /rest/v1/orders` (`OrdersPort.createOrder`)
- **Request Body**:
  ```json
  {
    "bakeryId": "b1111111-1111-1111-1111-111111111111",
    "operationId": "create-order-123",
    "orderId": "55555555-5555-5555-5555-555555555511",
    "customerId": "e1111111-1111-1111-1111-111111111111",
    "pickupDate": "2026-08-05",
    "pickupTime": "10:00 AM",
    "items": [
      { "recipeId": "f1111111-1111-1111-1111-111111111111", "quantity": 2, "unitPrice": 14.00 }
    ],
    "paid": 28.00,
    "notes": "Fresh sourdough order"
  }
  ```
- **Response Format**: `{ "kind": "order-created", "operationId": "create-order-123", "changes": { "orders": [...] } }`
- **Frontend Consumer**: [AddOrderModal.tsx](file:///c:/Users/Jad/Desktop/BakeryApp/Front-end/src/app/components/orders/AddOrderModal.tsx)
- **Current Status**: 🟢 Connected & Verified.

### `PATCH /rest/v1/production_tasks?id=eq.{taskId}` (Update Task Status & Notes)
- **Method & Endpoint**: `PATCH /rest/v1/production_tasks?id=eq.{taskId}` (`ProductionPort.updateTask`)
- **Request Body**:
  ```json
  {
    "status": "completed",
    "note": "Completed autolyse step"
  }
  ```
- **Response Format**: `{ "kind": "task-updated", "operationId": "update-task-123" }`
- **Frontend Consumer**: [ProductionScreen.tsx](file:///c:/Users/Jad/Desktop/BakeryApp/Front-end/src/app/screens/ProductionScreen.tsx)
- **Current Status**: 🟢 Active & Connected.

---

## 3. Recipes & Production Flow Builder API

### `GET /rest/v1/recipes` & `POST /rest/v1/recipes`
- **Method & Endpoint**: `GET /rest/v1/recipes` / `POST /rest/v1/recipes` (`RecipePort.createRecipe`)
- **Request Body**:
  ```json
  {
    "bakeryId": "b1111111-1111-1111-1111-111111111111",
    "name": "Classic Sourdough Loaf",
    "yield": "1 loaf (750g)",
    "sellingPrice": 14.00,
    "ingredients": [...]
  }
  ```
- **Response Format**: `{ "kind": "recipe-mutated", "changes": { "recipes": [...] } }`
- **Frontend Consumer**: [RecipeManager.tsx](file:///c:/Users/Jad/Desktop/BakeryApp/Front-end/src/app/components/recipes/RecipeManager.tsx)
- **Persistence Boundary**: `POST /rest/v1/rpc/save_recipe` atomically upserts the recipe and replaces its `recipe_ingredients` rows. It accepts `p_bakery_id`, `p_recipe_id`, `p_name`, `p_yield`, `p_selling_price_cents`, `p_flow_id`, and `p_ingredients_json`; the response includes authoritative recipe and ingredient costs.
- **Current Status**: 🟢 Active & Connected.

### `GET /rest/v1/production_flows` & `GET /rest/v1/production_flow_steps` (Load Flows)
- **Method & Endpoint**: Bakery-filtered reads through `createSupabaseProductionFlowAdapter.loadFlows`.
- **Request Parameters**: `bakery_id=eq.{bakeryId}` on both tables. RLS remains the authorization boundary.
- **Response Format**: Normalized `ProductionFlow[]`, with ordered steps and dependency IDs mapped to the domain shape.
- **Frontend Consumer**: [productionFlowAdapter.ts](file:///c:/Users/Jad/Desktop/BakeryApp/Front-end/src/features/production/productionFlowAdapter.ts), [BakeryWorkspace.tsx](file:///c:/Users/Jad/Desktop/BakeryApp/Front-end/src/app/BakeryWorkspace.tsx)
- **Current Status**: 🟢 Active locally; hosted rollout remains pending authenticated staging acceptance.

### `POST /rest/v1/rpc/save_production_flow` (Atomic Save/Replace Flow)
- **Method & Endpoint**: `POST /rest/v1/rpc/save_production_flow` (`ProductionPort.saveProductionFlow`)
- **RPC Request Body**:
  ```json
  {
    "p_bakery_id": "b1111111-1111-1111-1111-111111111111",
    "p_flow": { "id": "flow-sourdough", "name": "Sourdough Flow", "recipe": "Sourdough", "isDefault": false, "steps": [...] }
  }
  ```
- **RPC Response Format**: The authoritative saved flow as JSON. The frontend adapter wraps it as `{ "kind": "production-flow-mutated", "changes": { "flows": [...] } }`.
- **Frontend Consumer**: [productionFlowAdapter.ts](file:///c:/Users/Jad/Desktop/BakeryApp/Front-end/src/features/production/productionFlowAdapter.ts), [ProductionFlowBuilder.tsx](file:///c:/Users/Jad/Desktop/BakeryApp/Front-end/src/app/components/production/ProductionFlowBuilder.tsx)
- **Current Status**: 🟢 Implemented and verified against the local Supabase database.

### `POST /rest/v1/rpc/delete_production_flow` (Delete Flow)
- **Method & Endpoint**: `POST /rest/v1/rpc/delete_production_flow` (`ProductionPort.deleteProductionFlow`)
- **RPC Request Body**: `{ "p_bakery_id": "<bakeryId>", "p_flow_id": "<flowId>" }`
- **RPC Response Format**: `true` when the bakery-scoped flow was deleted; the adapter returns `deletedFlowIds` in the domain mutation changes.
- **Frontend Consumer**: [productionFlowAdapter.ts](file:///c:/Users/Jad/Desktop/BakeryApp/Front-end/src/features/production/productionFlowAdapter.ts), [domainState.ts](file:///c:/Users/Jad/Desktop/BakeryApp/Front-end/src/app/state/domainState.ts)
- **Current Status**: 🟢 Implemented and verified locally.

---

## 4. Ingredients & Inventory Movements API

### `GET /rest/v1/ingredients` & `POST /rest/v1/inventory_movements`
- **Method & Endpoint**: `GET /rest/v1/ingredients` / `POST /rest/v1/inventory_movements`
- **Request Body**: `{ "ingredient_id": "<uuid>", "quantity_change": 5000, "reason": "restock" }`
- **Response Format**: `{ "id": "<uuid>", "created_at": "<timestamp>" }`
- **Frontend Consumer**: [InventoryScreen.tsx](file:///c:/Users/Jad/Desktop/BakeryApp/Front-end/src/app/screens/InventoryScreen.tsx)
- **Current Status**: 🟢 Active & Connected.

---

## 5. Customer Directory API

### `GET /rest/v1/customers` & `POST /rest/v1/customers`
- **Method & Endpoint**: `GET /rest/v1/customers` / `POST /rest/v1/customers`
- **Request Body**: `{ "name": "Reed Family", "email": "reed@example.com", "type": "wholesale" }`
- **Response Format**: `{ "kind": "customer-mutated", "changes": { "customers": [...] } }`
- **Frontend Consumer**: [CustomerManager.tsx](file:///c:/Users/Jad/Desktop/BakeryApp/Front-end/src/app/components/customers/CustomerManager.tsx)
- **Current Status**: 🟢 Active & Connected.

---

## 6. Invoicing & Public Payments API

### `POST /rest/v1/invoices` & `POST /rest/v1/payments`
- **Method & Endpoint**: `POST /rest/v1/invoices` / `POST /rest/v1/payments`
- **Response Format**: `{ "id": "<uuid>", "public_token": "<uuid>" }`
- **Frontend Consumer**: [InvoiceList.tsx](file:///c:/Users/Jad/Desktop/BakeryApp/Front-end/src/app/components/invoicing/InvoiceList.tsx), [PublicInvoiceView.tsx](file:///c:/Users/Jad/Desktop/BakeryApp/Front-end/src/app/components/invoicing/PublicInvoiceView.tsx)
- **Current Status**: 🟢 Active & Connected.

---

## 7. Online Storefront API

### `GET /rest/v1/storefronts?slug=eq.{slug}`
- **Method & Endpoint**: `GET /rest/v1/storefronts?slug=eq.{slug}`
- **Response Format**: `StorefrontRecord` + `PublishedProducts` + `PickupWindows`
- **Frontend Consumer**: [PublicStorefront.tsx](file:///c:/Users/Jad/Desktop/BakeryApp/Front-end/src/app/components/storefront/PublicStorefront.tsx)
- **Current Status**: 🟢 Active & Connected.
