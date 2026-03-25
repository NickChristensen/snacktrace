import { BaseCommand } from '../../base-command.js';
export default class FoodsShow extends BaseCommand {
    static description: string;
    static args: {
        foodID: import("@oclif/core/interfaces").Arg<string, Record<string, unknown>>;
    };
    run(): Promise<{
        foodID: string;
        name: string;
        brandOwner: string | null;
        baseAmount: number;
        baseUnit: string;
        source: string | null;
        barcode: string | null;
        lastLogged: string;
        nutrients: import("../../db/schema.js").NutrientRecord;
    }>;
}
