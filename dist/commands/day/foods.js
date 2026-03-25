"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const base_command_js_1 = require("../../base-command.js");
const index_js_1 = require("../../db/index.js");
const entries_js_1 = require("../../lib/entries.js");
const nutrients_js_1 = require("../../lib/nutrients.js");
const date_js_1 = require("../../lib/date.js");
class DayFoods extends base_command_js_1.BaseCommand {
    static description = 'Flat list of all foods consumed on a day';
    static args = {
        date: core_1.Args.string({
            description: 'Date to query (YYYY-MM-DD, "today", or "yesterday")',
            default: 'today',
        }),
    };
    async run() {
        const { args } = await this.parse(DayFoods);
        const date = (0, date_js_1.parseDate)(args.date);
        const db = (0, index_js_1.getDb)();
        const entries = await (0, entries_js_1.getEntriesForDate)(db, date);
        return {
            date,
            entries: entries.map((e) => ({
                name: e.name,
                meal: (0, nutrients_js_1.mealName)(e.mealTypeID, null),
                mealTypeID: e.mealTypeID,
                calories: e.calories,
                quantity: e.quantity,
                baseAmount: e.baseAmount,
                baseUnit: e.baseUnit,
                brandOwner: e.brandOwner,
                nutrients: e.nutrients,
            })),
        };
    }
}
exports.default = DayFoods;
//# sourceMappingURL=foods.js.map