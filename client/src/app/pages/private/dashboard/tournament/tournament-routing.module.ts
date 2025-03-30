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
  }, {
    path: 'fantasy/:matchId',
    component: FantasyComponent,
    data: { title: 'Fantasy' },
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TournamentRoutingModule { }
