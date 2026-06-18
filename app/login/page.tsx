import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

import { auth, signIn } from "@/auth";

export const dynamic = "force-dynamic";

async function loginAction(formData: FormData) {
  "use server";

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard"
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=InvalidCredentials");
    }

    throw error;
  }
}

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-ink px-4 text-white">
      <form action={loginAction} className="w-full max-w-md rounded-2xl border border-white/10 bg-panel p-7 shadow-card">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-accent">Import desk</p>
        <h1 className="mt-3 text-4xl font-black">Sign in</h1>
        <div className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-muted">Email</span>
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-accent"
              name="email"
              type="email"
              required
            />
        </label>
          <label className="block">
            <span className="text-sm font-semibold text-muted">Password</span>
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-accent"
              name="password"
              type="password"
              required
              minLength={8}
            />
        </label>
        </div>
        {params.error ? (
          <p className="mt-4 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-semibold text-white">
            Invalid email or password.
          </p>
        ) : null}
        <button className="mt-6 w-full rounded-xl bg-accent px-4 py-3 font-black text-white transition hover:brightness-110" type="submit">
          Sign in
        </button>
      </form>
    </main>
  );
}
