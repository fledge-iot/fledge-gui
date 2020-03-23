export const POLLING_INTERVAL = 5000;   // milliseconds
export const MAX_INT_SIZE = 2147483647;
export const GRAPH_REFRESH_INTERVAL = 5000; // milliseconds
export const STATS_HISTORY_TIME_FILTER = '10'; // minutes
export const ASSET_READINGS_TIME_FILTER = 600; // seconds
export const COLOR_CODES = ['#3498DB', '#85C1E9', '#239B56', '#82E0AA', '#B03A2E', '#F1948A', '#FF8C00', '#FF0000',
  '#FF5733', '#34AEDB', '#FF6C32', '#8595E9', '#239B87', '#FF9D00', '#82D8E0', '#C79217', '#C75817',
  '#E058E5', '#A464A6', '#533754', '#1D081E', '#7C767C', '#937EE5', '#6442EC', '#5744A5', '#17112E', '#6B6A6E', '#251E40',
  '#5E8DBC', '#115DA9', '#0A7AE9', '#0ACCE9', '#1F6975', '#043840', '#C0F1F9', '#C0F9F1', '#137366', '#073731', '#637F7B',
  '#1EAC73', '#116644', '#DAF3E9', '#455F55', '#17A53D', '#09EE46', '#0C4B1D', '#272C28', '#9CBD16', '#D8FA4C', '#87954C',
];

export default class Utils {

  public static pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }

  /**
   * @param repeat_time interval to add left pad
   */
  public static leftPad(repeat_time: string) {
    if (repeat_time !== undefined) {  // server sends time in xh:mm:ss format if x = 0
      repeat_time = repeat_time.length === 7 ? repeat_time = '0' + repeat_time : repeat_time;
      return repeat_time;
    }
  }

  // Convert time in seconds
  public static convertTimeToSec(repeatTime: string, repeatDays?: number) {
    let seconds;
    const repeat_interval = repeatTime.split(':');
    if (repeatDays > 0) {
      seconds = (+repeatDays) * 86400 + (+repeat_interval[0]) * 60 * 60 + (+repeat_interval[1]) * 60 + (+repeat_interval[2]);
    } else {
      seconds = (+repeat_interval[0]) * 60 * 60 + (+repeat_interval[1]) * 60 + (+repeat_interval[2]);
    }
    return seconds;
  }

  public static secondsToDhms(totalSeconds) {
    totalSeconds = Number(totalSeconds);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor(((totalSeconds % 86400) % 3600) / 60);
    const roundOffSeconds = Math.floor(((totalSeconds % 86400) % 3600) % 60);
    const seconds = ((totalSeconds % 86400) % 3600) % 60;
    const formatedTime = Utils.pad(hours, 2, 0) + ':' + Utils.pad(minutes, 2, 0) + ':' + Utils.pad(seconds, 2, 0);
    const roundOffTime = Utils.pad(hours, 2, 0) + ':' + Utils.pad(minutes, 2, 0) + ':' + Utils.pad(roundOffSeconds, 2, 0);
    return {
      'days': days,
      'time': formatedTime,
      'roundOffTime': roundOffTime
    };
  }

  /**
     * To check valid supplied time range
     * @param time in seconds
     */
  public static not_between(time) {
    if (time === undefined || time === '') {
      return true;
    }
    // To check if Time in 00:00:00, 23:59:59 range
    const timeUnits = time.split(':');
    const hh = timeUnits[0];
    const mm = timeUnits[1];
    const ss = timeUnits[2];
    if ((+hh) < 0 || (+hh) > 23) {
      return true;
    }
    if ((+mm) < 0 || (+mm) > 59) {
      return true;
    }
    if ((+ss) < 0 || (+ss) > 59) {
      return true;
    }
    const totalSec = (+hh * 60 * 60) + (+mm * 60) + (+ss);
    return totalSec < 0 || totalSec >= 86400;
  }

  public static getCurrentDate() {
    return Date.now();
  }

  public static getTimeWindow(index: number) {
    const timeWindows = {
      '1/100,000 secs': 0.00001,
      '1/50,000 secs': 0.00002,
      '1/20,000 secs': 0.00005,
      '1/10,000 secs': 0.0001,
      '1/5,000 secs': 0.0002,
      '1/2,000 secs': 0.0005,
      '1/1,000 secs': 0.001,
      '1/500 secs': 0.002,
      '1/200 secs': 0.005,
      '1/100 secs': 0.01,
      '1/50 secs': 0.02,
      '1/20 secs': 0.05,
      '1/10 secs': 0.1,
      '1/5 secs': 0.2,
      '1/2 secs': 0.5,
      '1 secs': 1,
      '2 secs': 2,
      '5 secs': 5,
      '10 secs': 10,
      '30 secs': 30,
      '1 min': 60,
      '2 mins': 120,
      '5 mins': 300,
      '10 mins': 600,
      '30 mins': 1800,
      '1 hour': 3600,
      '2 hours': 7200,
      '3 hours': 10800,
      '6 hours': 21600,
      '12 hours': 43200,
      '1 day': 86400,
      '2 days': 172800,
      '4 days': 345600,
      '1 week': 604800,
      '2 weeks': 1209600,
      '1 month': 2592000,
      '2 months': 5184000,
      '6 months': 15552000,
      '1 year': 31104000
    };
    const key = Object.keys(timeWindows)[index];
    const value = Object.values(timeWindows)[index];
    const size = Object.keys(timeWindows).length;
    return { key, value, size };
  }

}
