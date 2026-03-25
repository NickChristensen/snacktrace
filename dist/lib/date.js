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
function parseDate(input) {
    if (input === 'today')
        return today();
    if (input === 'yesterday')
        return (0, date_fns_1.format)((0, date_fns_1.sub)(new Date(), { days: 1 }), exports.DATE_FORMAT);
    const parsed = (0, date_fns_1.parse)(input, exports.DATE_FORMAT, new Date());
    if (!(0, date_fns_1.isValid)(parsed)) {
        throw new Error(`Invalid date "${input}". Use YYYY-MM-DD, "today", or "yesterday".`);
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