import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="mx-auto max-w-md p-8">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Clerk is not configured. Set <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
          <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">CLERK_SECRET_KEY</code>.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </div>
  );
}
