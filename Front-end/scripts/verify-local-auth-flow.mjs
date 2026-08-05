import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const fetch = globalThis.fetch;
const URL = globalThis.URL;
const email = "admin@jadorebakery.com";
const originalPassword = "password123";
const replacementPassword = `LocalRecovery${randomUUID().replaceAll("-", "")}9`;
const expectedCallback = "http://127.0.0.1:5173/auth/reset-password";
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const supabaseCli = resolve(projectRoot, "node_modules", "supabase", "dist", "supabase.js");

async function localRuntime() {
  const { stdout } = await execFileAsync(process.execPath, [supabaseCli, "status", "--output", "json"], {
    cwd: projectRoot,
    windowsHide: true,
  });
  const status = JSON.parse(stdout);
  const apiUrl = status["API URL"] ?? status.API_URL ?? status.api_url;
  const publishableKey = status["Publishable key"] ?? status["anon key"] ?? status.PUBLISHABLE_KEY ?? status.ANON_KEY ?? status.anon_key;
  assert.ok(apiUrl?.startsWith("http://127.0.0.1") || apiUrl?.startsWith("http://localhost"), "Local Supabase API is not available.");
  assert.ok(publishableKey, "Local Supabase public key is unavailable from Supabase status.");
  return { apiUrl, publishableKey };
}

async function authRequest(runtime, path, init = {}) {
  const response = await fetch(`${runtime.apiUrl}/auth/v1${path}`, {
    ...init,
    headers: {
      apikey: runtime.publishableKey,
      "content-type": "application/json",
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => null);
  return { response, body };
}

async function signIn(runtime, password) {
  const result = await authRequest(runtime, "/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return result;
}

async function mailpitMessageIds() {
  const messagesResponse = await fetch("http://127.0.0.1:54324/api/v1/messages");
  assert.equal(messagesResponse.ok, true, "Mailpit is unavailable; local email verification cannot run.");
  const messages = await messagesResponse.json();
  return new Set((messages.messages ?? []).map(item => item.ID));
}

async function newestRecoveryLink(previousMessageIds) {
  let message;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const messagesResponse = await fetch("http://127.0.0.1:54324/api/v1/messages");
    assert.equal(messagesResponse.ok, true, "Mailpit is unavailable; local email verification cannot run.");
    const messages = await messagesResponse.json();
    message = messages.messages?.find(item => !previousMessageIds.has(item.ID) && JSON.stringify(item).includes(email));
    if (message) break;
    await delay(250);
  }
  assert.ok(message?.ID, "The local recovery email was not found in Mailpit.");
  const messageResponse = await fetch(`http://127.0.0.1:54324/api/v1/message/${message.ID}`);
  assert.equal(messageResponse.ok, true, "Could not read the local recovery email.");
  const detail = await messageResponse.json();
  const link = detail.Text?.match(/https?:\/\/[^\s"<>]+/g)?.find(value => value.includes("/verify"));
  assert.ok(link, "The local recovery email did not contain a verification link.");
  return link.replace(/[)>.,]+$/, "");
}

async function restorePassword(runtime) {
  const replacementLogin = await signIn(runtime, replacementPassword);
  assert.equal(replacementLogin.response.ok, true, "Cleanup could not sign in with the replacement credential.");
  const restored = await authRequest(runtime, "/user", {
    method: "PUT",
    headers: { authorization: `Bearer ${replacementLogin.body.access_token}` },
    body: JSON.stringify({ password: originalPassword }),
  });
  assert.equal(restored.response.ok, true, "Cleanup could not restore the seeded local credential.");
  await authRequest(runtime, "/logout", {
    method: "POST",
    headers: { authorization: `Bearer ${replacementLogin.body.access_token}` },
  });
}

let runtime;
let replacementApplied = false;
try {
  runtime = await localRuntime();

  const invalid = await signIn(runtime, "definitely-not-the-local-password");
  assert.equal(invalid.response.ok, false, "Invalid credentials unexpectedly authenticated.");

  const valid = await signIn(runtime, originalPassword);
  assert.equal(valid.response.ok, true, "The synthetic seeded user could not sign in.");
  assert.equal(valid.body.user?.email, email, "Signed-in user did not match the synthetic seeded user.");
  assert.ok(valid.body.user?.email_confirmed_at, "The synthetic seeded user is not verified.");

  const previousMessageIds = await mailpitMessageIds();
  const recovery = await authRequest(
    runtime,
    `/recover?redirect_to=${encodeURIComponent(expectedCallback)}`,
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
  );
  assert.equal(recovery.response.ok, true, "Local Supabase rejected the recovery request.");
  const recoveryLink = await newestRecoveryLink(previousMessageIds);
  const callback = new URL(recoveryLink).searchParams.get("redirect_to");
  assert.equal(callback, expectedCallback, "Recovery email did not preserve the exact reset-password callback.");

  const verified = await fetch(recoveryLink, { redirect: "manual" });
  assert.equal(verified.status >= 300 && verified.status < 400, true, "Recovery verification did not redirect to the application callback.");
  const location = verified.headers.get("location");
  assert.ok(location?.startsWith(expectedCallback), "Recovery verification redirected to an unexpected callback.");
  const token = new URL(location).hash.match(/access_token=([^&]+)/)?.[1];
  assert.ok(token, "Recovery callback did not include an access token.");

  const update = await authRequest(runtime, "/user", {
    method: "PUT",
    headers: { authorization: `Bearer ${decodeURIComponent(token)}` },
    body: JSON.stringify({ password: replacementPassword }),
  });
  assert.equal(update.response.ok, true, "Recovery session could not replace the password.");
  replacementApplied = true;

  const oldLogin = await signIn(runtime, originalPassword);
  assert.equal(oldLogin.response.ok, false, "Old credentials remained valid after replacement.");
  const newLogin = await signIn(runtime, replacementPassword);
  assert.equal(newLogin.response.ok, true, "Replacement credentials could not sign in.");

  const logout = await authRequest(runtime, "/logout", {
    method: "POST",
    headers: { authorization: `Bearer ${newLogin.body.access_token}` },
  });
  assert.equal(logout.response.ok, true, "Local logout request failed.");
  const revoked = await authRequest(runtime, "/user", {
    headers: { authorization: `Bearer ${newLogin.body.access_token}` },
  });
  assert.equal(revoked.response.ok, false, "Logout did not revoke the active local access token.");

  await restorePassword(runtime);
  replacementApplied = false;
  process.stdout.write("Local synthetic authentication verification passed; seeded credential was restored.\n");
} finally {
  if (runtime && replacementApplied) {
    await restorePassword(runtime);
  }
}
