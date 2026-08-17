# Design: Repair Staging Order Visibility and Invitations

## Evidence

- `BakeryWorkspace.tsx` calls the persisted manual-order service and stores its refreshed result, but `domainOrders` gates that result on `!snapshot?.recipesById`. The Supabase-backed domain snapshot always supplies `recipesById` as an object, so the persisted list can be hidden even when the RPC and reload query succeed.
- `manualOrderAdapter.ts` already loads the authoritative customers, recipes, orders, order items, and production tasks for the active bakery. The database RPC and RLS boundary are therefore out of scope unless staging evidence shows they are absent or failing.
- The staging frontend is deployed at `https://jadelmir.github.io/Bakery-app/`. The invitation Edge Function currently allows only the `APP_URL` origin and builds its callback from the origin, which drops `/Bakery-app/`.
- The hosted invitation tasks explicitly leave `APP_URL`, Auth redirect allow-list, SMTP/sender, secrets, and hosted synthetic acceptance unverified. Local Mailpit evidence does not prove the hosted gate.

## Decisions

1. Select the order source explicitly from the persisted service boundary. When `manualOrderService` is active, `manualOrderSnapshot` is authoritative; otherwise the existing domain/local order projection remains authoritative. Do not infer runtime mode from the presence or truthiness of an unrelated collection.
2. Keep order persistence unchanged. The corrective code should not add a second write, alter the RPC contract, or bypass bakery-scoped RLS. The new regression test must prove that an empty-but-present `recipesById` cannot mask a non-empty manual-order snapshot.
3. Treat `APP_URL` as the full public application base URL for hosted callbacks, while origin validation compares only its origin. The Edge Function may preserve the configured pathname for the callback and still use local request origins for local development.
4. Keep hosted secrets and Auth/SMTP settings outside Git. The staging rollout must verify them through the authorized Supabase/GitHub environments and record only non-secret evidence in OpenSpec.
5. Keep local and hosted acceptance distinct. Local tests prove deterministic code and Mailpit behavior; staging acceptance proves deployment, redirect, Auth delivery, and persisted tenant behavior.

## Flow

```text
Manual order submit
        |
        v
Persisted RPC -> refreshed ManualOrderSnapshot
        |                         |
        |                         +--> Orders screen and task plan
        +--> database rows survive reload

Invite submit
        |
        v
Staging Edge Function
  | origin allow-list
  | invitation RPC
  | Auth delivery
  v
/Bakery-app/?invitation=<opaque-token>
        |
        v
verified invitee accepts -> one bakery membership
```

## Verification and Return Paths

- If the order regression test fails, inspect the source-selection boundary before changing the RPC or schema.
- If the staging order write fails, compare linked migration history and the `create_manual_order` function/RLS contract before adding any migration.
- If invitation submission returns `Origin not allowed`, correct the hosted `APP_URL`/origin configuration and redeploy the function.
- If delivery initiation fails after invitation creation, verify revocation/terminal state and Auth SMTP/sender settings; do not weaken the authorization boundary.
- If the delivered link lands outside `/Bakery-app/`, verify the configured base URL/path and Supabase Auth redirect allow-list before changing token handling.
- If local checks pass but staging acceptance is unavailable, leave the hosted gate explicitly incomplete and do not claim release readiness.

## Documentation Impact

Update the frontend deployment reference and invitation/API operations guidance with the canonical staging base URL, the separation between browser-safe frontend variables and hosted function secrets, the Auth redirect allow-list, SMTP/sender gate, and the required synthetic staging acceptance evidence.

