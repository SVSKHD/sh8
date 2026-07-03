/* Thin composable wrapper around the googleCalendar service's reactive
   connection state, for ergonomic use from components. */
import { connect, disconnect, googleCalendarConfigured, isConnected } from "../googleCalendar";

export function useGoogleCalendar() {
  return { isConnected, configured: googleCalendarConfigured, connect, disconnect };
}
