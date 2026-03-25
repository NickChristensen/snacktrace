export interface NutrientRecord {
  alcohol: number
  caffeine: number
  calcium: number
  calories: number
  carbs: number
  cholesterol: number
  copper: number
  fat: number
  fatMonounsaturated: number
  fatPolyunsaturated: number
  fatSaturated: number
  fatTrans: number
  fiber: number
  folate: number
  iron: number
  magnesium: number
  manganese: number
  niacin: number
  pantothenicAcid: number
  phosphorus: number
  potassium: number
  protein: number
  riboflavin: number
  selenium: number
  sodium: number
  sugars: number
  thiamin: number
  vitaminA: number
  vitaminB12: number
  vitaminB6: number
  vitaminC: number
  vitaminD: number
  vitaminE: number
  vitaminK: number
  water: number
  zinc: number
}

export interface FoodEntryTable {
  id: number
  entryID: string
  date: string
  day: number
  mealTypeID: string
  name: string
  calories: number
  quantity: number
  baseAmount: number
  baseUnit: string
  nutrients: string // JSON text
  foodID: string
  brandOwner: string | null
  barcode: string | null
  source: string | null
}

export interface FoodTable {
  id: number
  foodID: string
  name: string
  brandOwner: string | null
  baseUnit: string
  baseAmount: number
  calories: number // derived — not a real column, use nutrients
  nutrients: string // JSON text
  source: string | null
  barcode: string | null
  isHidden: number
}

export interface MealTypeTable {
  id: number
  mealTypeID: string
  name: string | null
  sortIndex: number
  disabled: number
  timeRangeStart: number | null
  timeRangeEnd: number | null
}

export interface GoalTable {
  id: number
  goalID: string
  goalType: string
  sortIndex: number
}

export interface GoalRuleTable {
  id: number
  ruleID: string
  goalType: string
  mode: number
  lowerBound: number | null
  upperBound: number | null
  dayOfWeek: number | null
  isOverride: number
  startDay: number | null
}

export interface FoodCollectionTable {
  id: number
  name: string
}

export interface DatabaseSchema {
  foodEntryRecord: FoodEntryTable
  foodRecord: FoodTable
  mealTypeRecord: MealTypeTable
  goalRecord: GoalTable
  goalRuleRecord: GoalRuleTable
  foodCollectionRecord: FoodCollectionTable
}
