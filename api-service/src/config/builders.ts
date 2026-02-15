import type { BuilderConfig } from "../types.js";

export const builders: Record<string, BuilderConfig> = {
  barnhaus: {
    name: "Barnhaus Steel Builders",
    webhookUrl: "https://crm.empowerbuilding.ai/api/leads/webhook",
    webhookApiKey: process.env.BARNHAUS_WEBHOOK_API_KEY ?? "",
    brandColor: "#B8860B",
  },
  cw: {
    name: "CW Custom Builders",
    webhookUrl: "https://crm.cw-custombuilders.com/api/leads/webhook",
    brandColor: "#C8A962",
  },
  showcase: {
    name: "Showcase Builders",
    webhookUrl: "https://crm.showcasebuilders.com/api/leads/webhook",
    brandColor: "#C5A572",
  },
};
