import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/core/auth/auth.service';
import { MatchService } from 'src/app/core/services/match.service';

@Component({
  selector: 'app-fantasy-leaderboard',
  templateUrl: './fantasy-leaderboard.component.html',
  styleUrl: './fantasy-leaderboard.component.scss',
})
export class FantasyLeaderboardComponent {
  @ViewChild('previewSection') previewSection!: ElementRef;

  matchId!: string;
  allPredictions: any;
  selectedTeam: any;
  bestTeam = false;
  match: any;

  constructor(
    private matchService: MatchService,
    private route: ActivatedRoute,
    public authService: AuthService
  ) {
    this.route.params.subscribe((params) => {
      if (params['matchId']) {
        this.matchId = params['matchId'];
        this.getAllPredictionsByMatch();
        this.getMatchByMatchId();
      }
    });
  }
  selectTeam(item: any) {
    this.bestTeam = false;
    this.selectedTeam = item;

    // Scroll to the preview section smoothly
    setTimeout(() => {
      this.previewSection?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 200);
  }

  goBack() {
    window.history.back();
  }

  getAllPredictionsByMatch() {
    this.matchService
      .getAllPredictionsByMatch(this.matchId)
      .subscribe((res) => {
        this.allPredictions = res.data;
      });
  }

  getMatchByMatchId() {
    this.matchService.getMatchByMatchId(this.matchId).subscribe((res) => {
      this.match = res.data;
      if (this.match.history) {
        this.getDreamTeam();
      }
    });
  }

  getDreamTeam() {
    console.log(this.match);
    this.bestTeam = true;
    this.matchService.getDreamTeam(this.matchId).subscribe({
      next: (res) => {
        this.selectedTeam = {};
        this.selectedTeam.players = res.data;
        this.selectedTeam.captain = res.data.find(
          (player: { isCaptain: boolean }) => player.isCaptain === true
        );
        this.selectedTeam.viceCaptain = res.data.find(
          (player: { isViceCaptain: boolean }) => player.isViceCaptain === true
        );
      },
    });
  }
}
