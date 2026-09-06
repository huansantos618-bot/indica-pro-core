import logoAsset from "@/assets/indicapro-logo.png.asset.json";
import { cn } from "@/lib/utils";

export const LOGO_URL = logoAsset.url;

export function BrandLogo({
  className,
  withName = true,
  name = "IndicaPro",
}: {
  className?: string;
  withName?: boolean;
  name?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <img
        src={LOGO_URL}
        alt="Logo IndicaPro"
        className="size-8 rounded-lg object-contain"
        loading="eager"
      />
      {withName ? <span className="truncate font-semibold tracking-tight">{name}</span> : null}
    </span>
  );
}
