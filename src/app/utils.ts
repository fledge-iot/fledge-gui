import colorLib from '@kurkle/color';

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

export const CHART_COLORS = {
  blue: 'rgb(31, 119, 180)',
  tropicalblue: 'rgb(174, 199, 232)',
  orange: 'rgb(255, 127, 14)',
  macaroniorange: 'rgb(255, 187, 120)',
  green: 'rgb(44, 160, 44)',
  lightgreen: 'rgb(152, 223, 138)',
  red: 'rgb(214, 39, 40)',
  monalisared: 'rgb(255, 152, 150)',
  purple: 'rgb(148, 103, 189)',
  perfumepurple: 'rgb(197, 176, 213)',
  brown: 'rgb(140, 86, 75)',
  lightbrown: 'rgb(196, 156, 148)',
  pink: 'rgb(227, 119, 194)',
  cottoncandypink: 'rgb(247, 182, 210)',
  grey: 'rgb(127, 127, 127)',
  lightgray: 'rgb(199, 199, 199)',
  olive: 'rgb(188, 189, 34)',
  lightolive: 'rgb(219, 219, 141)',
  cyan: 'rgb(23, 190, 207)',
  lightcyan: 'rgb(158,218, 229)'
};

const NAMED_COLORS = [
  CHART_COLORS.blue,
  CHART_COLORS.tropicalblue,
  CHART_COLORS.orange,
  CHART_COLORS.macaroniorange,
  CHART_COLORS.green,
  CHART_COLORS.lightgreen,
  CHART_COLORS.red,
  CHART_COLORS.monalisared,
  CHART_COLORS.purple,
  CHART_COLORS.perfumepurple,
  CHART_COLORS.brown,
  CHART_COLORS.lightbrown,
  CHART_COLORS.pink,
  CHART_COLORS.cottoncandypink,
  CHART_COLORS.grey,
  CHART_COLORS.lightgray,
  CHART_COLORS.olive,
  CHART_COLORS.lightolive,
  CHART_COLORS.cyan,
  CHART_COLORS.lightcyan,
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

  public static transparentize(value, opacity: number) {
    let alpha = opacity === undefined ? 0.0 : 1 - opacity;
    return colorLib(value).alpha(alpha).rgbString();
  }

  public static namedColor(index) {
    return NAMED_COLORS[index % NAMED_COLORS.length];
  }

}
