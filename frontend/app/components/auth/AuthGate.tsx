"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuthStatus } from "../../lib/api";
import { ApiError } from "../../lib/apiClient";
import type { ApiUser } from "../../lib/apiTypes";
import { clearAuthSession, getAccessToken, setStoredUser } from "../../lib/authStorage";

type AuthGateProps = {
  children: (user: ApiUser) => React.ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const token = getAccessToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const status = await getAuthStatus();
        if (cancelled) return;
        if (!status.isSignedIn || !status.user) {
          clearAuthSession();
          router.replace("/login");
          return;
        }
        setStoredUser(status.user);
        setUser(status.user);
      } catch (error) {
        if (cancelled) return;
        clearAuthSession();
        if (!(error instanceof ApiError && error.status === 401)) {
          console.error(error);
        }
        router.replace("/login");
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking || !user) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <p>Checking session…</p>
      </main>
    );
  }

  return <>{children(user)}</>;
}
