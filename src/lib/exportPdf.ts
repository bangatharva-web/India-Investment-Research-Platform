import type { Report } from "./mockReport";

export function exportReportPdf(r: Report) {
  const originalTitle = document.title;
  document.title = `${r.profile.ticker}_Investment_Research`;

  setTimeout(() => {
    window.print();
    document.title = originalTitle;
  }, 300);
}