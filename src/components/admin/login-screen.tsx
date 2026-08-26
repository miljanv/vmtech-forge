"use client";

import { SignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function LoginScreen({
  clerkEnabled,
  demoEnabled,
}: {
  clerkEnabled: boolean;
  demoEnabled: boolean;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card/80 p-8 shadow-xl">
        <p className="text-xs tracking-[0.2em] text-primary uppercase">StudioForge</p>
        <h1 className="font-heading mt-3 text-4xl">Ulaz u studio</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Interni panel za istraživanje firmi, generisanje predloga sajtova i vođenje prodaje.
        </p>
        {clerkEnabled ? (
          <div className="mt-6">
            <SignIn routing="hash" />
          </div>
        ) : null}
        {demoEnabled ? (
          <form action="/api/demo-login" method="post" className="mt-6">
            <Button type="submit" className="w-full">
              Uđi u demo režim
            </Button>
          </form>
        ) : null}
      </div>
    </main>
  );
}
