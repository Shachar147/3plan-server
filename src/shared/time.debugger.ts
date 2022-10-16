// constructor function
export class TimeDebugger {
  // class constructor, equivalent to
  // the function body of a constructor
  private timeDebug = 0;
  private timeDebuggerLastDate: number;

  constructor() {}

  timeDebugMessage(message) {
    if (!this.timeDebug) return;

    let timing = 0;
    if (this.timeDebuggerLastDate != undefined) {
      timing = Date.now() - this.timeDebuggerLastDate;
    }
    console.log(this.msToTime(timing), message);
    this.timeDebuggerLastDate = Date.now();
  }

  msToTime(duration) {
    const milliseconds = parseInt(String((duration % 1000) / 100)),
      seconds = Math.floor((duration / 1000) % 60),
      minutes = Math.floor((duration / (1000 * 60)) % 60),
      hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    const parts = [];
    if (hours && hours > 0) {
      const h = hours < 10 ? '0' + hours : hours;
      parts.push(`${h}h`);
    }

    if (minutes && minutes > 0) {
      const m = minutes < 10 ? '0' + minutes : minutes;
      parts.push(`${m}m`);
    }

    if (seconds && seconds > 0) {
      const s = seconds < 10 ? '0' + seconds : seconds;
      parts.push(`${s}s`);
    }

    if (milliseconds && milliseconds > 0) {
      const ms = milliseconds < 10 ? '0' + milliseconds : milliseconds;
      parts.push(`${ms}ms`);
    }

    return parts.join(' ');
  }
}
