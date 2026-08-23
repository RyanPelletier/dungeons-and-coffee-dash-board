"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { FirebaseError } from "firebase/app";

function friendlyError(err: unknown): string {
  if (err instanceof FirebaseError) {
    if (err.code === "auth/email-already-in-use") return "An account with that email already exists.";
    if (err.code === "auth/weak-password") return "Password must be at least 8 characters.";
    if (err.code === "auth/invalid-email") return "That email address looks invalid.";
  }
  return "Something went wrong. Please try again.";
}

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    characterName: "",
    race: "",
    klass: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signUp(form);
      router.push("/dashboard");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="card p-6">
        <h1 className="mb-2 font-display text-2xl font-bold text-gold">Join the Party</h1>
        <p className="mb-6 text-sm text-parchment/70">
          Create your account and the first draft of your character sheet. You can flesh out
          everything else from your dashboard once you sign in.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="username">Username</label>
              <input id="username" required className="input" value={form.username} onChange={update("username")} />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" required className="input" value={form.email} onChange={update("email")} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              className="input"
              value={form.password}
              onChange={update("password")}
            />
          </div>
          <hr className="border-gold/20" />
          <div>
            <label className="label" htmlFor="characterName">Character Name</label>
            <input id="characterName" required className="input" value={form.characterName} onChange={update("characterName")} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="race">Race</label>
              <input id="race" required className="input" value={form.race} onChange={update("race")} placeholder="Half-Elf" />
            </div>
            <div>
              <label className="label" htmlFor="klass">Class</label>
              <input id="klass" required className="input" value={form.klass} onChange={update("klass")} placeholder="Bard" />
            </div>
          </div>
          {error && <p className="text-sm text-ember">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p className="mt-4 text-sm text-parchment/70">
          Already have a character?{" "}
          <Link href="/login" className="text-gold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
