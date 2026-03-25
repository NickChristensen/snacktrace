import { BaseCommand } from '../../base-command.js';
export default class Range extends BaseCommand {
    static description: string;
    static args: {
        from: import("@oclif/core/interfaces").Arg<string, Record<string, unknown>>;
        to: import("@oclif/core/interfaces").Arg<string, Record<string, unknown>>;
    };
    run(): Promise<{
        from: string;
        to: string;
        days: number;
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
        averages: import("../../db/schema.js").NutrientRecord;
        daily: {
            date: string;
            calories: number;
            nutrients: import("../../db/schema.js").NutrientRecord;
        }[];
    }>;
}
