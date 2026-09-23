import type { Metadata } from "next";
import { PricingContent } from "@/components/pricing/pricing-content";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return <PricingContent />;
}
