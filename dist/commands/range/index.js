"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const base_command_js_1 = require("../../base-command.js");
const index_js_1 = require("../../db/index.js");
const entries_js_1 = require("../../lib/entries.js");
const nutrients_js_1 = require("../../lib/nutrients.js");
const date_js_1 = require("../../lib/date.js");
class Range extends base_command_js_1.BaseCommand {
    static description = 'Summary over a date range: totals, averages, and per-day breakdown';
    static args = {
        from: core_1.Args.string({ description: 'Start date (YYYY-MM-DD)', required: true }),
        to: core_1.Args.string({ description: 'End date (YYYY-MM-DD)', required: true }),
    };
    async run() {
        const { args } = await this.parse(Range);
        const from = (0, date_js_1.parseDate)(args.from);
        const to = (0, date_js_1.parseDate)(args.to);
        const db = (0, index_js_1.getDb)();
        const dates = (0, date_js_1.dateRange)(from, to);
        const days = [];
        const allNutrients = [];
        for (const date of dates) {
            const entries = await (0, entries_js_1.getEntriesForDate)(db, date);
            const nutrients = (0, nutrients_js_1.sumNutrients)(entries.map((e) => e.nutrients));
            const calories = (0, entries_js_1.sumEntryCalories)(entries);
            allNutrients.push({ ...nutrients, calories });
            days.push({ date, calories, nutrients });
        }
        const totalCalories = Number(allNutrients.reduce((s, n) => s + n.calories, 0).toFixed(2));
        const totals = (0, nutrients_js_1.sumNutrients)(allNutrients);
        const averages = (0, nutrients_js_1.averageNutrients)(allNutrients, dates.length);
        return {
            from,
            to,
            days: dates.length,
            totals: { ...totals, calories: totalCalories },
            averages,
            daily: days,
        };
    }
}
exports.default = Range;
//# sourceMappingURL=index.js.map