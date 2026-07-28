-- FoodNoms schema snapshot (DDL only).
-- This file is not a restore script or migration.
-- Objects: tables=32, views=0, indexes=26, triggers=15.
-- SQLite user_version=0.
CREATE TABLE "activityEntryRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "entryID" TEXT UNIQUE ON CONFLICT REPLACE, "cloudKitSystemFields" BLOB, "version" INTEGER, "dateCreated" DATETIME, "dateLastUpdated" DATETIME, "activityType" TEXT, "day" DOUBLE, "value" DOUBLE, "traits" INTEGER, "updateCount" INTEGER, "clock" INTEGER, "supabaseSystemFields" BLOB);
CREATE TABLE "cloudKitServerChangeTokenRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL UNIQUE ON CONFLICT REPLACE, "serverChangeTokenData" BLOB);
CREATE TABLE "deletedRecords" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "recordName" TEXT UNIQUE ON CONFLICT IGNORE, "dateDeleted" DATETIME);
CREATE TABLE "favoriteRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "favoriteID" TEXT UNIQUE ON CONFLICT REPLACE, "cloudKitSystemFields" BLOB, "version" INTEGER, "dateCreated" DATETIME, "dateLastUpdated" DATETIME, "itemType" INTEGER, "itemID" TEXT, "name" TEXT, "color" BLOB, "icon" TEXT, "sortIndex" INTEGER, "portions" BLOB, "traits" INTEGER, "updateCount" INTEGER, "clock" INTEGER, "mealTypeID" TEXT, "supabaseSystemFields" BLOB);
CREATE TABLE "foodCollectionRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "collectionID" TEXT UNIQUE ON CONFLICT REPLACE, "collectionEditID" TEXT, "cloudKitSystemFields" BLOB, "version" INTEGER, "dateCreated" DATETIME, "dateLastUpdated" DATETIME, "name" TEXT, "collectionType" INTEGER, "servings" DOUBLE, "servingSizeUnit" TEXT, "totalServingSize" DOUBLE, "traits" INTEGER, "updateCount" INTEGER, "clock" INTEGER, "supabaseSystemFields" BLOB, "color" TEXT, "icon" TEXT, "foodEntries" BLOB, "urlString" TEXT, "notes" TEXT);
CREATE VIRTUAL TABLE "foodCollectionSearch" USING fts4(id, collectionID, collectionType, name, tokenize=porter, content="foodCollectionRecord");
CREATE TABLE 'foodCollectionSearch_docsize'(docid INTEGER PRIMARY KEY, size BLOB);
CREATE TABLE 'foodCollectionSearch_segdir'(level INTEGER,idx INTEGER,start_block INTEGER,leaves_end_block INTEGER,end_block INTEGER,root BLOB,PRIMARY KEY(level, idx));
CREATE TABLE 'foodCollectionSearch_segments'(blockid INTEGER PRIMARY KEY, block BLOB);
CREATE TABLE 'foodCollectionSearch_stat'(id INTEGER PRIMARY KEY, value BLOB);
CREATE TABLE "foodEntryRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "entryID" TEXT UNIQUE ON CONFLICT REPLACE, "cloudKitSystemFields" BLOB, "version" INTEGER, "date" DATETIME, "dateCreated" DATETIME, "dateLastUpdated" DATETIME, "tzID" TEXT, "day" DOUBLE, "collectionEditID" TEXT, "collectionSortIndex" INTEGER, "measure" BLOB, "quantity" DOUBLE, "uncertainty" INTEGER, "mealTypeID" TEXT, "traits" INTEGER, "healthSyncVersion" DOUBLE, "foodID" TEXT, "versionID" TEXT, "barcode" TEXT, "source" TEXT, "secondarySource" TEXT, "name" TEXT, "brandOwner" TEXT, "baseUnit" TEXT, "baseAmount" DOUBLE, "measures" BLOB, "nutrients" BLOB, "calories" DOUBLE, "updateCount" INTEGER, "clock" INTEGER, "dateAdded" DATETIME, "supabaseSystemFields" BLOB);
CREATE VIRTUAL TABLE "foodEntrySearch" USING fts4(id, entryID, brandOwner, name, tokenize=porter, content="foodEntryRecord");
CREATE TABLE 'foodEntrySearch_docsize'(docid INTEGER PRIMARY KEY, size BLOB);
CREATE TABLE 'foodEntrySearch_segdir'(level INTEGER,idx INTEGER,start_block INTEGER,leaves_end_block INTEGER,end_block INTEGER,root BLOB,PRIMARY KEY(level, idx));
CREATE TABLE 'foodEntrySearch_segments'(blockid INTEGER PRIMARY KEY, block BLOB);
CREATE TABLE 'foodEntrySearch_stat'(id INTEGER PRIMARY KEY, value BLOB);
CREATE TABLE "foodRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "cloudKitSystemFields" BLOB, "version" INTEGER, "dateCreated" DATETIME, "dateLastUpdated" DATETIME, "foodID" TEXT UNIQUE ON CONFLICT REPLACE, "versionID" TEXT, "barcode" TEXT, "source" TEXT, "secondarySource" TEXT, "name" TEXT, "brandOwner" TEXT, "baseUnit" TEXT, "baseAmount" DOUBLE, "measures" BLOB, "nutrients" BLOB, "isHidden" BOOLEAN, "traits" INTEGER, "updateCount" INTEGER, "clock" INTEGER, "supabaseSystemFields" BLOB);
CREATE VIRTUAL TABLE "foodSearch" USING fts4(id, foodID, brandOwner, name, tokenize=porter, content="foodRecord");
CREATE TABLE 'foodSearch_docsize'(docid INTEGER PRIMARY KEY, size BLOB);
CREATE TABLE 'foodSearch_segdir'(level INTEGER,idx INTEGER,start_block INTEGER,leaves_end_block INTEGER,end_block INTEGER,root BLOB,PRIMARY KEY(level, idx));
CREATE TABLE 'foodSearch_segments'(blockid INTEGER PRIMARY KEY, block BLOB);
CREATE TABLE 'foodSearch_stat'(id INTEGER PRIMARY KEY, value BLOB);
CREATE TABLE "goalRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "goalID" TEXT UNIQUE ON CONFLICT REPLACE, "cloudKitSystemFields" BLOB, "version" INTEGER, "dateCreated" DATETIME, "dateLastUpdated" DATETIME, "goalType" TEXT, "sortIndex" INTEGER, "traits" INTEGER, "updateCount" INTEGER, "clock" INTEGER, "supabaseSystemFields" BLOB);
CREATE TABLE "goalRuleMetaRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "goalType" TEXT UNIQUE ON CONFLICT REPLACE, "minStartDay" DOUBLE, "maxStartDay" DOUBLE);
CREATE TABLE "goalRuleRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "ruleID" TEXT UNIQUE ON CONFLICT REPLACE, "cloudKitSystemFields" BLOB, "version" INTEGER, "dateCreated" DATETIME, "dateLastUpdated" DATETIME, "goalType" TEXT, "startDay" DOUBLE, "dayOfWeek" INTEGER, "mode" INTEGER, "calorieAdjustmentType" INTEGER, "relativeToCalorieGoal" BOOLEAN, "lowerBound" DOUBLE, "upperBound" DOUBLE, "relativePercentageLowerBound" INTEGER, "relativePercentageUpperBound" INTEGER, "restingEnergyCalculationMode" INTEGER, "weight" DOUBLE, "height" DOUBLE, "age" DOUBLE, "sex" INTEGER, "manualInputRestingEnergy" DOUBLE, "activityLevel" INTEGER, "desiredWeightChangePerWeek" DOUBLE, "minimum" DOUBLE, "traits" INTEGER, "updateCount" INTEGER, "clock" INTEGER, "isOverride" BOOLEAN, "supabaseSystemFields" BLOB, "calorieAdjustmentLimit" DOUBLE);
CREATE TABLE grdb_migrations (identifier TEXT NOT NULL PRIMARY KEY);
CREATE TABLE "healthKitQueryAnchorRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL UNIQUE ON CONFLICT REPLACE, "anchorData" BLOB NOT NULL);
CREATE TABLE "mealTypeRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "mealTypeID" TEXT UNIQUE ON CONFLICT REPLACE, "cloudKitSystemFields" BLOB, "version" INTEGER, "dateCreated" DATETIME, "dateLastUpdated" DATETIME, "disabled" BOOLEAN, "alwaysShowInLog" BOOLEAN, "name" TEXT, "timeRangeStart" INTEGER, "timeRangeEnd" INTEGER, "sortIndex" INTEGER, "updateCount" INTEGER, "defaultTime" INTEGER, "clock" INTEGER, "supabaseSystemFields" BLOB);
CREATE TABLE "scanRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "scanID" TEXT NOT NULL UNIQUE ON CONFLICT REPLACE, "cloudKitSystemFields" BLOB, "supabaseSystemFields" BLOB, "version" INTEGER, "dateCreated" DATETIME, "dateLastUpdated" DATETIME, "clock" INTEGER, "day" DOUBLE, "date" DATETIME, "tzID" TEXT, "barcode" TEXT, "note" TEXT);
CREATE TABLE "suggestionSampleRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "foodEntryID" TEXT UNIQUE ON CONFLICT REPLACE, "foodID" TEXT, "groupID" TEXT, "day" DOUBLE, "date" DATETIME, "mealTypeID" TEXT);
CREATE TABLE "supabaseChangeTokenRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL UNIQUE ON CONFLICT REPLACE, "changeToken" TEXT);
CREATE TABLE "syncMarkerRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "markerID" TEXT UNIQUE ON CONFLICT REPLACE, "cloudKitSystemFields" BLOB, "version" INTEGER, "dateCreated" DATETIME, "dateLastUpdated" DATETIME, "updateCount" INTEGER, "clock" INTEGER, "supabaseSystemFields" BLOB);
CREATE UNIQUE INDEX "activityEntryRecord_on_day_and_activityType" ON "activityEntryRecord"("day", "activityType");
CREATE INDEX "byGoalTypeAndStartDay" ON "goalRuleRecord"("goalType", "startDay");
CREATE INDEX "foodCollectionRecord_on_collectionEditID" ON "foodCollectionRecord"("collectionEditID");
CREATE INDEX "foodCollectionRecord_on_collectionType" ON "foodCollectionRecord"("collectionType");
CREATE INDEX "foodCollectionRecord_on_dateCreated" ON "foodCollectionRecord"("dateCreated");
CREATE INDEX "foodCollectionRecord_on_dateLastUpdated" ON "foodCollectionRecord"("dateLastUpdated");
CREATE INDEX "foodEntryRecord_on_calories" ON "foodEntryRecord"("calories");
CREATE INDEX "foodEntryRecord_on_collectionEditID" ON "foodEntryRecord"("collectionEditID");
CREATE INDEX "foodEntryRecord_on_date" ON "foodEntryRecord"("date");
CREATE INDEX "foodEntryRecord_on_dateCreated" ON "foodEntryRecord"("dateCreated");
CREATE INDEX "foodEntryRecord_on_dateLastUpdated" ON "foodEntryRecord"("dateLastUpdated");
CREATE INDEX "foodEntryRecord_on_day" ON "foodEntryRecord"("day");
CREATE INDEX "foodEntryRecord_on_foodID" ON "foodEntryRecord"("foodID");
CREATE INDEX "foodEntryRecord_on_traits" ON "foodEntryRecord"("traits");
CREATE INDEX "foodRecord_on_dateCreated" ON "foodRecord"("dateCreated");
CREATE INDEX "goalRuleMetaRecord_on_maxStartDay" ON "goalRuleMetaRecord"("maxStartDay");
CREATE INDEX "goalRuleMetaRecord_on_minStartDay" ON "goalRuleMetaRecord"("minStartDay");
CREATE INDEX "goalRuleRecord_on_dateCreated" ON "goalRuleRecord"("dateCreated");
CREATE INDEX "goalRuleRecord_on_goalType" ON "goalRuleRecord"("goalType");
CREATE INDEX "goalRuleRecord_on_startDay" ON "goalRuleRecord"("startDay");
CREATE INDEX "scanRecord_on_date" ON "scanRecord"("date");
CREATE INDEX "scanRecord_on_day" ON "scanRecord"("day");
CREATE INDEX "suggestionSampleRecord_on_day" ON "suggestionSampleRecord"("day");
CREATE INDEX "suggestionSampleRecord_on_foodID" ON "suggestionSampleRecord"("foodID");
CREATE INDEX "suggestionSampleRecord_on_groupID" ON "suggestionSampleRecord"("groupID");
CREATE INDEX "suggestionSampleRecord_on_mealTypeID" ON "suggestionSampleRecord"("mealTypeID");
CREATE TRIGGER "__foodCollectionSearch_ai" AFTER INSERT ON "foodCollectionRecord" BEGIN
    INSERT INTO "foodCollectionSearch"("docid", "id", "collectionID", "collectionType", "name") VALUES(new."id", new."id", new."collectionID", new."collectionType", new."name");
END;
CREATE TRIGGER "__foodCollectionSearch_au" AFTER UPDATE ON "foodCollectionRecord" BEGIN
    INSERT INTO "foodCollectionSearch"("docid", "id", "collectionID", "collectionType", "name") VALUES(new."id", new."id", new."collectionID", new."collectionType", new."name");
END;
CREATE TRIGGER "__foodCollectionSearch_bd" BEFORE DELETE ON "foodCollectionRecord" BEGIN
    DELETE FROM "foodCollectionSearch" WHERE docid=old."id";
END;
CREATE TRIGGER "__foodCollectionSearch_bu" BEFORE UPDATE ON "foodCollectionRecord" BEGIN
    DELETE FROM "foodCollectionSearch" WHERE docid=old."id";
END;
CREATE TRIGGER "__foodEntrySearch_ai" AFTER INSERT ON "foodEntryRecord" BEGIN
    INSERT INTO "foodEntrySearch"("docid", "id", "entryID", "brandOwner", "name") VALUES(new."id", new."id", new."entryID", new."brandOwner", new."name");
END;
CREATE TRIGGER "__foodEntrySearch_au" AFTER UPDATE ON "foodEntryRecord" BEGIN
    INSERT INTO "foodEntrySearch"("docid", "id", "entryID", "brandOwner", "name") VALUES(new."id", new."id", new."entryID", new."brandOwner", new."name");
END;
CREATE TRIGGER "__foodEntrySearch_bd" BEFORE DELETE ON "foodEntryRecord" BEGIN
    DELETE FROM "foodEntrySearch" WHERE docid=old."id";
END;
CREATE TRIGGER "__foodEntrySearch_bu" BEFORE UPDATE ON "foodEntryRecord" BEGIN
    DELETE FROM "foodEntrySearch" WHERE docid=old."id";
END;
CREATE TRIGGER "__foodSearch_ai" AFTER INSERT ON "foodRecord" BEGIN
    INSERT INTO "foodSearch"("docid", "id", "foodID", "brandOwner", "name") VALUES(new."id", new."id", new."foodID", new."brandOwner", new."name");
END;
CREATE TRIGGER "__foodSearch_au" AFTER UPDATE ON "foodRecord" BEGIN
    INSERT INTO "foodSearch"("docid", "id", "foodID", "brandOwner", "name") VALUES(new."id", new."id", new."foodID", new."brandOwner", new."name");
END;
CREATE TRIGGER "__foodSearch_bd" BEFORE DELETE ON "foodRecord" BEGIN
    DELETE FROM "foodSearch" WHERE docid=old."id";
END;
CREATE TRIGGER "__foodSearch_bu" BEFORE UPDATE ON "foodRecord" BEGIN
    DELETE FROM "foodSearch" WHERE docid=old."id";
END;
CREATE TRIGGER update_goal_rule_meta_after_delete_goal_rule_record
AFTER DELETE ON goalRuleRecord
BEGIN
    INSERT INTO goalRuleMetaRecord (goalType, minStartDay, maxStartDay)
    VALUES (
        OLD.goalType,
        (
            SELECT startDay
            FROM goalRuleRecord
            WHERE goalType = OLD.goalType
            AND (isOverride IS NULL OR isOverride = false)
            ORDER BY startDay ASC, dateCreated DESC
            LIMIT 1
        ),
        (
            SELECT startDay
            FROM goalRuleRecord
            WHERE goalType = OLD.goalType
            AND (isOverride IS NULL OR isOverride = false)
            ORDER BY startDay DESC, dateCreated DESC
            LIMIT 1
        )
    );
END;
CREATE TRIGGER update_goal_rule_meta_after_insert_goal_rule_record
AFTER INSERT ON goalRuleRecord
BEGIN
    INSERT INTO goalRuleMetaRecord (goalType, minStartDay, maxStartDay)
    VALUES (
        NEW.goalType,
        (
            SELECT startDay
            FROM goalRuleRecord
            WHERE goalType = NEW.goalType
            AND (isOverride IS NULL OR isOverride = false)
            ORDER BY startDay ASC, dateCreated DESC
            LIMIT 1
        ),
        (
            SELECT startDay
            FROM goalRuleRecord
            WHERE goalType = NEW.goalType
            AND (isOverride IS NULL OR isOverride = false)
            ORDER BY startDay DESC, dateCreated DESC
            LIMIT 1
        )
    );
END;
CREATE TRIGGER update_goal_rule_meta_after_update_goal_rule_record
AFTER UPDATE ON goalRuleRecord
BEGIN
    INSERT INTO goalRuleMetaRecord (goalType, minStartDay, maxStartDay)
    VALUES (
        NEW.goalType,
        (
            SELECT startDay
            FROM goalRuleRecord
            WHERE goalType = NEW.goalType
            AND (isOverride IS NULL OR isOverride = false)
            ORDER BY startDay ASC, dateCreated DESC
            LIMIT 1
        ),
        (
            SELECT startDay
            FROM goalRuleRecord
            WHERE goalType = NEW.goalType
            AND (isOverride IS NULL OR isOverride = false)
            ORDER BY startDay DESC, dateCreated DESC
            LIMIT 1
        )
    );
END;
