export type BillStatus =
  | 'introduced'
  | 'committee'
  | 'passed_chamber'
  | 'signed'
  | 'vetoed'
  | 'failed'
  | 'monitoring';

export type BillScope = 'federal' | string;

export interface WaterBill {
  id: string;
  title: string;
  shortTitle: string;
  scope: BillScope;
  status: BillStatus;
  sponsor?: string;
  date: string;
  summary: string;
  url: string;
  tags: string[];
  aiRelated: boolean;
}

export interface LegislationResponse {
  bills: WaterBill[];
  lastUpdated: string;
  totalBills: number;
  byStatus: Record<BillStatus, number>;
  byScope: { federal: number; state: number };
}
