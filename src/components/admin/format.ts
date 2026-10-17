const DATE_TIME = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Lima",
});

export const formatDateTime = (date: Date) => DATE_TIME.format(date);

export const formatCount = (n: number) => n.toLocaleString("es-PE");

/** 51936282808 → +51 936 282 808. Other countries keep their digits after the plus sign. */
export function formatPhone(phone: string) {
  const peru = /^51(9\d{2})(\d{3})(\d{3})$/.exec(phone);
  return peru ? `+51 ${peru[1]} ${peru[2]} ${peru[3]}` : `+${phone}`;
}
