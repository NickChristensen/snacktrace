"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEntriesForDate = getEntriesForDate;
exports.getMealsForDate = getMealsForDate;
exports.sumEntryCalories = sumEntryCalories;
const kysely_1 = require("kysely");
const nutrients_js_1 = require("./nutrients.js");
async function getEntriesForDate(db, date) {
    const rows = await db
        .selectFrom('foodEntryRecord')
        .select([
        // 'entryID',
        'mealTypeID',
        'name',
        'calories',
        'quantity',
        'baseAmount',
        'baseUnit',
        'nutrients',
        'brandOwner',
    ])
        .where((0, kysely_1.sql) `date(day)`, '=', date)
        .orderBy('mealTypeID')
        .execute();
    return rows.map((r) => {
        const raw = (0, nutrients_js_1.parseNutrients)(r.nutrients);
        // nutrients JSON is per baseAmount — scale to actual quantity consumed.
        // For zero-calorie entries (e.g. caffeine capsules), fall back to quantity/baseAmount.
        const scale = raw.calories > 0
            ? r.calories / raw.calories
            : r.baseAmount > 0
                ? r.quantity / r.baseAmount
                : 1;
        const nutrients = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Number((v * scale).toFixed(4))]));
        // entryID is a binary UUID stored as BLOB — convert to hex string for JSON output
        // const entryID = Buffer.isBuffer(r.entryID)
        //   ? (r.entryID as Buffer).toString('hex').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5')
        //   : (r.entryID as string)
        return {
            // entryID,
            mealTypeID: r.mealTypeID,
            name: r.name,
            calories: r.calories,
            quantity: r.quantity,
            baseAmount: r.baseAmount,
            baseUnit: r.baseUnit,
            brandOwner: r.brandOwner ?? undefined,
            nutrients,
        };
    });
}
async function getMealsForDate(db, date) {
    const entries = await getEntriesForDate(db, date);
    const mealTypes = await db
        .selectFrom('mealTypeRecord')
        .select(['mealTypeID', 'name', 'sortIndex'])
        .where('disabled', '=', 0)
        .orderBy('sortIndex')
        .execute();
    const mealMap = new Map(mealTypes.map((m) => [m.mealTypeID, m]));
    const grouped = new Map();
    for (const entry of entries) {
        const list = grouped.get(entry.mealTypeID) ?? [];
        list.push(entry);
        grouped.set(entry.mealTypeID, list);
    }
    const meals = [];
    for (const [mealTypeID, mealEntries] of grouped) {
        const meta = mealMap.get(mealTypeID);
        const totalCalories = mealEntries.reduce((sum, e) => sum + e.calories, 0);
        meals.push({
            mealTypeID,
            name: (0, nutrients_js_1.mealName)(mealTypeID, meta?.name ?? null),
            sortIndex: meta?.sortIndex ?? 99,
            totalCalories: Number(totalCalories.toFixed(2)),
            entries: mealEntries,
        });
    }
    return meals.sort((a, b) => a.sortIndex - b.sortIndex);
}
function sumEntryCalories(entries) {
    return Number(entries.reduce((sum, e) => sum + e.calories, 0).toFixed(2));
}
//# sourceMappingURL=entries.js.map