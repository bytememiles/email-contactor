import { ScheduledSendTime } from '@/types/job';
import { ProcessedReceiver } from '@/types/receiver';

/**
 * Calculate optimal send time (default 10 AM local time) for each recipient based on timezone
 */
export function calculateSendTimes(
  receivers: ProcessedReceiver[],
  baseDate: Date = new Date(),
  sendHour: number = 10,
  sendMinute: number = 0
): ScheduledSendTime[] {
  // Group receivers by timezone
  const timezoneGroups = new Map<string, string[]>();

  receivers.forEach((receiver) => {
    if (receiver.isValid && receiver.timezone) {
      const tz = receiver.timezone;
      if (!timezoneGroups.has(tz)) {
        timezoneGroups.set(tz, []);
      }
      timezoneGroups.get(tz)!.push(receiver.id);
    }
  });

  // Calculate 10 AM local time for each timezone
  const scheduledTimes: ScheduledSendTime[] = [];

  timezoneGroups.forEach((receiverIds, timezone) => {
    try {
      // Get current date/time in the target timezone
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const parts = formatter.formatToParts(now);
      const year = parseInt(parts.find((p) => p.type === 'year')?.value || '0');
      const month =
        parseInt(parts.find((p) => p.type === 'month')?.value || '0') - 1;
      const day = parseInt(parts.find((p) => p.type === 'day')?.value || '0');

      // Create date for specified time in the target timezone
      // We'll create it in UTC and then convert
      const sendTime = new Date(
        Date.UTC(year, month, day, sendHour, sendMinute, 0, 0)
      );

      // Adjust for timezone offset
      const tzOffset = getTimezoneOffset(timezone, sendTime);
      sendTime.setUTCHours(sendHour - tzOffset, sendMinute);

      // If the calculated time is in the past, schedule for tomorrow
      if (sendTime < now) {
        sendTime.setUTCDate(sendTime.getUTCDate() + 1);
      }

      scheduledTimes.push({
        timezone,
        sendTime,
        receiverIds,
      });
    } catch (error) {
      console.error(
        `Error calculating send time for timezone ${timezone}:`,
        error
      );
      // Fallback: schedule for specified time UTC tomorrow
      const fallbackTime = new Date(baseDate);
      fallbackTime.setUTCDate(fallbackTime.getUTCDate() + 1);
      fallbackTime.setUTCHours(sendHour, sendMinute, 0, 0);

      scheduledTimes.push({
        timezone,
        sendTime: fallbackTime,
        receiverIds,
      });
    }
  });

  // Sort by send time
  scheduledTimes.sort((a, b) => a.sendTime.getTime() - b.sendTime.getTime());

  return scheduledTimes;
}

/**
 * Get timezone offset in hours for a given timezone at a specific date
 */
function getTimezoneOffset(timezone: string, date: Date): number {
  try {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(
      date.toLocaleString('en-US', { timeZone: timezone })
    );
    return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
  } catch {
    return 0;
  }
}

/**
 * Get the earliest send time from scheduled times
 */
export function getEarliestSendTime(
  scheduledTimes: ScheduledSendTime[]
): Date | null {
  if (scheduledTimes.length === 0) return null;
  return scheduledTimes[0].sendTime;
}

/**
 * Check if it's time to send to a receiver based on their timezone and target send time
 * @param receiverTimezone The receiver's timezone (e.g., "America/New_York")
 * @param sendTime The target send time in HH:mm format (e.g., "10:00")
 * @param now Optional current time (defaults to new Date())
 * @returns true if it's time to send (at or past target time on the same day), false otherwise
 */
export function isTimeToSend(
  receiverTimezone: string,
  sendTime: string,
  now: Date = new Date()
): boolean {
  try {
    // Parse send time (HH:mm format)
    const [targetHour, targetMinute] = sendTime.split(':').map(Number);

    if (isNaN(targetHour) || isNaN(targetMinute)) {
      console.warn(`Invalid sendTime format: ${sendTime}`);
      return false;
    }

    // Get current time in the receiver's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: receiverTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const currentHour = parseInt(
      parts.find((p) => p.type === 'hour')?.value || '0'
    );
    const currentMinute = parseInt(
      parts.find((p) => p.type === 'minute')?.value || '0'
    );

    // Calculate total minutes for comparison
    const targetTotalMinutes = targetHour * 60 + targetMinute;
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    // Check if current time is at or past target time on the same day
    // We send if we're at or past the target time (allows for polling delays)
    // The job's scheduledTime ensures we only start checking when at least one receiver's time has arrived
    const isTimeToSend = currentTotalMinutes >= targetTotalMinutes;

    return isTimeToSend;
  } catch (error) {
    console.error(
      `Error checking send time for timezone ${receiverTimezone}:`,
      error
    );
    return false;
  }
}
