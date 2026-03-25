"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GOAL_MODE = void 0;
exports.parseNutrients = parseNutrients;
exports.sumNutrients = sumNutrients;
exports.averageNutrients = averageNutrients;
exports.mealName = mealName;
function parseNutrients(raw) {
    if (!raw)
        return {};
    try {
        return JSON.parse(raw);
    }
    catch {
        return {};
    }
}
function sumNutrients(records) {
    const result = {};
    for (const record of records) {
        for (const [key, value] of Object.entries(record)) {
            result[key] = (result[key] ?? 0) + (value ?? 0);
        }
    }
    return result;
}
function averageNutrients(records, days) {
    const sum = sumNutrients(records);
    const result = {};
    for (const [key, value] of Object.entries(sum)) {
        result[key] = Number((value / days).toFixed(2));
    }
    return result;
}
// FoodNoms uses built-in names for meal types since the name column is empty in the DB
// Built-in meal types have empty name column — these are the app defaults
const MEAL_NAMES = {
    '1': 'Breakfast',
    '2': 'Lunch',
    '3': 'Dinner',
    '4': 'Snack',
    '5': 'Pre-Workout',
    '6': 'Post-Workout',
};
function mealName(mealTypeID, dbName) {
    if (dbName)
        return dbName;
    return MEAL_NAMES[mealTypeID] ?? `Meal ${mealTypeID}`;
}
// Goal mode constants
exports.GOAL_MODE = {
    1: 'maximum',
    2: 'minimum',
    4: 'tracking',
};
//# sourceMappingURL=nutrients.js.map