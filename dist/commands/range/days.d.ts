import { BaseCommand } from '../../base-command.js';
export default class RangeDays extends BaseCommand {
    static description: string;
    static args: {
        from: import("@oclif/core/interfaces").Arg<string, Record<string, unknown>>;
        to: import("@oclif/core/interfaces").Arg<string, Record<string, unknown>>;
    };
    run(): Promise<{
        from: string;
        to: string;
        days: {
            date: string;
            calories: number;
            nutrients: import("../../db/schema.js").NutrientRecord;
        }[];
    }>;
}
