"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nth = exports.formatDate = exports.deepClone = exports.GetInBetween = exports.SubstringTo = void 0;
function SubstringTo(page, n, endKey) {
    let string = '';
    while (n < page.length && page[n] != endKey) {
        string += page[n];
        n++;
    }
    return string;
}
exports.SubstringTo = SubstringTo;
function GetInBetween(page, n, startKey, endKey, addKeyLength) {
    n = page.indexOf(startKey, n);
    if (n != -1) {
        if (addKeyLength) {
            n += startKey.length;
        }
        return SubstringTo(page, n, endKey);
    }
    return '';
}
exports.GetInBetween = GetInBetween;
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
exports.deepClone = deepClone;
function formatDate(dt) {
    return dt.toISOString().slice(0, 10).split('-').reverse().join('/');
}
exports.formatDate = formatDate;
function nth(d) {
    if (d > 3 && d < 21)
        return 'th';
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
exports.nth = nth;
//# sourceMappingURL=utils.js.map