"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const base_command_js_1 = require("../../base-command.js");
const index_js_1 = require("../../db/index.js");
const entries_js_1 = require("../../lib/entries.js");
const goals_js_1 = require("../../lib/goals.js");
const nutrients_js_1 = require("../../lib/nutrients.js");
const date_js_1 = require("../../lib/date.js");
class Day extends base_command_js_1.BaseCommand {
    static description = 'Full summary for a day: goals, meals, and foods';
    static args = {
        date: core_1.Args.string({
            description: 'Date to query (YYYY-MM-DD, "today", or "yesterday")',
            default: 'today',
        }),
    };
    async run() {
        const { args } = await this.parse(Day);
        const date = (0, date_js_1.parseDate)(args.date);
        const db = (0, index_js_1.getDb)();
        const entries = await (0, entries_js_1.getEntriesForDate)(db, date);
        const meals = await (0, entries_js_1.getMealsForDate)(db, date);
        const allNutrients = entries.map((e) => e.nutrients);
        const totals = (0, nutrients_js_1.sumNutrients)(allNutrients);
        const goals = await (0, goals_js_1.getGoalProgress)(db, { ...totals, calories: (0, entries_js_1.sumEntryCalories)(entries) });
        return {
            date,
            totals: {
                ...totals,
                calories: (0, entries_js_1.sumEntryCalories)(entries),
            },
            goals,
            meals: meals.map((m) => ({
                mealTypeID: m.mealTypeID,
                name: m.name,
                totalCalories: m.totalCalories,
                entries: m.entries.map(({ mealTypeID: _, ...e }) => e),
            })),
        };
    }
}
exports.default = Day;
//# sourceMappingURL=index.js.map