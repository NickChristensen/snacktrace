<div align="center">
  <img src="images/snacktrace-iOS-Default-64x64@2x.png" width="64" alt="snacktrace logo" />

  # snacktrace
</div>

A CLI for querying your [FoodNoms](https://www.foodnoms.com/) nutrition data. Reads directly from the local FoodNoms SQLite database and outputs JSON — designed to be piped, scripted, or fed into other tools.

Query a day's meals and goal progress, drill into a date range, or search your food history.

<!-- commands -->
* [`snacktrace day [DATE]`](#snacktrace-day-date)
* [`snacktrace day foods [DATE]`](#snacktrace-day-foods-date)
* [`snacktrace day goals [DATE]`](#snacktrace-day-goals-date)
* [`snacktrace day meals [DATE]`](#snacktrace-day-meals-date)
* [`snacktrace foods`](#snacktrace-foods)
* [`snacktrace foods show FOODID`](#snacktrace-foods-show-foodid)
* [`snacktrace goals`](#snacktrace-goals)
* [`snacktrace range FROM TO`](#snacktrace-range-from-to)
* [`snacktrace range days FROM TO`](#snacktrace-range-days-from-to)
* [`snacktrace range goals FROM TO`](#snacktrace-range-goals-from-to)
* [`snacktrace search QUERY`](#snacktrace-search-query)

## `snacktrace day [DATE]`

Full summary for a day: goals, meals, and foods

```
USAGE
  $ snacktrace day [DATE] [--json]

ARGUMENTS
  [DATE]  [default: today] Date to query (YYYY-MM-DD, "today", or "yesterday")

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Full summary for a day: goals, meals, and foods
```

## `snacktrace day foods [DATE]`

Flat list of all foods consumed on a day

```
USAGE
  $ snacktrace day foods [DATE] [--json]

ARGUMENTS
  [DATE]  [default: today] Date to query (YYYY-MM-DD, "today", or "yesterday")

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Flat list of all foods consumed on a day
```

## `snacktrace day goals [DATE]`

Goal progress for a day

```
USAGE
  $ snacktrace day goals [DATE] [--json]

ARGUMENTS
  [DATE]  [default: today] Date to query (YYYY-MM-DD, "today", or "yesterday")

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Goal progress for a day
```

## `snacktrace day meals [DATE]`

Entries grouped by meal for a day

```
USAGE
  $ snacktrace day meals [DATE] [--json]

ARGUMENTS
  [DATE]  [default: today] Date to query (YYYY-MM-DD, "today", or "yesterday")

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Entries grouped by meal for a day
```

## `snacktrace foods`

Browse distinct foods from your entry history

```
USAGE
  $ snacktrace foods [--json] [-l <value>] [-o <value>]

FLAGS
  -l, --limit=<value>   [default: 50] Number of results to return
  -o, --offset=<value>  Offset for pagination

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Browse distinct foods from your entry history
```

## `snacktrace foods show FOODID`

Full nutrient detail for a food by foodID

```
USAGE
  $ snacktrace foods show FOODID [--json]

ARGUMENTS
  FOODID  foodID of the food to show

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Full nutrient detail for a food by foodID
```

## `snacktrace goals`

Show configured nutrition goals

```
USAGE
  $ snacktrace goals [--json]

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Show configured nutrition goals
```

## `snacktrace range FROM TO`

Summary over a date range: totals, averages, and per-day breakdown

```
USAGE
  $ snacktrace range FROM TO [--json]

ARGUMENTS
  FROM  Start date (YYYY-MM-DD)
  TO    End date (YYYY-MM-DD)

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Summary over a date range: totals, averages, and per-day breakdown
```

## `snacktrace range days FROM TO`

Per-day nutrient totals over a date range

```
USAGE
  $ snacktrace range days FROM TO [--json]

ARGUMENTS
  FROM  Start date (YYYY-MM-DD)
  TO    End date (YYYY-MM-DD)

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Per-day nutrient totals over a date range
```

## `snacktrace range goals FROM TO`

Goal progress over a date range with per-day breakdown and averages

```
USAGE
  $ snacktrace range goals FROM TO [--json]

ARGUMENTS
  FROM  Start date (YYYY-MM-DD)
  TO    End date (YYYY-MM-DD)

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Goal progress over a date range with per-day breakdown and averages
```

## `snacktrace search QUERY`

Search foods by name across your entry history

```
USAGE
  $ snacktrace search QUERY [--json] [-l <value>]

ARGUMENTS
  QUERY  Search term

FLAGS
  -l, --limit=<value>  [default: 20] Maximum number of results

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Search foods by name across your entry history
```
<!-- commandsstop -->
