import { Component } from '@angular/core';
import { AuthService } from 'src/app/core/auth/auth.service';
import { MatchService } from 'src/app/core/services/match.service';

@Component({
  selector: 'app-season-points-table',
  templateUrl: './season-points-table.component.html',
  styleUrl: './season-points-table.component.scss',
})
export class SeasonPointsTableComponent {
  table: any;
  sortType = 'asc'

  constructor(
    private matchService: MatchService,
    public authService: AuthService
  ) {
    this.getPointsTable();
  }

  getPointsTable() {
    this.matchService.getSeasonPointsTable().subscribe({
      next: (res) => {
        this.table = res.data;
      },
    });
  }

  sortDirection: 'asc' | 'desc' = 'asc';

  sortBy(field: string) {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';

    this.table.sort((a: any, b: any) => {
      let avgA = a.total / a.matches;
      let avgB = b.total / b.matches;

      return this.sortDirection === 'asc' ? avgA - avgB : avgB - avgA;
    });
  }

}
