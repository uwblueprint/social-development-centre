/** Copy for the offline state: why an email can't be opened, and why each change is unavailable. */
export const OFFLINE_OPEN_REASON = "You're offline, so this email can't be opened.";

export type OfflineAction = "approve" | "resend" | "delete" | "save your changes" | "edit" | "reset";

/** The reason an action is disabled while offline: "You're offline. Reconnect to approve." */
export const offlineReason = (action: OfflineAction) => `You're offline. Reconnect to ${action}.`;
