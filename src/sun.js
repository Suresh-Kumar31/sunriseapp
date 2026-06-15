// Offline sunrise/sunset calculation based on NOAA's public algorithm.
// Accuracy is generally within a few minutes for normal latitudes.
const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

function normalize360(v) {
  v = v % 360;
  return v < 0 ? v + 360 : v;
}

function normalize24(v) {
  v = v % 24;
  return v < 0 ? v + 24 : v;
}

function calcUTC(date, latitude, longitude, isSunrise, zenith = 90.833) {
  const N = dayOfYear(date);
  const lngHour = longitude / 15;
  const t = N + ((isSunrise ? 6 : 18) - lngHour) / 24;
  const M = (0.9856 * t) - 3.289;
  let L = M + (1.916 * Math.sin(DEG * M)) + (0.020 * Math.sin(DEG * 2 * M)) + 282.634;
  L = normalize360(L);

  let RA = RAD * Math.atan(0.91764 * Math.tan(DEG * L));
  RA = normalize360(RA);
  const Lquadrant = Math.floor(L / 90) * 90;
  const RAquadrant = Math.floor(RA / 90) * 90;
  RA = (RA + (Lquadrant - RAquadrant)) / 15;

  const sinDec = 0.39782 * Math.sin(DEG * L);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosH = (Math.cos(DEG * zenith) - (sinDec * Math.sin(DEG * latitude))) / (cosDec * Math.cos(DEG * latitude));

  if (cosH > 1) return null; // sun never rises
  if (cosH < -1) return null; // sun never sets

  let H = isSunrise ? 360 - (RAD * Math.acos(cosH)) : RAD * Math.acos(cosH);
  H = H / 15;
  const T = H + RA - (0.06571 * t) - 6.622;
  return normalize24(T - lngHour);
}

function utcHourToLocalDate(date, utcHour) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const hour = Math.floor(utcHour);
  const minute = Math.floor((utcHour - hour) * 60);
  const second = Math.round((((utcHour - hour) * 60) - minute) * 60);
  return new Date(Date.UTC(y, m, d, hour, minute, second));
}

export function getSunTimes(date, latitude, longitude) {
  const sunriseUTC = calcUTC(date, latitude, longitude, true);
  const sunsetUTC = calcUTC(date, latitude, longitude, false);
  return {
    sunrise: sunriseUTC == null ? null : utcHourToLocalDate(date, sunriseUTC),
    sunset: sunsetUTC == null ? null : utcHourToLocalDate(date, sunsetUTC)
  };
}

export function formatTime(date) {
  if (!date) return 'Not available';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(date) {
  return date.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}
