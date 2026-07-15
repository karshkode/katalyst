export const brandTokens = {
  primary: "#04243E",
  secondary: "#339999",
  success: "#3e8d63",
  danger: "#BC3F41",
  warning: "#945707",
  ink: "#13101c",
  light: "#f8f9fa",
} as const;

export type BrandTokens = typeof brandTokens;
