import { KeyValue } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-rules',
  templateUrl: './rules.component.html',
  styleUrl: './rules.component.scss',
})
export class RulesComponent {
  breakdowns: Record<number, { first: number; second: number; third: number }> = {
    4: { first: 40, second: 0, third: 0 },
    5: { first: 40, second: 10, third: 0 },
    6: { first: 50, second: 10, third: 0 },
    7: { first: 50, second: 20, third: 0 },
    8: { first: 50, second: 20, third: 10 },
    9: { first: 60, second: 20, third: 10 },
    10: { first: 60, second: 30, third: 10 },
    11: { first: 70, second: 30, third: 10 },
    12: { first: 80, second: 30, third: 10 },
    13: { first: 80, second: 40, third: 10 },
    14: { first: 90, second: 40, third: 10 },
    15: { first: 100, second: 40, third: 10 }
  };

  // Fix: Convert keys to numbers before sorting
  originalOrder = (a: KeyValue<string, any>, b: KeyValue<string, any>): number => {
    return Number(a.key) - Number(b.key); // Convert keys to numbers for proper sorting
  };
}
