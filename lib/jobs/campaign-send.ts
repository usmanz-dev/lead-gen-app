/** One job per recipient — the producer (launchCampaign) computes each
 * recipient's send delay up front so the queue naturally paces sends
 * within the sender's daily limit; see
 * worker/processors/campaign-send.ts for the live safety-net recheck. */
export interface CampaignSendJobData {
  campaignLeadId: string;
}
