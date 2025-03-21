import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TournamentRoutingModule } from './tournament-routing.module';
import { PointsTableComponent } from './points-table/points-table.component';
import { SeasonPointsTableComponent } from './season-points-table/season-points-table.component';
import { ResultsComponent } from './results/results.component';
import { SummaryComponent } from './summary/summary.component';
import { RulesComponent } from './rules/rules.component';

@NgModule({
  declarations: [
    PointsTableComponent,
    SeasonPointsTableComponent,
    ResultsComponent,
    SummaryComponent,
    RulesComponent,
  ],
  imports: [CommonModule, TournamentRoutingModule],
})
export class TournamentModule {}
