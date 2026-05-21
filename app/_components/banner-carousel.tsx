"use client";

import Link from "next/link";
import { useTransition } from "react";
import { registrarClickBanner } from "../_actions/banners";

type BannerCard = {
  id: string;
  titulo: string;
  subtitulo: string | null;
  imagemUrl: string | null;
  linkUrl: string | null;
};

export function BannerCarousel({ banners }: { banners: BannerCard[] }) {
  const [, start] = useTransition();
  if (banners.length === 0) return null;

  return (
    <div className="-mx-6 overflow-x-auto px-6 [scrollbar-width:thin]">
      <div className="flex snap-x snap-mandatory gap-4 pb-2">
        {banners.map((b) => (
          <BannerItem
            key={b.id}
            banner={b}
            onClick={() => start(() => registrarClickBanner(b.id))}
          />
        ))}
      </div>
    </div>
  );
}

function BannerItem({
  banner,
  onClick,
}: {
  banner: BannerCard;
  onClick: () => void;
}) {
  const card = (
    <article
      onClick={onClick}
      className="group flex w-[80vw] max-w-md shrink-0 snap-start cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 sm:w-[28rem]"
    >
      {banner.imagemUrl ? (
        <div
          className="h-44 w-full bg-cover bg-center transition group-hover:scale-[1.02]"
          style={{ backgroundImage: `url(${banner.imagemUrl})` }}
          aria-hidden
        />
      ) : (
        <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-brand-orange to-brand-blue text-3xl">
          📣
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-semibold">{banner.titulo}</h3>
        {banner.subtitulo && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {banner.subtitulo}
          </p>
        )}
        {banner.linkUrl && (
          <span className="mt-auto inline-flex w-fit items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary group-hover:bg-primary group-hover:text-primary-foreground">
            Saber mais →
          </span>
        )}
      </div>
    </article>
  );

  if (!banner.linkUrl) return card;

  if (banner.linkUrl.startsWith("http")) {
    return (
      <a
        href={banner.linkUrl}
        target="_blank"
        rel="noreferrer"
        className="contents"
      >
        {card}
      </a>
    );
  }
  return (
    <Link href={banner.linkUrl} className="contents">
      {card}
    </Link>
  );
}
