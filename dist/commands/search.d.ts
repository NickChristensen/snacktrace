import { BaseCommand } from '../base-command.js';
export default class Search extends BaseCommand {
    static description: string;
    static args: {
        query: import("@oclif/core/interfaces").Arg<string, Record<string, unknown>>;
    };
    static flags: {
        limit: import("@oclif/core/interfaces").OptionFlag<number, import("@oclif/core/interfaces").CustomOptions>;
    };
    run(): Promise<{
        query: string;
        count: number;
        results: {
            foodID: string;
            name: string;
            brandOwner: string | null;
            baseAmount: number;
            baseUnit: string;
            calories: number;
            source: string | null;
            lastLogged: string;
        }[];
    }>;
}
