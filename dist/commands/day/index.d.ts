import { BaseCommand } from '../../base-command.js';
export default class Day extends BaseCommand {
    static description: string;
    static args: {
        date: import("@oclif/core/interfaces").Arg<string, Record<string, unknown>>;
    };
    run(): Promise<{
        date: string;
        totals: {
            calories: number;
            alcohol: number;
            caffeine: number;
            calcium: number;
            carbs: number;
            cholesterol: number;
            copper: number;
            fat: number;
            fatMonounsaturated: number;
            fatPolyunsaturated: number;
            fatSaturated: number;
            fatTrans: number;
            fiber: number;
            folate: number;
            iron: number;
            magnesium: number;
            manganese: number;
            niacin: number;
            pantothenicAcid: number;
            phosphorus: number;
            potassium: number;
            protein: number;
            riboflavin: number;
            selenium: number;
            sodium: number;
            sugars: number;
            thiamin: number;
            vitaminA: number;
            vitaminB12: number;
            vitaminB6: number;
            vitaminC: number;
            vitaminD: number;
            vitaminE: number;
            vitaminK: number;
            water: number;
            zinc: number;
        };
        goals: ({
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
        })[];
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
