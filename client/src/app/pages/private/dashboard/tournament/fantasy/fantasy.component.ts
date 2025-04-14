import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/core/auth/auth.service';
import { MatchService } from 'src/app/core/services/match.service';

interface Player {
  id: string;
  name: string;
  role: string;
  isCaptain: boolean;
  isViceCaptain: boolean;
  img: string;
  team: string;
  points?: number;
}

@Component({
  selector: 'app-fantasy',
  templateUrl: './fantasy.component.html',
  styleUrl: './fantasy.component.scss',
})
export class FantasyComponent implements OnInit {
  matchId!: string;
  teams: any;
  players: any;
  selectedPlayers: Player[] = [];
  captain = '';
  viceCaptain = '';
  selectedTab = 0;
  loading = false;

  loginUser = this.authService.getUserData();

  selectedCounts: { [key: string]: number } = {}; // Tracks count per tab

  constructor(
    private route: ActivatedRoute,
    private matchService: MatchService,
    private snackbar: MatSnackBar,
    private authService: AuthService
  ) {
    this.route.params.subscribe((params) => {
      this.matchId = params['matchId'];
      this.getPlayers(this.matchId);
    });
  }

  ngOnInit(): void {
    this.getAllPredictionsByMatch();
  }

  getPlayers(matchId: string) {
    this.matchService.getPlayersForFantasy(matchId).subscribe((res) => {
      this.players = res.data;
    });
  }

  checkInArray(player: any): boolean {
    return this.selectedPlayers.some((p) => p.id === player.id);
  }

  pushIntoSelected(player: any, tabId: string) {
    this.selectedPlayers.push({
      id: player.id,
      name: player.name,
      role: player.role,
      isCaptain: this.captain === player.id,
      isViceCaptain: this.viceCaptain === player.id,
      img: player.playerImg,
      team: player.team,
    });
    this.selectedCounts[tabId] = (this.selectedCounts[tabId] || 0) + 1;
  }

  removeFromArray(player: any, tabId: string) {
    this.selectedPlayers = this.selectedPlayers.filter(
      (p) => p.id !== player.id
    );
    if (this.selectedCounts[tabId] > 0) {
      this.selectedCounts[tabId]--;
    }
  }

  getFilteredPlayers(role: string): Player[] {
    return this.selectedPlayers.filter((player) => player.role === role);
  }

  saveTeam() {
    if (this.selectedPlayers.length !== 11) {
      this.snackbar.open('Please select 11 players', 'Close', {
        duration: 3000,
      });
      return;
    }

    const typeCount: { [key: string]: number } = {};

    this.selectedPlayers.forEach((player) => {
      typeCount[player.role] = (typeCount[player.role] || 0) + 1;
    });

    if (!typeCount['WK-Batsman'] || typeCount['WK-Batsman'] < 1) {
      this.snackbar.open('Please select at least 1 WK-Batsman', 'Close', {
        duration: 3000,
      });
      return;
    }
    if (!typeCount['Batsman'] || typeCount['Batsman'] < 2) {
      this.snackbar.open('Please select at least 2 Batsman', 'Close', {
        duration: 3000,
      });
      return;
    }
    if (!typeCount['Allrounder'] || typeCount['Allrounder'] < 1) {
      this.snackbar.open('Please select at least 1 All-Rounder', 'Close', {
        duration: 3000,
      });
      return;
    }
    if (!typeCount['Bowler'] || typeCount['Bowler'] < 2) {
      this.snackbar.open('Please select at least 2 Bowler', 'Close', {
        duration: 3000,
      });
      return;
    }

    const teamCounts: { [key: string]: number } = {};

    this.selectedPlayers.forEach((player) => {
      teamCounts[player.team] = (teamCounts[player.team] || 0) + 1;
    });

    for (const team in teamCounts) {
      if (teamCounts[team] > 6) {
        this.snackbar.open(
          `You cannot select more than 6 players from ${team}!`,
          'Close',
          {
            duration: 3000,
          }
        );
        return;
      }
    }
    if (!this.captain) {
      this.snackbar.open('Please select one captain', 'Close', {
        duration: 3000,
      });
      return;
    }
    if (!this.viceCaptain) {
      this.snackbar.open('Please select one vice-captain', 'Close', {
        duration: 3000,
      });
      return;
    }
    this.selectedPlayers.forEach((player) => {
      player.isCaptain = false;
    });
    this.selectedPlayers.forEach((player) => {
      player.isViceCaptain = false;
    });
    let captainUpdated = false;
    let viceCaptainUpdated = false;
    let captainToUpdate = this.selectedPlayers.find(
      (player) => player.id === this.captain
    );
    if (captainToUpdate) {
      captainToUpdate.isCaptain = true;
      captainUpdated = true;
    }

    let viceCaptainToUpdate = this.selectedPlayers.find(
      (player) => player.id === this.viceCaptain
    );
    if (viceCaptainToUpdate) {
      viceCaptainToUpdate.isViceCaptain = true;
      viceCaptainUpdated = true;
    }
    console.log(captainToUpdate, viceCaptainToUpdate);
    if (!captainUpdated || !viceCaptainUpdated) {
      this.snackbar.open(
        'Please select one captain and one vice-captain',
        'Close',
        {
          duration: 3000,
        }
      );
      return;
    }

    const teamData = {
      email: this.loginUser.email,
      matchId: this.matchId,
      players: this.selectedPlayers,
    };
    this.loading = true;

    this.matchService.addNewFantasyTeam(teamData).subscribe((res) => {
      this.loading = false;

      this.snackbar.open(res.message, 'Close', {
        duration: 3000,
      });
      this.getAllPredictionsByMatch();
    });
  }

  getAllPredictionsByMatch() {
    this.matchService
      .getOnePrediction(this.matchId, this.loginUser.email)
      .subscribe((res) => {
        this.selectedPlayers = res.data.players;
        this.selectedPlayers.forEach((player) => {
          if (player.isCaptain) {
            console.log(player);
            this.captain = player.id;
          }
          if (player.isViceCaptain) {
            this.viceCaptain = player.id;
          }
        });
      });
  }
}
