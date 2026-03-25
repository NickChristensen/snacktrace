"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_command_js_1 = require("../base-command.js");
const index_js_1 = require("../db/index.js");
const nutrients_js_1 = require("../lib/nutrients.js");
class Goals extends base_command_js_1.BaseCommand {
    static description = 'Show configured nutrition goals';
    async run() {
        const db = (0, index_js_1.getDb)();
        const goals = await db
            .selectFrom('goalRecord')
            .select(['goalID', 'goalType', 'sortIndex'])
            .orderBy('sortIndex')
            .execute();
        const rules = await db
            .selectFrom('goalRuleRecord')
            .select(['goalType', 'mode', 'lowerBound', 'upperBound', 'dayOfWeek', 'isOverride'])
            .execute();
        const rulesByType = {};
        for (const rule of rules) {
            if (!rulesByType[rule.goalType])
                rulesByType[rule.goalType] = [];
            rulesByType[rule.goalType].push(rule);
        }
        return {
            goals: goals.map((g) => ({
                type: g.goalType,
                rules: (rulesByType[g.goalType] ?? []).map((r) => ({
                    mode: nutrients_js_1.GOAL_MODE[r.mode] ?? r.mode,
                    lowerBound: r.lowerBound,
                    upperBound: r.upperBound,
                    dayOfWeek: r.dayOfWeek,
                    isOverride: Boolean(r.isOverride),
                })),
            })),
        };
    }
}
exports.default = Goals;
//# sourceMappingURL=goals.js.map