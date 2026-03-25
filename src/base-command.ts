import {Command} from '@oclif/core'

export abstract class BaseCommand extends Command {
  static enableJsonFlag = false

  // Always JSON — no --json flag is exposed or required
  public jsonEnabled(): boolean {
    return true
  }
}
