-- FoodNoms schema snapshot (DDL only).
-- This file is not a restore script or migration.
-- Objects: tables=47, views=0, indexes=58, triggers=27.
-- SQLite user_version=0.
CREATE TABLE "activityEntryRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "entryID" TEXT UNIQUE ON CONFLICT REPLACE, "cloudKitSystemFields" BLOB, "version" INTEGER, "dateCreated" DATETIME, "dateLastUpdated" DATETIME, "activityType" TEXT, "day" DOUBLE, "value" DOUBLE, "traits" INTEGER, "updateCount" INTEGER, "clock" INTEGER, "supabaseSystemFields" BLOB);
CREATE TABLE "bodyMetricEntryMetaRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "metricType" INTEGER UNIQUE ON CONFLICT REPLACE, "minDay" DOUBLE, "maxDay" DOUBLE);
CREATE TABLE "bodyMetricEntryRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "entryID" TEXT UNIQUE ON CONFLICT REPLACE, "cloudKitSystemFields" BLOB, "supabaseSystemFields" BLOB, "version" INTEGER, "dateCreated" DATETIME, "dateLastUpdated" DATETIME, "clock" INTEGER, "day" DOUBLE, "metricType" INTEGER, "value" DOUBLE, "source" INTEGER);
CREATE TABLE "bodyProfileRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "cloudKitSystemFields" BLOB, "supabaseSystemFields" BLOB, "version" INTEGER, "dateCreated" DATETIME, "dateLastUpdated" DATETIME, "clock" INTEGER, "sex" INTEGER, "birthdate" DOUBLE);
CREATE TABLE "calendarRecoveryJournalRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "recordType" TEXT NOT NULL, "recordID" TEXT NOT NULL, "field" TEXT NOT NULL, "originalJulianDay" DOUBLE NOT NULL, "recoveredJulianDay" DOUBLE NOT NULL, "identifiedCalendar" TEXT NOT NULL, "dateCreated" DATETIME, "migratedAt" DATETIME NOT NULL);
CREATE TABLE "cloudKitServerChangeTokenRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL UNIQUE ON CONFLICT REPLACE, "serverChangeTokenData" BLOB);
CREATE TABLE "deletedRecords" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "recordName" TEXT UNIQUE ON CONFLICT IGNORE, "dateDeleted" DATETIME);
CREATE TABLE "energyStrategyRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "strategyID" TEXT UNIQUE ON CONFLICT REPLACE, "cloudKitSystemFields" BLOB, "supabaseSystemFields" BLOB, "version" INTEGER, "dateCreated" DATETIME, "dateLastUpdated" DATETIME, "clock" INTEGER, "method" INTEGER, "startDay" DOUBLE, "restingEnergyCalculationMode" INTEGER, "manualRestingEnergy" DOUBLE, "activityLevel" INTEGER, "includedEnergyComponents" INTEGER, "activeEnergyScaleFactor" DOUBLE, "manualTotalEnergy" DOUBLE, "calibrationMeanDailyIntake" DOUBLE, "calibrationWeightRate" DOUBLE, "calibrationLoggedDayCount" INTEGER, "calibrationFlaggedDayCount" INTEGER, "calibrationWindowDays" INTEGER, "calibrationPreviousEnergy" DOUBLE, "calibrationEasedIn" INTEGER, "calibrationConfidence" TEXT, "calibrationObservation" TEXT, "calibrationDeclined" INTEGER);
CREATE TABLE "favoriteRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "favoriteID" TEXT UNIQUE ON CONFLICT REPLACE, "cloudKitSystemFields" BLOB, "version" INTEGER, "dateCreated" DATETIME, "dateLastUpdated" DATETIME, "itemType" INTEGER, "itemID" TEXT, "name" TEXT, "color" BLOB, "icon" TEXT, "sortIndex" INTEGER, "portions" BLOB, "traits" INTEGER, "updateCount" INTEGER, "clock" INTEGER, "mealTypeID" TEXT, "supabaseSystemFields" BLOB);
CREATE TABLE "foodCollectionRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "collectionID" TEXT UNIQUE ON CONFLICT REPLACE, "collectionEditID" TEXT, "cloudKitSystemFields" BLOB, "version" INTEGER, "dateCreated" DATETIME, "dateLastUpdated" DATETIME, "name" TEXT, "collectionType" INTEGER, "servings" DOUBLE, "servingSizeUnit" TEXT, "totalServingSize" DOUBLE, "traits" INTEGER, "updateCount" INTEGER, "clock" INTEGER, "supabaseSystemFields" BLOB, "color" TEXT, "icon" TEXT, "foodEntries" BLOB, "urlString" TEXT, "notes" TEXT);
CREATE VIRTUAL TABLE "foodCollectionSearch" USING fts4(id, collectionID, collectionType, name, tokenize=porter, content="foodCollectionRecord");
CREATE TABLE 'foodCollectionSearch_docsize'(docid INTEGER PRIMARY KEY, size BLOB);
CREATE TABLE 'foodCollectionSearch_segdir'(level INTEGER,idx INTEGER,start_block INTEGER,leaves_end_block INTEGER,end_block INTEGER,root BLOB,PRIMARY KEY(level, idx));
CREATE TABLE 'foodCollectionSearch_segments'(blockid INTEGER PRIMARY KEY, block BLOB);
CREATE TABLE 'foodCollectionSearch_stat'(id INTEGER PRIMARY KEY, value BLOB);
CREATE TABLE "foodEntryGroupCollapseStateRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "day" DOUBLE, "mealTypeID" TEXT, "otherGroupFirstEntryID" TEXT, "isCollapsed" BOOLEAN NOT NULL);
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
CREATE TABLE "goalRuleRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "ruleID" TEXT UNIQUE ON CONFLICT REPLACE, "cloudKitSystemFields" BLOB, "version" INTEGER, "dateCreated" DATETIME, "dateLastUpdated" DATETIME, "goalType" TEXT, "startDay" DOUBLE, "dayOfWeek" INTEGER, "mode" INTEGER, "calorieAdjustmentType" INTEGER, "relativeToCalorieGoal" BOOLEAN, "lowerBound" DOUBLE, "upperBound" DOUBLE, "relativePercentageLowerBound" INTEGER, "relativePercentageUpperBound" INTEGER, "restingEnergyCalculationMode" INTEGER, "weight" DOUBLE, "height" DOUBLE, "age" DOUBLE, "sex" INTEGER, "manualInputRestingEnergy" DOUBLE, "activityLevel" INTEGER, "desiredWeightChangePerWeek" DOUBLE, "minimum" DOUBLE, "traits" INTEGER, "updateCount" INTEGER, "clock" INTEGER, "isOverride" BOOLEAN, "supabaseSystemFields" BLOB, "calorieAdjustmentLimit" DOUBLE, "relativeFractionalLowerBound" DOUBLE, "relativeFractionalUpperBound" DOUBLE, "relativeFractionalTargetValue" DOUBLE, "targetValue" DOUBLE, "toleranceValue" DOUBLE, "toleranceUnit" INTEGER);
CREATE TABLE grdb_migrations (identifier TEXT NOT NULL PRIMARY KEY);
CREATE TABLE "healthKitQueryAnchorRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL UNIQUE ON CONFLICT REPLACE, "anchorData" BLOB NOT NULL);
CREATE TABLE "healthProfileMetaRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "minStartDay" DOUBLE, "maxStartDay" DOUBLE);
CREATE TABLE "healthProfileRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "profileID" TEXT UNIQUE ON CONFLICT REPLACE, "cloudKitSystemFields" BLOB, "supabaseSystemFields" BLOB, "version" INTEGER, "dateCreated" DATETIME, "dateLastUpdated" DATETIME, "clock" INTEGER, "startDay" DOUBLE, "sex" INTEGER, "birthdate" DOUBLE, "restingEnergyCalculationMode" INTEGER, "manualInputRestingEnergy" DOUBLE, "activityLevel" INTEGER, "calorieAdjustmentType" INTEGER, "calorieAdjustmentLimit" DOUBLE);
CREATE TABLE "initialSyncAttemptRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "attemptID" TEXT NOT NULL UNIQUE ON CONFLICT REPLACE, "backend" INTEGER NOT NULL, "status" INTEGER NOT NULL, "markerID" TEXT UNIQUE ON CONFLICT REPLACE, "startedAt" DATETIME NOT NULL, "updatedAt" DATETIME NOT NULL, "completedAt" DATETIME, "failureReason" TEXT);
CREATE TABLE "macroGoalStrategyMetaRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "minStartDay" DOUBLE, "maxStartDay" DOUBLE);
CREATE TABLE "macroGoalStrategyRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "strategyID" TEXT UNIQUE ON CONFLICT REPLACE, "cloudKitSystemFields" BLOB, "supabaseSystemFields" BLOB, "version" INTEGER, "dateCreated" DATETIME, "dateLastUpdated" DATETIME, "clock" INTEGER, "startDay" DOUBLE, "mode" INTEGER, "percentagePreset" TEXT, "proteinUnit" TEXT, "proteinValue" DOUBLE, "carbsUnit" TEXT, "carbsValue" DOUBLE, "fatUnit" TEXT, "fatValue" DOUBLE, "toleranceValue" DOUBLE, "toleranceUnit" INTEGER, "isOverride" BOOLEAN);
CREATE TABLE "mealTypeRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "mealTypeID" TEXT UNIQUE ON CONFLICT REPLACE, "cloudKitSystemFields" BLOB, "version" INTEGER, "dateCreated" DATETIME, "dateLastUpdated" DATETIME, "disabled" BOOLEAN, "alwaysShowInLog" BOOLEAN, "name" TEXT, "timeRangeStart" INTEGER, "timeRangeEnd" INTEGER, "sortIndex" INTEGER, "updateCount" INTEGER, "defaultTime" INTEGER, "clock" INTEGER, "supabaseSystemFields" BLOB);
CREATE TABLE "migrationMarkerRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "migration" TEXT UNIQUE ON CONFLICT REPLACE, "completedAt" DATETIME, "sourceAppVersion" TEXT, "sourceBuildNumber" TEXT, "sourcePlatform" TEXT, "cloudKitSystemFields" BLOB, "supabaseSystemFields" BLOB, "version" INTEGER, "dateCreated" DATETIME, "dateLastUpdated" DATETIME, "clock" INTEGER);
CREATE TABLE "pendingEventRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "date" DATETIME NOT NULL, "topic" TEXT NOT NULL, "type" TEXT NOT NULL, "key" BLOB, "value" BLOB NOT NULL, "debugDescription" TEXT);
CREATE TABLE "scanRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "scanID" TEXT NOT NULL UNIQUE ON CONFLICT REPLACE, "cloudKitSystemFields" BLOB, "supabaseSystemFields" BLOB, "version" INTEGER, "dateCreated" DATETIME, "dateLastUpdated" DATETIME, "clock" INTEGER, "day" DOUBLE, "date" DATETIME, "tzID" TEXT, "barcode" TEXT, "note" TEXT);
CREATE TABLE "suggestionSampleRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "foodEntryID" TEXT UNIQUE ON CONFLICT REPLACE, "foodID" TEXT, "groupID" TEXT, "day" DOUBLE, "date" DATETIME, "mealTypeID" TEXT);
CREATE TABLE "supabaseChangeTokenRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL UNIQUE ON CONFLICT REPLACE, "changeToken" TEXT);
CREATE TABLE "syncMarkerRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "markerID" TEXT UNIQUE ON CONFLICT REPLACE, "cloudKitSystemFields" BLOB, "version" INTEGER, "dateCreated" DATETIME, "dateLastUpdated" DATETIME, "updateCount" INTEGER, "clock" INTEGER, "supabaseSystemFields" BLOB);
CREATE TABLE "weightGoalMetaRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "minStartDay" DOUBLE, "maxStartDay" DOUBLE);
CREATE TABLE "weightGoalRecord" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "weightGoalID" TEXT UNIQUE ON CONFLICT REPLACE, "cloudKitSystemFields" BLOB, "supabaseSystemFields" BLOB, "version" INTEGER, "dateCreated" DATETIME, "dateLastUpdated" DATETIME, "clock" INTEGER, "startDay" DOUBLE, "desiredWeightChangePerWeek" DOUBLE, "targetWeight" DOUBLE, "isOverride" BOOLEAN, "startingWeight" DOUBLE, "startingWeightDay" DOUBLE);
CREATE INDEX "activityEntryRecord_on_day_and_activityType" ON "activityEntryRecord"("day", "activityType");
CREATE INDEX activityEntryRecord_on_version
ON activityEntryRecord(version);
CREATE INDEX "bodyMetricEntryMetaRecord_on_maxDay" ON "bodyMetricEntryMetaRecord"("maxDay");
CREATE INDEX "bodyMetricEntryMetaRecord_on_minDay" ON "bodyMetricEntryMetaRecord"("minDay");
CREATE INDEX "bodyMetricEntryRecord_on_day_and_metricType" ON "bodyMetricEntryRecord"("day", "metricType");
CREATE INDEX bodyMetricEntryRecord_on_version
ON bodyMetricEntryRecord(version);
CREATE UNIQUE INDEX bodyProfileRecord_singleton ON bodyProfileRecord((1));
CREATE INDEX "byGoalTypeAndStartDay" ON "goalRuleRecord"("goalType", "startDay");
CREATE UNIQUE INDEX deletedRecords_on_recordName ON deletedRecords(recordName);
CREATE INDEX "energyStrategyRecord_on_startDay" ON "energyStrategyRecord"("startDay");
CREATE INDEX favoriteRecord_on_version
ON favoriteRecord(version);
CREATE INDEX "foodCollectionRecord_on_collectionEditID" ON "foodCollectionRecord"("collectionEditID");
CREATE INDEX "foodCollectionRecord_on_collectionType" ON "foodCollectionRecord"("collectionType");
CREATE INDEX "foodCollectionRecord_on_dateCreated" ON "foodCollectionRecord"("dateCreated");
CREATE INDEX "foodCollectionRecord_on_dateLastUpdated" ON "foodCollectionRecord"("dateLastUpdated");
CREATE INDEX foodCollectionRecord_on_version
ON foodCollectionRecord(version);
CREATE UNIQUE INDEX "foodEntryGroupCollapseStateRecord_on_groupID" ON "foodEntryGroupCollapseStateRecord"("day", "mealTypeID", "otherGroupFirstEntryID");
CREATE INDEX foodEntryRecord_beverages
ON foodEntryRecord(foodID, dateCreated)
WHERE day IS NOT NULL AND (traits & 32) = 32;
CREATE INDEX "foodEntryRecord_on_calories" ON "foodEntryRecord"("calories");
CREATE INDEX "foodEntryRecord_on_collectionEditID" ON "foodEntryRecord"("collectionEditID");
CREATE INDEX "foodEntryRecord_on_date" ON "foodEntryRecord"("date");
CREATE INDEX "foodEntryRecord_on_dateCreated" ON "foodEntryRecord"("dateCreated");
CREATE INDEX "foodEntryRecord_on_dateLastUpdated" ON "foodEntryRecord"("dateLastUpdated");
CREATE INDEX "foodEntryRecord_on_day" ON "foodEntryRecord"("day");
CREATE INDEX "foodEntryRecord_on_foodID" ON "foodEntryRecord"("foodID");
CREATE INDEX "foodEntryRecord_on_traits" ON "foodEntryRecord"("traits");
CREATE INDEX foodEntryRecord_on_version
ON foodEntryRecord(version);
CREATE INDEX "foodRecord_on_dateCreated" ON "foodRecord"("dateCreated");
CREATE INDEX foodRecord_on_version
ON foodRecord(version);
CREATE INDEX goalRecord_on_version
ON goalRecord(version);
CREATE INDEX "goalRuleMetaRecord_on_maxStartDay" ON "goalRuleMetaRecord"("maxStartDay");
CREATE INDEX "goalRuleMetaRecord_on_minStartDay" ON "goalRuleMetaRecord"("minStartDay");
CREATE INDEX "goalRuleRecord_on_dateCreated" ON "goalRuleRecord"("dateCreated");
CREATE INDEX "goalRuleRecord_on_goalType" ON "goalRuleRecord"("goalType");
CREATE INDEX "goalRuleRecord_on_startDay" ON "goalRuleRecord"("startDay");
CREATE INDEX goalRuleRecord_on_version
ON goalRuleRecord(version);
CREATE INDEX "healthProfileMetaRecord_on_maxStartDay" ON "healthProfileMetaRecord"("maxStartDay");
CREATE INDEX "healthProfileMetaRecord_on_minStartDay" ON "healthProfileMetaRecord"("minStartDay");
CREATE INDEX "healthProfileRecord_on_startDay" ON "healthProfileRecord"("startDay");
CREATE INDEX healthProfileRecord_on_version
ON healthProfileRecord(version);
CREATE INDEX "initialSyncAttemptRecord_on_backend_and_status" ON "initialSyncAttemptRecord"("backend", "status");
CREATE INDEX "initialSyncAttemptRecord_on_backend_and_updatedAt" ON "initialSyncAttemptRecord"("backend", "updatedAt");
CREATE INDEX "macroGoalStrategyMetaRecord_on_maxStartDay" ON "macroGoalStrategyMetaRecord"("maxStartDay");
CREATE INDEX "macroGoalStrategyMetaRecord_on_minStartDay" ON "macroGoalStrategyMetaRecord"("minStartDay");
CREATE INDEX "macroGoalStrategyRecord_on_startDay" ON "macroGoalStrategyRecord"("startDay");
CREATE INDEX macroGoalStrategyRecord_on_version
ON macroGoalStrategyRecord(version);
CREATE INDEX mealTypeRecord_on_version
ON mealTypeRecord(version);
CREATE INDEX "scanRecord_on_date" ON "scanRecord"("date");
CREATE INDEX "scanRecord_on_day" ON "scanRecord"("day");
CREATE INDEX scanRecord_on_version
ON scanRecord(version);
CREATE INDEX "suggestionSampleRecord_on_day" ON "suggestionSampleRecord"("day");
CREATE INDEX "suggestionSampleRecord_on_foodID" ON "suggestionSampleRecord"("foodID");
CREATE INDEX "suggestionSampleRecord_on_groupID" ON "suggestionSampleRecord"("groupID");
CREATE INDEX "suggestionSampleRecord_on_mealTypeID" ON "suggestionSampleRecord"("mealTypeID");
CREATE INDEX "weightGoalMetaRecord_on_maxStartDay" ON "weightGoalMetaRecord"("maxStartDay");
CREATE INDEX "weightGoalMetaRecord_on_minStartDay" ON "weightGoalMetaRecord"("minStartDay");
CREATE INDEX "weightGoalRecord_on_startDay" ON "weightGoalRecord"("startDay");
CREATE INDEX weightGoalRecord_on_version
ON weightGoalRecord(version);
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
CREATE TRIGGER update_body_metric_entry_meta_after_delete_body_metric_entry_record
AFTER DELETE ON bodyMetricEntryRecord
BEGIN
    INSERT INTO bodyMetricEntryMetaRecord (metricType, minDay, maxDay)
    VALUES (
        OLD.metricType,
        (
            SELECT day
            FROM bodyMetricEntryRecord
            WHERE metricType = OLD.metricType
            ORDER BY day ASC, dateCreated DESC
            LIMIT 1
        ),
        (
            SELECT day
            FROM bodyMetricEntryRecord
            WHERE metricType = OLD.metricType
            ORDER BY day DESC, dateCreated DESC
            LIMIT 1
        )
    );
END;
CREATE TRIGGER update_body_metric_entry_meta_after_insert_body_metric_entry_record
AFTER INSERT ON bodyMetricEntryRecord
BEGIN
    INSERT INTO bodyMetricEntryMetaRecord (metricType, minDay, maxDay)
    VALUES (
        NEW.metricType,
        (
            SELECT day
            FROM bodyMetricEntryRecord
            WHERE metricType = NEW.metricType
            ORDER BY day ASC, dateCreated DESC
            LIMIT 1
        ),
        (
            SELECT day
            FROM bodyMetricEntryRecord
            WHERE metricType = NEW.metricType
            ORDER BY day DESC, dateCreated DESC
            LIMIT 1
        )
    );
END;
CREATE TRIGGER update_body_metric_entry_meta_after_update_body_metric_entry_record
AFTER UPDATE ON bodyMetricEntryRecord
BEGIN
    INSERT INTO bodyMetricEntryMetaRecord (metricType, minDay, maxDay)
    VALUES (
        NEW.metricType,
        (
            SELECT day
            FROM bodyMetricEntryRecord
            WHERE metricType = NEW.metricType
            ORDER BY day ASC, dateCreated DESC
            LIMIT 1
        ),
        (
            SELECT day
            FROM bodyMetricEntryRecord
            WHERE metricType = NEW.metricType
            ORDER BY day DESC, dateCreated DESC
            LIMIT 1
        )
    );
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
CREATE TRIGGER update_health_profile_meta_after_delete_health_profile_record
AFTER DELETE ON healthProfileRecord
BEGIN
    DELETE FROM healthProfileMetaRecord;
    INSERT INTO healthProfileMetaRecord (minStartDay, maxStartDay)
    VALUES (
        (SELECT startDay FROM healthProfileRecord ORDER BY startDay ASC, dateCreated DESC LIMIT 1),
        (SELECT startDay FROM healthProfileRecord ORDER BY startDay DESC, dateCreated DESC LIMIT 1)
    );
END;
CREATE TRIGGER update_health_profile_meta_after_insert_health_profile_record
AFTER INSERT ON healthProfileRecord
BEGIN
    DELETE FROM healthProfileMetaRecord;
    INSERT INTO healthProfileMetaRecord (minStartDay, maxStartDay)
    VALUES (
        (SELECT startDay FROM healthProfileRecord ORDER BY startDay ASC, dateCreated DESC LIMIT 1),
        (SELECT startDay FROM healthProfileRecord ORDER BY startDay DESC, dateCreated DESC LIMIT 1)
    );
END;
CREATE TRIGGER update_health_profile_meta_after_update_health_profile_record
AFTER UPDATE ON healthProfileRecord
BEGIN
    DELETE FROM healthProfileMetaRecord;
    INSERT INTO healthProfileMetaRecord (minStartDay, maxStartDay)
    VALUES (
        (SELECT startDay FROM healthProfileRecord ORDER BY startDay ASC, dateCreated DESC LIMIT 1),
        (SELECT startDay FROM healthProfileRecord ORDER BY startDay DESC, dateCreated DESC LIMIT 1)
    );
END;
CREATE TRIGGER update_macro_goal_strategy_meta_after_delete_macro_goal_strategy_record
AFTER DELETE ON macroGoalStrategyRecord
BEGIN
    DELETE FROM macroGoalStrategyMetaRecord;
    INSERT INTO macroGoalStrategyMetaRecord (minStartDay, maxStartDay)
    VALUES (
        (
            SELECT startDay
            FROM macroGoalStrategyRecord
            WHERE (isOverride IS NULL OR isOverride = 0)
            ORDER BY startDay ASC, dateCreated DESC
            LIMIT 1
        ),
        (
            SELECT startDay
            FROM macroGoalStrategyRecord
            WHERE (isOverride IS NULL OR isOverride = 0)
            ORDER BY startDay DESC, dateCreated DESC
            LIMIT 1
        )
    );
END;
CREATE TRIGGER update_macro_goal_strategy_meta_after_insert_macro_goal_strategy_record
AFTER INSERT ON macroGoalStrategyRecord
BEGIN
    DELETE FROM macroGoalStrategyMetaRecord;
    INSERT INTO macroGoalStrategyMetaRecord (minStartDay, maxStartDay)
    VALUES (
        (
            SELECT startDay
            FROM macroGoalStrategyRecord
            WHERE (isOverride IS NULL OR isOverride = 0)
            ORDER BY startDay ASC, dateCreated DESC
            LIMIT 1
        ),
        (
            SELECT startDay
            FROM macroGoalStrategyRecord
            WHERE (isOverride IS NULL OR isOverride = 0)
            ORDER BY startDay DESC, dateCreated DESC
            LIMIT 1
        )
    );
END;
CREATE TRIGGER update_macro_goal_strategy_meta_after_update_macro_goal_strategy_record
AFTER UPDATE ON macroGoalStrategyRecord
BEGIN
    DELETE FROM macroGoalStrategyMetaRecord;
    INSERT INTO macroGoalStrategyMetaRecord (minStartDay, maxStartDay)
    VALUES (
        (
            SELECT startDay
            FROM macroGoalStrategyRecord
            WHERE (isOverride IS NULL OR isOverride = 0)
            ORDER BY startDay ASC, dateCreated DESC
            LIMIT 1
        ),
        (
            SELECT startDay
            FROM macroGoalStrategyRecord
            WHERE (isOverride IS NULL OR isOverride = 0)
            ORDER BY startDay DESC, dateCreated DESC
            LIMIT 1
        )
    );
END;
CREATE TRIGGER update_weight_goal_meta_after_delete_weight_goal_record
AFTER DELETE ON weightGoalRecord
BEGIN
    DELETE FROM weightGoalMetaRecord;
    INSERT INTO weightGoalMetaRecord (minStartDay, maxStartDay)
    VALUES (
        (
            SELECT startDay
            FROM weightGoalRecord
            WHERE (isOverride IS NULL OR isOverride = 0)
            ORDER BY startDay ASC, dateCreated DESC
            LIMIT 1
        ),
        (
            SELECT startDay
            FROM weightGoalRecord
            WHERE (isOverride IS NULL OR isOverride = 0)
            ORDER BY startDay DESC, dateCreated DESC
            LIMIT 1
        )
    );
END;
CREATE TRIGGER update_weight_goal_meta_after_insert_weight_goal_record
AFTER INSERT ON weightGoalRecord
BEGIN
    DELETE FROM weightGoalMetaRecord;
    INSERT INTO weightGoalMetaRecord (minStartDay, maxStartDay)
    VALUES (
        (
            SELECT startDay
            FROM weightGoalRecord
            WHERE (isOverride IS NULL OR isOverride = 0)
            ORDER BY startDay ASC, dateCreated DESC
            LIMIT 1
        ),
        (
            SELECT startDay
            FROM weightGoalRecord
            WHERE (isOverride IS NULL OR isOverride = 0)
            ORDER BY startDay DESC, dateCreated DESC
            LIMIT 1
        )
    );
END;
CREATE TRIGGER update_weight_goal_meta_after_update_weight_goal_record
AFTER UPDATE ON weightGoalRecord
BEGIN
    DELETE FROM weightGoalMetaRecord;
    INSERT INTO weightGoalMetaRecord (minStartDay, maxStartDay)
    VALUES (
        (
            SELECT startDay
            FROM weightGoalRecord
            WHERE (isOverride IS NULL OR isOverride = 0)
            ORDER BY startDay ASC, dateCreated DESC
            LIMIT 1
        ),
        (
            SELECT startDay
            FROM weightGoalRecord
            WHERE (isOverride IS NULL OR isOverride = 0)
            ORDER BY startDay DESC, dateCreated DESC
            LIMIT 1
        )
    );
END;
