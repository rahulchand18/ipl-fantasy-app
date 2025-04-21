import { Component } from '@angular/core';
import { AuthService } from 'src/app/core/auth/auth.service';
import { MatchService } from 'src/app/core/services/match.service';

@Component({
  selector: 'app-season-leaderboard',
  templateUrl: './season-leaderboard.component.html',
  styleUrl: './season-leaderboard.component.scss',
})
export class SeasonLeaderboardComponent {
  constructor(
    private matchService: MatchService,
    public authService: AuthService
  ) {}

  leaderboard: any;
  rankColumns: any;

  ngOnInit() {
    this.getLeaderboard();
    this.rankColumns = Array.from({ length: 20 }, (_, i) => {
      const n = i + 1;
      if (n === 1) return '1st';
      if (n === 2) return '2nd';
      if (n === 3) return '3rd';
      return `${n}th`;
    });
  }

  getLeaderboard() {
    this.matchService.getLeaderBoardMatrix().subscribe((res) => {
      console.log(res);
      this.leaderboard = res.data;
    });
  }
}
