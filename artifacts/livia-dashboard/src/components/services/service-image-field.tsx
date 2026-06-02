import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadImageFile } from "@/lib/upload-media";

/** Card image for public /b — uploaded per service, shown when set. */
export function ServiceImageField({
  businessId,
  imageUrl,
  onChange,
  disabled,
}: {
  businessId: string;
  imageUrl?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onPick(file: File | undefined) {
    if (!file || !businessId) return;
    setUploading(true);
    try {
      const { url } = await uploadImageFile(businessId, file, { entityType: "service" });
      onChange(url);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2" data-testid="service-image-field">
      <Label>Booking page image</Label>
      <p className="text-xs text-muted-foreground">
        Shown on your public book page. Use a clear photo of this service — guests book faster with real
        visuals.
      </p>
      <div className="flex items-start gap-3">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
              <ImagePlus className="h-6 w-6" aria-hidden />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={disabled || uploading}
            onChange={(e) => void onPick(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            data-testid="button-upload-service-image"
          >
            {uploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" aria-hidden />
                Uploading…
              </>
            ) : (
              <>
                <ImagePlus className="h-3.5 w-3.5 mr-1.5" aria-hidden />
                {imageUrl ? "Replace image" : "Upload image"}
              </>
            )}
          </Button>
          {imageUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-8"
              disabled={disabled || uploading}
              onClick={() => onChange(null)}
              data-testid="button-clear-service-image"
            >
              <X className="h-3.5 w-3.5 mr-1" aria-hidden />
              Remove
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
