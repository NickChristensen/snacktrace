import { BaseCommand } from '../../base-command.js';
export default class Foods extends BaseCommand {
    static description: string;
    static flags: {
        limit: import("@oclif/core/interfaces").OptionFlag<number, import("@oclif/core/interfaces").CustomOptions>;
        offset: import("@oclif/core/interfaces").OptionFlag<number, import("@oclif/core/interfaces").CustomOptions>;
    };
    run(): Promise<{
        offset: number;
        limit: number;
        count: number;
        foods: {
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
