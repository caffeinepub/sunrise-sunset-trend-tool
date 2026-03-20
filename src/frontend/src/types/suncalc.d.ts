declare module "suncalc" {
  interface SunTimes {
    sunrise: Date;
    sunset: Date;
    solarNoon: Date;
    nauticalDawn: Date;
    nauticalDusk: Date;
    dawn: Date;
    dusk: Date;
    goldenHour: Date;
    goldenHourEnd: Date;
    night: Date;
    nightEnd: Date;
    nadir: Date;
  }

  interface SunPosition {
    altitude: number;
    azimuth: number;
  }

  function getTimes(date: Date, lat: number, lon: number): SunTimes;
  function getPosition(date: Date, lat: number, lon: number): SunPosition;
}
