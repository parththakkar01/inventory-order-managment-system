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
    <main className="grid min-h-screen place-items-center overflow-hidden bg-[#08080a] p-4 sm:p-8">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[36px] border border-white/[0.07] bg-[#121216] shadow-float lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden min-h-[680px] overflow-hidden bg-[#17131f] p-12 text-white lg:flex lg:flex-col">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#7654dc] blur-3xl" />
          <div className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-[#9272f4]/25 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-sm font-black text-white">R</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">Import desk</p>
              <p className="text-xl font-black">Reseptionist</p>
            </div>
          </div>
          <div className="relative my-auto max-w-sm">
            <span className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white/80">Operations, reimagined</span>
            <h2 className="mt-7 text-5xl font-black leading-[1.02] tracking-[-0.055em]">Every order.<br />Every batch.<br />One clear view.</h2>
            <p className="mt-6 text-base leading-7 text-white/55">A focused workspace for imports, stock, sales and invoices without the noise.</p>
          </div>
          <div className="relative grid grid-cols-3 gap-3">
            {["Live stock", "Fast billing", "Clear reports"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-4 text-center text-xs font-bold text-white/70">
                {item}
              </div>
            ))}
          </div>
        </aside>
        <form action={loginAction} className="flex min-h-[620px] flex-col justify-center p-7 sm:p-12 lg:min-h-0 lg:p-14">
          <div className="mb-12 flex items-center gap-3 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-sm font-black text-white">R</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">Import desk</p>
              <p className="text-lg font-black">Reseptionist</p>
            </div>
          </div>
          <p className="text-sm font-bold text-accent">Welcome back</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] text-white sm:text-5xl">Sign in to your desk</h1>
          <p className="mt-3 text-sm leading-6 text-muted">Use your team credentials to continue.</p>
          <div className="mt-9 space-y-5">
            <label className="block">
              <span className="text-sm font-bold text-[#dedbe3]">Email</span>
              <input className="district-field mt-2 w-full" name="email" type="email" autoComplete="email" placeholder="name@company.com" required />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-[#dedbe3]">Password</span>
              <input className="district-field mt-2 w-full" name="password" type="password" autoComplete="current-password" placeholder="At least 8 characters" required minLength={8} />
            </label>
          </div>
          {params.error ? (
            <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-300">Invalid email or password.</p>
          ) : null}
          <button className="district-button mt-6 w-full py-3.5" type="submit">Sign in</button>
          <p className="mt-7 text-center text-xs text-muted">Secure access for authorized team members only.</p>
        </form>
      </section>
    </main>
  );
}
