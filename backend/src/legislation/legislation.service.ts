import { Injectable } from '@nestjs/common';
import { WATER_BILLS } from './legislation.data';
import { WaterBill, BillStatus, LegislationResponse } from './legislation.types';

@Injectable()
export class LegislationService {
  private readonly lastUpdated = '2026-02-23';

  getAll(aiOnly?: boolean): LegislationResponse {
    const bills = aiOnly ? WATER_BILLS.filter((b) => b.aiRelated) : WATER_BILLS;

    const byStatus = bills.reduce((acc, bill) => {
      acc[bill.status] = (acc[bill.status] ?? 0) + 1;
      return acc;
    }, {} as Record<BillStatus, number>);

    const byScope = bills.reduce(
      (acc, bill) => {
        if (bill.scope === 'federal') acc.federal++;
        else acc.state++;
        return acc;
      },
      { federal: 0, state: 0 },
    );

    return {
      bills,
      lastUpdated: this.lastUpdated,
      totalBills: bills.length,
      byStatus,
      byScope,
    };
  }

  getById(id: string): WaterBill | null {
    return WATER_BILLS.find((b) => b.id === id) ?? null;
  }
}
