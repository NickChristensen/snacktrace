"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const base_command_js_1 = require("../../base-command.js");
const index_js_1 = require("../../db/index.js");
const entries_js_1 = require("../../lib/entries.js");
const nutrients_js_1 = require("../../lib/nutrients.js");
const goals_js_1 = require("../../lib/goals.js");
const date_js_1 = require("../../lib/date.js");
class RangeGoals extends base_command_js_1.BaseCommand {
    static description = 'Goal progress over a date range with per-day breakdown and averages';
    static args = {
        from: core_1.Args.string({ description: 'Start date (YYYY-MM-DD)', required: true }),
        to: core_1.Args.string({ description: 'End date (YYYY-MM-DD)', required: true }),
    };
    async run() {
        const { args } = await this.parse(RangeGoals);
        const from = (0, date_js_1.parseDate)(args.from);
        const to = (0, date_js_1.parseDate)(args.to);
        const db = (0, index_js_1.getDb)();
        const dates = (0, date_js_1.dateRange)(from, to);
        const daily = [];
        for (const date of dates) {
            const entries = await (0, entries_js_1.getEntriesForDate)(db, date);
            const nutrients = (0, nutrients_js_1.sumNutrients)(entries.map((e) => e.nutrients));
            const calories = (0, entries_js_1.sumEntryCalories)(entries);
            const goals = await (0, goals_js_1.getGoalProgress)(db, { ...nutrients, calories });
            daily.push({ date, goals });
        }
        const goalTypes = daily[0]?.goals.map((g) => g.type) ?? [];
        const averages = goalTypes.map((type) => {
            const daysWithData = daily.filter((d) => d.goals.some((g) => g.type === type));
            const actuals = daysWithData.map((d) => d.goals.find((g) => g.type === type)?.actual ?? 0);
            const avg = actuals.reduce((s, v) => s + v, 0) / (daysWithData.length || 1);
            const sample = daily[0]?.goals.find((g) => g.type === type);
            return {
                type,
                ...(sample && 'mode' in sample ? { mode: sample.mode } : {}),
                ...(sample && 'upperBound' in sample ? { upperBound: sample.upperBound } : {}),
                ...(sample && 'lowerBound' in sample ? { lowerBound: sample.lowerBound } : {}),
                averageActual: Number(avg.toFixed(2)),
            };
        });
        return { from, to, days: dates.length, averages, daily };
    }
}
exports.default = RangeGoals;
//# sourceMappingURL=goals.js.map