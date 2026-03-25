import { BaseCommand } from '../../base-command.js';
export default class DayFoods extends BaseCommand {
    static description: string;
    static args: {
        date: import("@oclif/core/interfaces").Arg<string, Record<string, unknown>>;
    };
    run(): Promise<{
        date: string;
        entries: {
            name: string;
            meal: string;
            mealTypeID: string;
            calories: number;
            quantity: number;
            baseAmount: number;
            baseUnit: string;
            brandOwner: string | undefined;
            nutrients: import("../../db/schema.js").NutrientRecord;
        }[];
    }>;
}
