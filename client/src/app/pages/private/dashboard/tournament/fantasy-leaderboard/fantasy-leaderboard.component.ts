import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/core/auth/auth.service';
import { MatchService } from 'src/app/core/services/match.service';

@Component({
  selector: 'app-fantasy-leaderboard',
  templateUrl: './fantasy-leaderboard.component.html',
  styleUrl: './fantasy-leaderboard.component.scss'
})
export class FantasyLeaderboardComponent {

  @ViewChild('previewSection') previewSection!: ElementRef;

  matchId!: string;
  allPredictions: any;
  selectedTeam: any;

  constructor(private matchService: MatchService, private route: ActivatedRoute, public authService: AuthService) {

    this.route.params.subscribe((params) => {
      console.log(params)
      if (params['matchId']) {
        this.matchId = params['matchId'];
        this.getAllPredictionsByMatch()
      }
    })

  }
  selectTeam(item: any) {
    this.selectedTeam = item;

    // Scroll to the preview section smoothly
    setTimeout(() => {
      this.previewSection?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }

  goBack() {
    window.history.back();
  }



  getAllPredictionsByMatch() {
    this.matchService.getAllPredictionsByMatch(this.matchId).subscribe(res => {
      this.allPredictions = res.data
    })
  }

}
