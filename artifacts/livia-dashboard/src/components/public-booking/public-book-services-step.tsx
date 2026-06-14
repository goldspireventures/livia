import { cn } from "@/lib/utils";
import {
  isWellnessGiftPublicBookEnabled,
  resolvePublicBookLayoutDensity,
  type PublicBookLayoutDensity,
} from "@workspace/policy";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import { PublicStaffStrip } from "@/components/public-booking/public-staff-strip";
import { PublicServiceCatalog } from "@/components/public-booking/public-service-catalog";
import { PublicBeautyShop } from "@/components/public-booking/public-beauty-shop";
import type { PublicRetailProduct } from "@/components/public-booking/public-beauty-shop";
import { PublicWellnessGiftPanel } from "@/components/public/public-wellness-gift-panel";
import { PublicCareNotes } from "@/components/public-booking/public-care-notes";
import { PublicBookSectionNav } from "@/components/public-booking/public-book-section-nav";
import { PublicBookBookingRail } from "@/components/public-booking/public-book-booking-rail";
import { PublicFitnessClassGrid } from "@/components/public-booking/public-fitness-class-grid";
import type { PublicServiceRow, PublicStaffRow } from "@/lib/public-booking-helpers";
import { PublicBodyArtFlashGallery } from "@/components/public-booking/public-body-art-flash-gallery";
import type { PublicDesignShowcaseItem } from "@/components/public-booking/public-body-art-flash-gallery";

export function PublicBookServicesStep({
  density: densityProp,
  staffForward,
  staff,
  selectedStaff,
  onSelectStaff,
  teamNoun,
  services,
  vertical,
  category,
  featuredServiceIds,
  catalogTitle,
  catalogLayout,
  selectedService,
  onSelectService,
  beautyBook,
  beautyPublic,
  wellnessPublic,
  retailEnabled,
  retailTitle,
  retailProducts,
  retailCartQty,
  onAddRetailToBag,
  onChangeRetailQty,
  wellnessSlug,
  aiOn,
  onBook,
  onChat,
  pickServiceHint,
  cancelWindowHours,
  giftComingSoonNote,
  designShowcase,
}: {
  density?: PublicBookLayoutDensity;
  staffForward: boolean;
  staff: PublicStaffRow[];
  selectedStaff: string;
  onSelectStaff: (id: string) => void;
  teamNoun: string;
  services: PublicServiceRow[];
  vertical?: string | null;
  category?: string | null;
  featuredServiceIds?: string[] | null;
  catalogTitle: string;
  catalogLayout: "list" | "beauty-grid" | "wellness-grid";
  selectedService: PublicServiceRow | null;
  onSelectService: (service: PublicServiceRow) => void;
  /** Any beauty tenant on /b — canvas + grid (not presentation chrome). */
  beautyBook: boolean;
  beautyPublic: boolean;
  wellnessPublic: boolean;
  retailEnabled: boolean;
  retailTitle: string;
  retailProducts: PublicRetailProduct[];
  retailCartQty: (productId: string) => number;
  onAddRetailToBag: (product: PublicRetailProduct) => void;
  onChangeRetailQty: (productId: string, quantity: number) => void;
  wellnessSlug: string;
  aiOn: boolean;
  onBook: () => void;
  onChat?: () => void;
  pickServiceHint: boolean;
  cancelWindowHours?: number | null;
  giftComingSoonNote?: string | null;
  designShowcase?: PublicDesignShowcaseItem[];
}) {
  const productCount = retailProducts.length;
  const density =
    densityProp ??
    resolvePublicBookLayoutDensity({
      staffCount: staff.length,
      serviceCount: services.length,
      productCount,
      staffPickerEnabled: staffForward,
      shopEnabled: retailEnabled,
    });

  const showTeam = staffForward && staff.length >= 2;
  const showShop = retailEnabled && productCount > 0;
  const useRail = density.shopPlacement === "rail" && (beautyBook || wellnessPublic);
  const usePresentationShell = beautyBook || wellnessPublic;

  const showFlash = vertical === "body-art" && (designShowcase?.length ?? 0) > 0;

  const teamBlock = showTeam ? (
    <PublicStaffStrip
      staff={staff}
      selectedStaffId={selectedStaff}
      onSelect={onSelectStaff}
      teamNoun={teamNoun}
      pickerMode={density.staffPicker}
    />
  ) : null;

  const teamSection =
    showTeam && density.staffPicker === "collapsible" ? (
      <SettingsDisclosure
        title={`Prefer someone on the team?`}
        description={`Optional — ${staff.length} ${teamNoun.toLowerCase()} available`}
        defaultOpen={false}
        data-testid="public-team-collapsible"
      >
        <div className="pt-3">{teamBlock}</div>
      </SettingsDisclosure>
    ) : (
      teamBlock
    );

  const shopBlock = (placement: "rail" | "section") =>
    showShop ? (
      <PublicBeautyShop
        title={retailTitle}
        products={retailProducts}
        cartQtyForProduct={retailCartQty}
        onAddToBag={onAddRetailToBag}
        onChangeQty={onChangeRetailQty}
        variant={placement === "section" ? "storefront" : "inline"}
        initialVisible={density.productPreviewLimit}
      />
    ) : null;

  return (
    <div
      id="public-service-menu"
      className={cn(
        "public-book-canvas",
        pickServiceHint && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background rounded-xl",
      )}
      data-testid="public-book-canvas"
      data-catalog-mode={density.catalogMode}
      data-section-nav={density.showSectionNav ? "true" : "false"}
      data-shop-placement={density.shopPlacement}
    >
      {density.showSectionNav ? (
        <PublicBookSectionNav
          sections={density.sections}
          vertical={vertical}
          counts={{
            treatments: services.length,
            team: showTeam ? staff.length : undefined,
            shop: showShop ? productCount : undefined,
          }}
        />
      ) : null}

      <div
        className={cn(
          useRail && "lg:grid lg:grid-cols-[minmax(0,1fr)_min(17rem,24rem)] lg:gap-10 lg:items-start",
        )}
      >
        <div className="public-book-primary space-y-10 min-w-0">
          {showFlash ? (
            <PublicBodyArtFlashGallery items={designShowcase!} />
          ) : null}
          <section id="public-book-treatments" className="scroll-mt-16">
            {!density.teamAfterCatalog && teamSection ? (
              <div id="public-book-team" className="scroll-mt-16 mb-8">
                {teamSection}
              </div>
            ) : null}
            <PublicServiceCatalog
              services={services}
              vertical={vertical}
              featuredServiceIds={featuredServiceIds}
              catalogTitle={catalogTitle}
              layout={catalogLayout}
              selectedServiceId={beautyPublic ? selectedService?.id : undefined}
              catalogMode={density.catalogMode}
              onSelect={onSelectService}
            />
            {vertical === "fitness" && wellnessSlug ? (
              <PublicFitnessClassGrid slug={wellnessSlug} />
            ) : null}
          </section>

          {density.teamAfterCatalog && showTeam ? (
            <section id="public-book-team" className="scroll-mt-16">
              {teamSection}
            </section>
          ) : null}

          {!usePresentationShell ? (
            <>
              {density.shopPlacement === "rail" ? shopBlock("rail") : null}
              {giftComingSoonNote ? (
                <p
                  className="text-xs text-muted-foreground rounded-lg border border-dashed px-3 py-2"
                  data-testid="public-wellness-gift-soon"
                >
                  {giftComingSoonNote}
                </p>
              ) : null}
              <PublicCareNotes vertical={vertical} category={category} />
            </>
          ) : null}
        </div>

        {useRail ? (
          <aside className="public-book-rail min-w-0 mt-8 lg:mt-0 lg:sticky lg:top-[4.25rem] space-y-5">
            {wellnessPublic && isWellnessGiftPublicBookEnabled(vertical, category) ? (
              <PublicWellnessGiftPanel slug={wellnessSlug} />
            ) : null}
            {density.shopPlacement === "rail" ? shopBlock("rail") : null}
            <PublicBookBookingRail
              beautyBook={beautyBook}
              beautyPublic={beautyPublic}
              wellnessPublic={wellnessPublic}
              selectedService={selectedService}
              aiOn={aiOn}
              onBook={onBook}
              onChat={onChat}
              bookDisabled={!selectedService}
              pickServiceHint={pickServiceHint}
              cancelWindowHours={cancelWindowHours}
              vertical={vertical}
              category={category}
              giftComingSoonNote={giftComingSoonNote}
            />
          </aside>
        ) : null}
      </div>

      {density.shopPlacement === "section" && showShop ? (
        <section id="public-book-shop" className="scroll-mt-16 pt-4 border-t border-border/50">
          {shopBlock("section")}
        </section>
      ) : null}
    </div>
  );
}
