import { SignOutButton, useClerk, useUser } from "@clerk/clerk-react";
import { Link } from "wouter";
import { KeyRound, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { legalUrl } from "@/lib/surface-urls";
import { useBusiness } from "@/lib/business-context";
import { useBeautyChrome } from "@/lib/presentation-layout";
import { beautyOutlineButton, beautyPanel, beautyPrimaryButton } from "@/lib/beauty-operational-ui";
import { cn } from "@/lib/utils";
import { ProfileSecurityLink } from "@/components/settings/profile-security-link";

/** Platform-native account summary — Clerk profile opens in modal (not embedded iframe UI). */
export function AccountSettingsPanel() {
  const { user, isLoaded } = useUser();
  const { openUserProfile } = useClerk();
  const { business } = useBusiness();
  const beautyChrome = useBeautyChrome((business as { vertical?: string } | null)?.vertical);

  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;
  const displayName =
    user?.fullName?.trim() ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "Your account";

  return (
    <div className="space-y-4" data-testid="settings-account-panel">
      <Card className={beautyPanel(beautyChrome)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Your account
          </CardTitle>
          <CardDescription>
            How you sign in to Livia — separate from your studio brand and guest booking page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isLoaded ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 min-w-0">
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover border border-border/80 shrink-0"
                />
              ) : (
                <div
                  className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0"
                  aria-hidden
                >
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium truncate">{displayName}</p>
                {email ? (
                  <p className="text-sm text-muted-foreground truncate">{email}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No email on file</p>
                )}
              </div>
            </div>
          )}

          <Button
            type="button"
            className={beautyPrimaryButton(beautyChrome)}
            disabled={!isLoaded}
            data-testid="settings-open-user-profile"
            onClick={() => openUserProfile()}
          >
            <KeyRound className="h-4 w-4 mr-2" />
            Profile &amp; security
          </Button>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Opens secure account settings in a focused panel — update your name, email, password,
            two-factor auth, active sessions, or delete your login when Clerk shows that option.
          </p>
        </CardContent>
      </Card>

      <Card className={cn("border-border/80", beautyPanel(beautyChrome))}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sign out</CardTitle>
          <CardDescription>End this session on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignOutButton redirectUrl="/sign-in">
            <Button variant="outline" className={beautyOutlineButton(beautyChrome)} data-testid="settings-sign-out">
              Sign out
            </Button>
          </SignOutButton>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground leading-relaxed px-1">
        Deleting your login is in <ProfileSecurityLink className="inline" /> when enabled. If you own this
        studio,{" "}
        <Link href="/settings?tab=ownership" className="font-medium text-foreground hover:underline">
          pass the keys
        </Link>{" "}
        before removing the last owner. See our{" "}
        <a
          href={legalUrl("privacy")}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          privacy policy
        </a>
        .
      </p>
    </div>
  );
}
