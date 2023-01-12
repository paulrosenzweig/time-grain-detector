var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var time_grain_detector_exports = {};
__export(time_grain_detector_exports, {
  default: () => detectTimeGrain
});
module.exports = __toCommonJS(time_grain_detector_exports);
module.globals = {};
const grains = [
  {
    grain: { unit: "millisecond", count: 1 },
    isAligned: (dates) => true
  },
  {
    grain: { unit: "second", count: 1 },
    isAligned: (dates) => dates.every((d) => d.getUTCMilliseconds() === 0)
  },
  {
    grain: { unit: "minute", count: 1 },
    isAligned: (dates) => dates.every((d) => d.getUTCSeconds() === 0)
  },
  {
    grain: { unit: "minute", count: 5 },
    isAligned: (dates) => dates.every((d) => d.getUTCMinutes() % 5 === 0)
  },
  {
    grain: { unit: "minute", count: 10 },
    isAligned: (dates) => dates.every((d) => d.getUTCMinutes() % 10 === 0)
  },
  {
    grain: { unit: "hour", count: 1 },
    isAligned: (dates) => new Set(dates.map((d) => d.getUTCMinutes())).size === 1
  },
  {
    grain: { unit: "day", count: 1 },
    isAligned: (dates) => {
      const hours = new Set(dates.map((d) => d.getUTCHours()));
      if (hours.size === 1)
        return true;
      if (hours.size > 2)
        return false;
      const hoursForDate = /* @__PURE__ */ new Map();
      for (const date of dates) {
        const hour = date.getUTCHours();
        const key = [date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()].join("-");
        if (hoursForDate.has(key) && Math.abs(hoursForDate.get(key) - hour) !== 23) {
          return false;
        }
        hoursForDate.set(key, hour);
      }
      let [h1, h2] = hours;
      const gap = Math.abs(h1 - h2);
      return gap === 1 || gap === 23;
    }
  },
  {
    grain: { unit: "week", count: 1 },
    isAligned: (dates) => new Set(dates.map((d) => d.getUTCDay())).size === 1,
    isSkippable: true
  },
  {
    grain: { unit: "month", count: 1 },
    // This isAligned checks if the date falls on the first day of the month in some local time.
    isAligned: (dates) => (
      // East of UTC, the UTC date is the 1st
      dates.every((d) => d.getUTCDate() === 1) || // West of UTC, the UTC date is the last day of the previous month.
      // Shifting the date forward by one day will make it the 1st.
      dates.every((d) => nextDay(d).getUTCDate() === 1) || // The final edge case is for timezones that have daylight savings and are just west of UTC.
      // These, like Africa/El_Aaiun, sometimes have a UTC date on the 1st and sometimes on the last day of the previous month.
      // We can detect this by checking if the next hour is the 1st.
      dates.every((d) => nextHour(d).getUTCDate() === 1)
    )
  },
  {
    grain: { unit: "month", count: 3 },
    // The reason for the three checks below is the same as the checks in month.
    isAligned: (dates) => dates.every((d) => d.getUTCMonth() % 3 === 0) || dates.every((d) => nextDay(d).getUTCMonth() % 3 === 0) || dates.every((d) => nextHour(d).getUTCMonth() % 3 === 0)
  },
  // Years and decades don't need the third check because they are always looking at January 1st.
  {
    grain: { unit: "year", count: 1 },
    isAligned: (dates) => dates.every((d) => d.getUTCMonth() === 0) || dates.every((d) => nextDay(d).getUTCMonth() === 0)
  },
  {
    grain: { unit: "year", count: 10 },
    isAligned: (dates) => dates.every((d) => d.getUTCFullYear() % 10 === 0) || dates.every((d) => nextDay(d).getUTCFullYear() % 10 === 0)
  },
  {
    // This empty grain exists so that we return the largest possible grain if all are aligned. 
    isAligned: (dates) => false
  }
];
function detectTimeGrain(dateStrings) {
  const dates = dateStrings.map((ds) => {
    const d = new Date(ds);
    if (d.toString() === "Invalid Date") {
      throw new Error(`Invalid date: ${ds}`);
    }
    return d;
  });
  const firstMismatch = grains.findIndex((g) => !g.isAligned(dates));
  const firstMismatchWithSkips = grains.findIndex((g) => !g.isSkippable && !g.isAligned(dates));
  const mismatch = firstMismatchWithSkips > firstMismatch + 1 ? firstMismatchWithSkips : firstMismatch;
  return grains[mismatch - 1].grain;
}
function nextDay(date) {
  const newDate = new Date(date);
  newDate.setUTCDate(newDate.getUTCDate() + 1);
  return newDate;
}
function nextHour(date) {
  const newDate = new Date(date);
  newDate.setUTCHours(newDate.getUTCHours() + 1);
  return newDate;
}
