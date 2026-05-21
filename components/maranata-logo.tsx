import Image from "next/image";

type Props = {
  size?: number;
  className?: string;
  variant?: "pomba" | "vertical";
};

/**
 * Logo oficial IME Maranata.
 * - "pomba" (default): símbolo compacto pra header/sidebar (1:1)
 * - "vertical": logo completo com nome (1:1.4, pra hero/login)
 *
 * Assets em public/branding/, copiados do festa-amor-maranata (fonte
 * canônica da família). Substitui o gradient bullet `from-brand-orange
 * to-brand-blue` que era placeholder.
 */
export function MaranataLogo({ size = 28, className, variant = "pomba" }: Props) {
  if (variant === "vertical") {
    return (
      <Image
        src="/branding/maranata-vertical-sem-tagline.png"
        alt="IME Maranata"
        width={size}
        height={Math.round(size * 1.4)}
        className={className}
        priority
      />
    );
  }
  return (
    <Image
      src="/branding/maranata-pomba-original.png"
      alt="IME Maranata"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
