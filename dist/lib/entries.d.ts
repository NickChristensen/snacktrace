import { Kysely } from 'kysely';
import { DatabaseSchema } from '../db/schema.js';
export declare function getEntriesForDate(db: Kysely<DatabaseSchema>, date: string): Promise<{
    mealTypeID: string;
    name: string;
    calories: number;
    quantity: number;
    baseAmount: number;
    baseUnit: string;
    brandOwner: string | undefined;
    nutrients: import("../db/schema.js").NutrientRecord;
}[]>;
export declare function getMealsForDate(db: Kysely<DatabaseSchema>, date: string): Promise<{
    mealTypeID: string;
    name: string;
    sortIndex: number;
    totalCalories: number;
    entries: {
        mealTypeID: string;
        name: string;
        calories: number;
        quantity: number;
        baseAmount: number;
        baseUnit: string;
        brandOwner: string | undefined;
        nutrients: import("../db/schema.js").NutrientRecord;
    }[];
}[]>;
export declare function sumEntryCalories(entries: {
    calories: number;
}[]): number;
