import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PrivateRoutingModule } from './private-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MATERIAL_MODULE } from 'src/app/core/constants/material';
import { TournamentFormComponent } from './dashboard/tournament-form/tournament-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TournamentComponent } from './dashboard/tournament/tournament.component';
import { TournamentConfigurationComponent } from './dashboard/tournament-configuration/tournament-configuration.component';
import { PrivateComponent } from './private.component';
import { PredictionComponent } from './dashboard/tournament/prediction/prediction.component';
import { AlertComponent } from './dashboard/alert/alert.component';

@NgModule({
  declarations: [
    DashboardComponent,
    TournamentFormComponent,
    TournamentComponent,
    TournamentConfigurationComponent,
    PrivateComponent,
    PredictionComponent,
    AlertComponent,
  ],
  imports: [
    CommonModule,
    PrivateRoutingModule,
    ...MATERIAL_MODULE,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class PrivateModule {}
