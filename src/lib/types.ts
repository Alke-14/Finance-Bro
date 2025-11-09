export interface TargetDemographic {
  age_group: string;
  income_range: string;
  urbanicity: string;
  family_stage: string;
  environment_consciousness: string;
  [key: string]: string | undefined;
}

export interface Result {
  id?: string | number;
  model: string;
  year: number;
  msrp: number;
  score: number;
  seats: number;
  segment: string;
  fuel: string;
  mpgOrRange: string;
  summary: string;
  features: string[];
  buildLink?: string;
  target_demographic: TargetDemographic;
  // allow additional fields from the stored object
  [key: string]: any;
}
