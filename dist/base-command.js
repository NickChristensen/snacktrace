"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseCommand = void 0;
const core_1 = require("@oclif/core");
class BaseCommand extends core_1.Command {
    static enableJsonFlag = true;
    // Always JSON — no --json flag required
    jsonEnabled() {
        return true;
    }
}
exports.BaseCommand = BaseCommand;
//# sourceMappingURL=base-command.js.map