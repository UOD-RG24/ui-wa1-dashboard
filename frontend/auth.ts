import NextAuth, { type NextAuthConfig, type User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

type CoreUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

type CoreSignIn = {
  accessToken: string;
  user: CoreUser;
};

type SessionUser = User & {
  coreAccessToken: string;
  coreRole: string;
};

function coreBaseUrl() {
  const value = process.env.CORE_API_BASE_URL?.replace(/\/$/, "");
  if (!value) throw new Error("CORE_API_BASE_URL is not configured");
  return value;
}

async function exchangeMicrosoftToken(accessToken: string): Promise<CoreSignIn> {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const status = await fetch(`${coreBaseUrl()}/auth/microsoft/status`, {
    headers,
    cache: "no-store",
  });
  if (!status.ok) throw new Error("The core API rejected the Microsoft identity");
  const registration = (await status.json()) as { registered: boolean };
  if (!registration.registered) {
    const signup = await fetch(`${coreBaseUrl()}/auth/microsoft/signup`, {
      method: "POST",
      headers,
      cache: "no-store",
    });
    if (!signup.ok && signup.status !== 409) {
      throw new Error("The core API could not register the Microsoft identity");
    }
  }
  const signin = await fetch(`${coreBaseUrl()}/auth/microsoft/signin`, {
    method: "POST",
    headers,
    cache: "no-store",
  });
  if (!signin.ok) throw new Error("The core API could not create a dashboard session");
  return (await signin.json()) as CoreSignIn;
}

const providers: NextAuthConfig["providers"] = [];

if (
  process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
  process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
  process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID
) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`,
      authorization: {
        params: {
          scope:
            process.env.AUTH_MICROSOFT_ENTRA_ID_SCOPE ??
            "openid profile email",
        },
      },
    }),
  );
}

if (process.env.NODE_ENV !== "production" && process.env.ALLOW_LOCAL_AUTH === "true") {
  providers.push(
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials.email === "string" ? credentials.email.trim() : "";
        const password = typeof credentials.password === "string" ? credentials.password : "";
        if (!email || !password) return null;
        const response = await fetch(`${coreBaseUrl()}/auth/jwt/signin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          cache: "no-store",
        });
        if (!response.ok) return null;
        const result = (await response.json()) as CoreSignIn;
        return {
          id: result.user.id,
          email: result.user.email,
          name: `${result.user.firstName} ${result.user.lastName}`.trim(),
          coreAccessToken: result.accessToken,
          coreRole: result.user.role,
        } satisfies SessionUser;
      },
    }),
  );
}

export const authConfig = {
  providers,
  pages: { signIn: "/pipeline/login" },
  session: { strategy: "jwt", maxAge: 55 * 60 },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account?.provider === "microsoft-entra-id" && account.access_token) {
        const result = await exchangeMicrosoftToken(account.access_token);
        token.sub = result.user.id;
        token.name = `${result.user.firstName} ${result.user.lastName}`.trim();
        token.email = result.user.email;
        token.coreAccessToken = result.accessToken;
        token.coreRole = result.user.role;
      }
      if (user && "coreAccessToken" in user) {
        const coreUser = user as SessionUser;
        token.coreAccessToken = coreUser.coreAccessToken;
        token.coreRole = coreUser.coreRole;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = typeof token.coreRole === "string" ? token.coreRole : "researcher";
      }
      return session;
    },
    authorized({ auth, request }) {
      if (request.nextUrl.searchParams.get("mode") === "demo") return true;
      return Boolean(auth?.user);
    },
  },
  events: {
    async signOut(message) {
      if (!("token" in message) || typeof message.token?.coreAccessToken !== "string") return;
      await fetch(`${coreBaseUrl()}/auth/signout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${message.token.coreAccessToken}` },
      }).catch(() => undefined);
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
