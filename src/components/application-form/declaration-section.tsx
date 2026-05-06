import { component$ } from "@builder.io/qwik";

export type DeclarationSectionProps = {
  /** Label text after the statutory checkbox. */
  label?: string;
};

export const DeclarationSection = component$<DeclarationSectionProps>((props) => {
  const label =
    props.label ??
    "I declare that the information and documents provided are true and complete to the best of my knowledge, and I understand that false statements may result in rejection or withdrawal of authorization.";
  return (
    <div class="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6">
      <label class="flex cursor-pointer items-start gap-3">
        <input class="mt-1 rounded border-outline text-primary focus:ring-primary" name="declaration_accepted" type="checkbox" />
        <span class="text-sm text-on-surface-variant leading-relaxed">{label}</span>
      </label>
    </div>
  );
});
