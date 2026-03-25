import { BaseCommand } from '../../base-command.js';
export default class DayGoals extends BaseCommand {
    static description: string;
    static args: {
        date: import("@oclif/core/interfaces").Arg<string, Record<string, unknown>>;
    };
    run(): Promise<{
        date: string;
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
    }>;
}
