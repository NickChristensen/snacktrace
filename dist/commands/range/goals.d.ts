import { BaseCommand } from '../../base-command.js';
import { getGoalProgress } from '../../lib/goals.js';
type GoalResult = Awaited<ReturnType<typeof getGoalProgress>>;
interface DayGoals {
    date: string;
    goals: GoalResult;
}
export default class RangeGoals extends BaseCommand {
    static description: string;
    static args: {
        from: import("@oclif/core/interfaces").Arg<string, Record<string, unknown>>;
        to: import("@oclif/core/interfaces").Arg<string, Record<string, unknown>>;
    };
    run(): Promise<{
        from: string;
        to: string;
        days: number;
        averages: {
            averageActual: number;
            lowerBound?: number | null | undefined;
            upperBound?: number | null | undefined;
            mode?: "maximum" | "minimum" | "tracking" | undefined;
            type: string;
        }[];
        daily: DayGoals[];
    }>;
}
export {};
