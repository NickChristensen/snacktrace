import { NutrientRecord } from '../db/schema.js';
export declare function parseNutrients(raw: string | null | undefined): NutrientRecord;
export declare function sumNutrients(records: NutrientRecord[]): NutrientRecord;
export declare function averageNutrients(records: NutrientRecord[], days: number): NutrientRecord;
export declare function mealName(mealTypeID: string, dbName: string | null | undefined): string;
export declare const GOAL_MODE: {
    readonly 1: "maximum";
    readonly 2: "minimum";
    readonly 4: "tracking";
};
