import { component$, Slot } from "@builder.io/qwik";

export default component$(() => {
  return (
    <div class="min-h-screen bg-background text-on-background font-body selection:bg-secondary-container selection:text-on-secondary-container">
      <Slot />
    </div>
  );
});

