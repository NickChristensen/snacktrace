"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGoalProgress = getGoalProgress;
const nutrients_js_1 = require("./nutrients.js");
async function getGoalProgress(db, totals) {
    const goals = await db
        .selectFrom('goalRecord')
        .select(['goalType', 'sortIndex'])
        .orderBy('sortIndex')
        .execute();
    const rules = await db
        .selectFrom('goalRuleRecord')
        .select(['goalType', 'mode', 'lowerBound', 'upperBound'])
        .where('dayOfWeek', 'is', null) // default (every day) rules
        .execute();
    const ruleMap = new Map(rules.map((r) => [r.goalType, r]));
    const nutrientMap = {
        calorie: totals.calories,
        protein: totals.protein,
        carbohydrate: totals.carbs,
        fat: totals.fat,
        fatSaturated: totals.fatSaturated,
        fiber: totals.fiber,
        caffeine: totals.caffeine,
    };
    return goals.map((g) => {
        const rule = ruleMap.get(g.goalType);
        const actual = Number((nutrientMap[g.goalType] ?? 0).toFixed(2));
        if (!rule) {
            return { type: g.goalType, actual };
        }
        const mode = nutrients_js_1.GOAL_MODE[rule.mode] ?? rule.mode;
        const target = rule.upperBound ?? rule.lowerBound ?? null;
        const progress = target ? Number((actual / target).toFixed(4)) : null;
        return {
            type: g.goalType,
            mode,
            lowerBound: rule.lowerBound,
            upperBound: rule.upperBound,
            actual,
            progress,
        };
    });
}
//# sourceMappingURL=goals.js.map