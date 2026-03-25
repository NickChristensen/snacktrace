"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATE_FORMAT = void 0;
exports.today = today;
exports.parseDate = parseDate;
exports.dateRange = dateRange;
const date_fns_1 = require("date-fns");
exports.DATE_FORMAT = 'yyyy-MM-dd';
function today() {
    return (0, date_fns_1.format)(new Date(), exports.DATE_FORMAT);
}
const RELATIVE_DATE = /^([+-]?)(\d+)([dwmy])$/i;
function applyRelativeOffset(amount, unit) {
    const duration = unit === 'd'
        ? { days: Math.abs(amount) }
        : unit === 'w'
            ? { weeks: Math.abs(amount) }
            : unit === 'm'
                ? { months: Math.abs(amount) }
                : unit === 'y'
                    ? { years: Math.abs(amount) }
                    : null;
    if (!duration) {
        throw new Error(`Unsupported relative unit "${unit}"`);
    }
    if (amount === 0) {
        return new Date();
    }
    return amount > 0 ? (0, date_fns_1.add)(new Date(), duration) : (0, date_fns_1.sub)(new Date(), duration);
}
function parseRelative(input) {
    const match = RELATIVE_DATE.exec(input);
    if (!match)
        return null;
    const [, sign, value, unit] = match;
    const quantity = Number(value);
    if (!Number.isFinite(quantity))
        return null;
    const amount = sign === '-' ? -quantity : quantity;
    return applyRelativeOffset(amount, unit.toLowerCase());
}
function parseDate(input) {
    const normalized = input.trim();
    const lower = normalized.toLowerCase();
    if (lower === 'today') {
        return today();
    }
    if (lower === 'yesterday') {
        return (0, date_fns_1.format)((0, date_fns_1.sub)(new Date(), { days: 1 }), exports.DATE_FORMAT);
    }
    const relative = parseRelative(lower);
    if (relative) {
        return (0, date_fns_1.format)(relative, exports.DATE_FORMAT);
    }
    const parsed = (0, date_fns_1.parse)(normalized, exports.DATE_FORMAT, new Date());
    if (!(0, date_fns_1.isValid)(parsed)) {
        throw new Error(`Invalid date "${input}". Use YYYY-MM-DD, "today", "yesterday", or a relative offset like "-1w".`);
    }
    return (0, date_fns_1.format)(parsed, exports.DATE_FORMAT);
}
function dateRange(from, to) {
    const start = (0, date_fns_1.parse)(from, exports.DATE_FORMAT, new Date());
    const end = (0, date_fns_1.parse)(to, exports.DATE_FORMAT, new Date());
    const dates = [];
    const current = new Date(start);
    while (current <= end) {
        dates.push((0, date_fns_1.format)(current, exports.DATE_FORMAT));
        current.setDate(current.getDate() + 1);
    }
    return dates;
}
//# sourceMappingURL=date.js.map