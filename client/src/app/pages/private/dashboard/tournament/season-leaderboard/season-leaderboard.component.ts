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
    this.rankColumns = ['1st', '2nd', '3rd', '4th', '5th', 'last'];
  }

  getLeaderboard() {
    this.matchService.getLeaderBoardMatrix().subscribe((res) => {
      console.log(res);
      this.leaderboard = res.data;
    });
  }
}
