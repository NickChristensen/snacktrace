import { Command } from '@oclif/core';
export declare abstract class BaseCommand extends Command {
    static enableJsonFlag: boolean;
    jsonEnabled(): boolean;
}
