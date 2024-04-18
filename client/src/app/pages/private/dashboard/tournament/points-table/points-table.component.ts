import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/core/auth/auth.service';
import { MatchService } from 'src/app/core/services/match.service';

@Component({
  selector: 'app-points-table',
  templateUrl: './points-table.component.html',
  styleUrl: './points-table.component.scss',
})
export class PointsTableComponent {
  matchId!: string;

  players: any;
  match: any;
  predictions: any;
  constructor(
    private matchService: MatchService,
    public authService: AuthService,
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe((params) => {
      if (params['matchId']) {
        this.matchId = params['matchId'];
        this.getPointsTable(this.matchId);
        this.getAllPredictions(this.matchId);
        this.getMatchByMatchId();
      }
    });
  }

  getPointsTable(matchId: string) {
    this.matchService.getPointsTable(matchId).subscribe({
      next: (res) => {
        this.players = res.data;
      },
      error: (err) => {
        this.players = [];
      },
    });
  }

  getAllPredictions(matchId: string) {
    this.matchService.getAllPredictions(matchId).subscribe({
      next: (res) => {
        this.predictions = res.data;
      },
      error: (err) => {
        this.predictions = [];
      },
    });
  }

  getMatchByMatchId() {
    this.matchService.getMatchByMatchId(this.matchId).subscribe((response) => {
      this.match = response.data;
    });
  }
}
