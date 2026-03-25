import { BaseCommand } from '../base-command.js';
export default class Goals extends BaseCommand {
    static description: string;
    run(): Promise<{
        goals: {
            type: string;
            rules: {
                mode: "maximum" | "minimum" | "tracking";
                lowerBound: number | null;
                upperBound: number | null;
                dayOfWeek: number | null;
                isOverride: boolean;
            }[];
        }[];
    }>;
}
