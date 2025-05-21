import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TournamentComponent } from './tournament.component';
import { TournamentConfigurationComponent } from '../tournament-configuration/tournament-configuration.component';
import { PredictionComponent } from './prediction/prediction.component';
import { PointsTableComponent } from './points-table/points-table.component';
import { SeasonPointsTableComponent } from './season-points-table/season-points-table.component';
import { ResultsComponent } from './results/results.component';
import { SummaryComponent } from './summary/summary.component';
import { RulesComponent } from './rules/rules.component';
import { FantasyComponent } from './fantasy/fantasy.component';
import { matchActiveGuard } from 'src/app/core/guards/match-active.guard';
import { FantasyLeaderboardComponent } from './fantasy-leaderboard/fantasy-leaderboard.component';
import { matchDeactivateGuard } from 'src/app/core/guards/match-deactivate.guard';
import { SeasonLeaderboardComponent } from './season-leaderboard/season-leaderboard.component';
import { TeamsComponent } from './teams/teams.component';

const routes: Routes = [
  {
    path: '',
    component: TournamentComponent,
    data: { title: 'Tournament' },
    title: 'Dashboard',
    children: [
      {
        path: 'prediction',
        component: PredictionComponent,
      },
      {
        path: 'points-table',
        component: PointsTableComponent,
      },
      {
        path: 'season-points-table',
        component: SeasonPointsTableComponent,
      },
      {
        path: 'match-results',
        component: ResultsComponent,
      },
      {
        path: 'match-summary',
        component: SummaryComponent,
      },
      {
        path: 'rules',
        component: RulesComponent,
      },
    ],
  },
  {
    path: 'configuration',
    component: TournamentConfigurationComponent,
    data: { title: 'Tournament' },
    title: 'Dashboard',
  },
  {
    path: 'fantasy/:matchId',
    component: FantasyComponent,
    canActivate: [matchActiveGuard],
    data: { title: 'Fantasy' },
  },
  {
    path: 'fantasy-leaderboard/:matchId',
    component: FantasyLeaderboardComponent,
    canActivate: [matchDeactivateGuard],
    data: { title: 'Fantasy Leaderboard' },
  },
  {
    path: 'leaderboard-matrix',
    component: SeasonLeaderboardComponent,
    data: { title: 'Season Matrix' },
  },
  {
    path: 'teams',
    component: TeamsComponent,
    data: { title: 'Teams' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TournamentRoutingModule {}
