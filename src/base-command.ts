import {Command} from '@oclif/core'

export abstract class BaseCommand extends Command {
  static enableJsonFlag = true

  // Always JSON — no --json flag required
  public jsonEnabled(): boolean {
    return true
  }
}
