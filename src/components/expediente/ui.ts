/** Class strings shared by the expediente sections. */
export { field, label, primaryButton, textLink } from "@/components/signin/styles";

export const card = "rounded-3xl bg-white p-5 ring-1 ring-borde sm:p-6";
export const sectionTitle = "text-lg font-bold";
export const hint = "mt-1 text-sm text-gris";
export const fieldError = "mt-1 text-sm font-medium text-marca-3";
export const outlineButton =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 font-bold text-tinta ring-2 ring-inset ring-tinta hover:bg-tinta hover:text-white disabled:opacity-50 sm:w-auto";

/** The id each field's wrapper gets, so a 400 from /enviar can scroll to it. */
export const fieldId = (name: string) => `campo-${name}`;
