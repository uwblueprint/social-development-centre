import { loadNewCount, loadPage, openPanel, setDone } from "./actions";
import type { NotificationsSource } from "./types";

/** The admin portal's notifications: server actions against the database. */
export const serverNotifications: NotificationsSource = { loadNewCount, openPanel, loadPage, setDone };
