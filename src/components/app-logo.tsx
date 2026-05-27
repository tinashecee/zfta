import { component$ } from "@builder.io/qwik";
import { APP_NAME } from "~/lib/app-branding";

export type AppLogoProps = {
  class?: string;
  imgClass?: string;
  alt?: string;
  /** When set, wraps the image in a link (e.g. home or portal root). */
  href?: string;
  size?: "sm" | "md" | "lg";
};

const sizeHeights: Record<NonNullable<AppLogoProps["size"]>, string> = {
  sm: "h-7 max-h-7 sm:h-8 sm:max-h-8",
  md: "h-8 max-h-8 sm:h-10 sm:max-h-10",
  lg: "h-10 max-h-10 sm:h-12 sm:max-h-12",
};

export const AppLogo = component$<AppLogoProps>((props) => {
  const size = props.size ?? "md";
  const img = (
    <img
      alt={props.alt ?? APP_NAME}
      class={[sizeHeights[size], "w-auto object-contain object-left", props.imgClass].filter(Boolean).join(" ")}
      decoding="async"
      height={48}
      loading="eager"
      src="/logo.png"
      width={192}
    />
  );

  const wrapClass = [
    "inline-flex shrink-0 items-center",
    props.href
      ? "rounded focus-visible:outline focus-visible:ring-2 focus-visible:ring-amber-400/40"
      : "",
    props.class,
  ]
    .filter(Boolean)
    .join(" ");

  if (props.href) {
    return (
      <a class={wrapClass} href={props.href}>
        {img}
      </a>
    );
  }
  return <span class={wrapClass}>{img}</span>;
});
