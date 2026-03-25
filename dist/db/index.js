"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const kysely_1 = require("kysely");
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const DEFAULT_DB_PATH = node_path_1.default.join(node_os_1.default.homedir(), 'Library/Containers/com.algebraiclabs.foodnoms/Data/Documents/db.db');
let _db = null;
function getDb() {
    if (_db)
        return _db;
    const dbPath = process.env.FOODNOMS_DB ?? DEFAULT_DB_PATH;
    _db = new kysely_1.Kysely({
        dialect: new kysely_1.SqliteDialect({
            database: new better_sqlite3_1.default(dbPath, { readonly: true }),
        }),
    });
    return _db;
}
//# sourceMappingURL=index.js.map