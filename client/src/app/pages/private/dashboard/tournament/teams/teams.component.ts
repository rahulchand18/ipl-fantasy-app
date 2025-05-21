import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatchService } from 'src/app/core/services/match.service';
import { PlayerFormComponent } from './player-form/player-form.component';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss',
})
export class TeamsComponent implements OnInit {
  teams: any;

  constructor(private matchService: MatchService, private dialog: MatDialog) {}
  ngOnInit(): void {
    this.getAllTeamInfo();
  }

  getAllTeamInfo() {
    this.matchService.getAllTeamInfo().subscribe((res) => {
      this.teams = res.data;
    });
  }

  openPlayerForm(team: any, editMode?: boolean, playerData?: any) {
    this.dialog
      .open(PlayerFormComponent, {
        width: '50%',
        data: {
          editMode,
          playerData,
          team,
        },
      })
      .afterClosed()
      .subscribe((res) => {
        this.getAllTeamInfo();
      });
  }
  trackByFn(index: number, item: any): number {
    return item.id;
  }
}
