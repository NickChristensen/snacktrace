import { Kysely } from 'kysely';
import { DatabaseSchema, NutrientRecord } from '../db/schema.js';
export declare function getGoalProgress(db: Kysely<DatabaseSchema>, totals: NutrientRecord & {
    calories: number;
}): Promise<({
    type: string;
    actual: number;
    mode?: undefined;
    lowerBound?: undefined;
    upperBound?: undefined;
    progress?: undefined;
} | {
    type: string;
    mode: "maximum" | "minimum" | "tracking";
    lowerBound: number | null;
    upperBound: number | null;
    actual: number;
    progress: number | null;
})[]>;
