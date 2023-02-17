export function SubstringTo(page: string, n: number, endChar: string) {
  let string = '';
  while (n < page.length && page[n] != endChar) {
    string += page[n];
    n++;
  }
  return string;
}

export function SubstringToPhaseSubstringToPhase(page, n, endKey) {
  let string = '';
  let lastIndex = page.indexOf(endKey, n+1);
  if (lastIndex === -1) lastIndex = page.length -1;

  while (n < page.length && n < lastIndex) {
    string += page[n];
    n++;
  }
  return [string, n];
}

export function GetInBetween(page, n, startKey, endKey, addKeyLength) {
  n = page.indexOf(startKey, n);
  if (n != -1) {
    if (addKeyLength) {
      n += startKey.length;
    }
    return SubstringTo(page, n, endKey);
  }
  return '';
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function formatDate(dt) {
  return dt.toISOString().slice(0, 10).split('-').reverse().join('/');
}

export function nth(d) {
  if (d > 3 && d < 21) return 'th';
  switch (d % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}
export function getTimestampInSeconds () {
  return Math.floor(Date.now() / 1000)
}
