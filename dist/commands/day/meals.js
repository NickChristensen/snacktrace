"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const base_command_js_1 = require("../../base-command.js");
const index_js_1 = require("../../db/index.js");
const entries_js_1 = require("../../lib/entries.js");
const date_js_1 = require("../../lib/date.js");
class DayMeals extends base_command_js_1.BaseCommand {
    static description = 'Entries grouped by meal for a day';
    static args = {
        date: core_1.Args.string({
            description: 'Date to query (YYYY-MM-DD, "today", or "yesterday")',
            default: 'today',
        }),
    };
    async run() {
        const { args } = await this.parse(DayMeals);
        const date = (0, date_js_1.parseDate)(args.date);
        const db = (0, index_js_1.getDb)();
        const meals = await (0, entries_js_1.getMealsForDate)(db, date);
        return {
            date,
            meals: meals.map((m) => ({
                mealTypeID: m.mealTypeID,
                name: m.name,
                totalCalories: m.totalCalories,
                entries: m.entries.map(({ mealTypeID: _, ...e }) => e),
            })),
        };
    }
}
exports.default = DayMeals;
//# sourceMappingURL=meals.js.map