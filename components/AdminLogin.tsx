"use client";
import { useState } from "react";
import Image from "next/image";

export function AdminLogin() {
  const [identifier, setIdentifier] = useState("admin@giant.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <main className="admin-login">
      <section>
        <Image className="admin-login-logo" src="/giant-logo-on-white.jpg" alt="GIANT" width={416} height={281}/>
        <p>GIANT / OPERATIONS</p>
        <h1>
          CONTROL
          <br />
          THE STORE.
        </h1>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setLoading(true);
            setError("");
            try {
              const response = await fetch("/api/v1/admin/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier, password }),
              });
              const data = (await response.json()) as {message?:string};
              if (!response.ok)
                throw new Error(data.message || "Sign in failed");
              window.location.assign("/admin");
            } catch (reason) {
              setError(
                reason instanceof Error ? reason.message : "Sign in failed",
              );
              setLoading(false);
            }
          }}
        >
          <label>
            Email or username
            <input
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
              autoComplete="username"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          {error && (
            <p className="admin-error" role="alert">
              {error}
            </p>
          )}
          <button disabled={loading}>
            {loading ? "SIGNING IN…" : "SIGN IN"}
          </button>
        </form>
        <small>Protected by a signed, HTTP-only Vercel session.</small>
      </section>
      <aside>
        <span>G</span>
        <b>
          MOVE
          <br />
          THE
          <br />
          BUSINESS.
        </b>
      </aside>
    </main>
  );
}
