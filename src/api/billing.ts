import api from "./client";

export type BillingPlan = "free" | "pro" | "super";

export interface BillingOverview {
  plan?: BillingPlan;
  status?: string;
  expiresAt?: string | null;
  trialEndsAt?: string | null;
  subscription?: {
    _id?: string;
    plan?: BillingPlan;
    status?: string;
    expiresAt?: string | null;
  } | null;
  entitlements?: string[];
}

export interface CheckoutResult {
  authorizationUrl: string;
  reference: string;
}

export const getBillingOverviewService = async () => {
  const response = await api.get<{ data: BillingOverview }>("/billing");
  return response.data.data;
};

export const initializeBillingCheckoutService = async (
  plan: Exclude<BillingPlan, "free">,
  invitationCode?: string,
) => {
  const response = await api.post<{ data: CheckoutResult }>("/billing/checkout", {
    plan,
    billingInterval: "monthly",
    ...(invitationCode ? { invitationCode } : {}),
  });
  return response.data.data;
};

export const cancelSubscriptionService = async (subscriptionId: string) => {
  const response = await api.post(
    `/billing/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
  );
  return response.data;
};

export const getBillingManagementLinkService = async (
  subscriptionId: string,
) => {
  const response = await api.post<{ data: { link?: string; url?: string } }>(
    `/billing/subscriptions/${encodeURIComponent(subscriptionId)}/manage`,
  );
  return response.data.data;
};
