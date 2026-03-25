import { BaseCommand } from '../../base-command.js';
export default class DayMeals extends BaseCommand {
    static description: string;
    static args: {
        date: import("@oclif/core/interfaces").Arg<string, Record<string, unknown>>;
    };
    run(): Promise<{
        date: string;
        meals: {
            mealTypeID: string;
            name: string;
            totalCalories: number;
            entries: {
                name: string;
                calories: number;
                quantity: number;
                baseAmount: number;
                baseUnit: string;
                brandOwner: string | undefined;
                nutrients: import("../../db/schema.js").NutrientRecord;
            }[];
        }[];
    }>;
}
