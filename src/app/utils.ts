import colorLib from '@kurkle/color';

export const POLLING_INTERVAL = 5000;   // milliseconds
export const MAX_INT_SIZE = 2147483647;
export const GRAPH_REFRESH_INTERVAL = 5000; // milliseconds
export const STATS_HISTORY_TIME_FILTER = '10'; // minutes
export const ASSET_READINGS_TIME_FILTER = 600; // seconds
export const REGEX_PATTERN = '[^\x22\x27]+';

export const SUPPORTED_SERVICE_TYPES = ["Core", "Storage", "Southbound", "Northbound", "Notification", "Management", "Dispatcher", "BucketStorage"];

export const CHART_COLORS = {
  blue: 'rgb(31, 119, 180)',
  orange: 'rgb(255, 127, 14)',
  green: 'rgb(44, 160, 44)',
  red: 'rgb(214, 39, 40)',
  purple: 'rgb(148, 103, 189)',
  brown: 'rgb(140, 86, 75)',
  pink: 'rgb(227, 119, 194)',
  grey: 'rgb(127, 127, 127)',
  olive: 'rgb(188, 189, 34)',
  cyan: 'rgb(23, 190, 207)',
};

const NAMED_COLORS = [
  CHART_COLORS.blue,
  CHART_COLORS.orange,
  CHART_COLORS.green,
  CHART_COLORS.red,
  CHART_COLORS.purple,
  CHART_COLORS.brown,
  CHART_COLORS.pink,
  CHART_COLORS.grey,
  CHART_COLORS.olive,
  CHART_COLORS.cyan,
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
      console.log('time', repeat_time);
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
    console.log('Total sec', totalSec);
    return totalSec < 0 || totalSec >= 86400;
  }

  public static getCurrentDate() {
    return Date.now();
  }

  public static transparentize(value: string, alpha: number) {
    return colorLib(value).alpha(alpha).rgbString();
  }

  public static namedColor(index: number) {
    return index < 10 ? NAMED_COLORS[index % NAMED_COLORS.length] : this.generateDarkColorRgb();
  }

  public static generateDarkColorRgb() {
    const red = Math.floor(Math.random() * 256 / 2);
    const green = Math.floor(Math.random() * 256 / 2);
    const blue = Math.floor(Math.random() * 256 / 2);
    return `rgb(${red},${green},${blue})`;
  }

}
