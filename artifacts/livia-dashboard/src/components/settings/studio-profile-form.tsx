import { Controller, type UseFormReturn } from "react-hook-form";
import { studioProfileFieldsForVertical } from "@workspace/policy";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import { SETTINGS_SHOP_SECONDARY_DEFAULT_OPEN } from "@workspace/policy";
import { EU_TIMEZONES } from "@/lib/eu-timezones";
import { publicBookingSlugPrefix, publicBookingSlugSuffix } from "@/lib/surface-urls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShopLogoField } from "@/components/brand/shop-logo-field";

export type StudioProfileFormValues = {
  name: string;
  slug: string;
  timezone: string;
  phone: string;
  city: string;
  country: string;
  description: string;
  instagramHandle: string;
  logoUrl: string;
};

type Props = {
  form: UseFormReturn<StudioProfileFormValues>;
  businessId: string;
  vertical?: string | null;
  category?: string | null;
  locationNoun: string;
  shopEditable: boolean;
  saving: boolean;
  onSubmit: (vals: StudioProfileFormValues) => void;
  onLogoChange?: (url: string | null) => void;
};

function FieldInput({
  def,
  form,
  disabled,
  businessId,
  onLogoChange,
}: {
  def: ReturnType<typeof studioProfileFieldsForVertical>[number];
  form: UseFormReturn<StudioProfileFormValues>;
  disabled: boolean;
  businessId: string;
  onLogoChange?: (url: string | null) => void;
}) {
  const id = def.id;

  if (id === "timezone") {
    return (
      <div className="space-y-2" key={id}>
        <Label>{def.label}</Label>
        <Controller
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
              <SelectTrigger aria-label="Time zone" data-testid="input-timezone">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {EU_TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {def.hint ? <p className="text-xs text-muted-foreground">{def.hint}</p> : null}
      </div>
    );
  }

  if (id === "slug") {
    return (
      <div className="space-y-2" key={id}>
        <Label>{def.label}</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {publicBookingSlugPrefix() || "https://"}
          </span>
          <Input
            {...form.register("slug", { required: true })}
            disabled={disabled}
            data-testid="input-slug"
          />
          {publicBookingSlugSuffix() ? (
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {publicBookingSlugSuffix()}
            </span>
          ) : null}
        </div>
        {def.hint ? <p className="text-xs text-muted-foreground">{def.hint}</p> : null}
      </div>
    );
  }

  if (id === "logoUrl") {
    return (
      <ShopLogoField
        key={id}
        businessId={businessId}
        label={def.label}
        hint={def.hint}
        logoUrl={form.watch("logoUrl") || null}
        disabled={disabled}
        onChange={(url) => {
          form.setValue("logoUrl", url ?? "", { shouldDirty: true });
          onLogoChange?.(url);
        }}
      />
    );
  }

  const registerId = id as keyof StudioProfileFormValues;
  return (
    <div className="space-y-2" key={id}>
      <Label>
        {def.label}
        {def.required ? " *" : ""}
      </Label>
      <Input
        {...form.register(registerId, { required: def.required })}
        placeholder={def.placeholder}
        disabled={disabled}
        data-testid={
          id === "name"
            ? "input-business-name"
            : `input-${id}`
        }
      />
      {def.hint ? <p className="text-xs text-muted-foreground">{def.hint}</p> : null}
    </div>
  );
}

export function StudioProfileForm({
  form,
  businessId,
  vertical,
  category,
  locationNoun,
  shopEditable,
  saving,
  onSubmit,
  onLogoChange,
}: Props) {
  const profileFields = studioProfileFieldsForVertical(vertical, category);
  const primary = profileFields.filter((f) => f.section === "primary");
  const contact = profileFields.filter((f) => f.section === "contact");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <fieldset disabled={!shopEditable} className="space-y-4 disabled:opacity-80">
        {primary.map((f) => (
          <FieldInput
            key={f.id}
            def={f}
            form={form}
            disabled={!shopEditable}
            businessId={businessId}
            onLogoChange={onLogoChange}
          />
        ))}

        {contact.length > 0 ? (
          <SettingsDisclosure
            title="Contact & location"
            description="Phone, socials, city, and timezone."
            defaultOpen={SETTINGS_SHOP_SECONDARY_DEFAULT_OPEN}
          >
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contact.map((f) => (
                  <FieldInput
                    key={f.id}
                    def={f}
                    form={form}
                    disabled={!shopEditable}
                    businessId={businessId}
                    onLogoChange={onLogoChange}
                  />
                ))}
              </div>
            </div>
          </SettingsDisclosure>
        ) : null}

        {shopEditable ? (
          <Button
            type="submit"
            disabled={saving}
            className="w-full"
            data-testid="button-save-settings"
          >
            {saving ? "Saving..." : `Save ${locationNoun.toLowerCase()} profile`}
          </Button>
        ) : null}
      </fieldset>
    </form>
  );
}
