import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TournamentRoutingModule } from './tournament-routing.module';
import { PointsTableComponent } from './points-table/points-table.component';
import { SeasonPointsTableComponent } from './season-points-table/season-points-table.component';
import { ResultsComponent } from './results/results.component';
import { SummaryComponent } from './summary/summary.component';
import { RulesComponent } from './rules/rules.component';
import { FantasyComponent } from './fantasy/fantasy.component';
import { MATERIAL_MODULE } from 'src/app/core/constants/material';
import { PreviewTeamComponent } from './fantasy/preview-team/preview-team.component';
import { FantasyLeaderboardComponent } from './fantasy-leaderboard/fantasy-leaderboard.component';

@NgModule({
  declarations: [
    PointsTableComponent,
    SeasonPointsTableComponent,
    ResultsComponent,
    SummaryComponent,
    RulesComponent,
    FantasyComponent,
    PreviewTeamComponent,
    FantasyLeaderboardComponent,
  ],
  imports: [CommonModule, TournamentRoutingModule, ...MATERIAL_MODULE],
})
export class TournamentModule { }
