import { Component, Input, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatchService } from 'src/app/core/services/match.service';

@Component({
  selector: 'app-tournament-configuration',
  templateUrl: './tournament-configuration.component.html',
  styleUrl: './tournament-configuration.component.scss',
})
export class TournamentConfigurationComponent implements OnInit {
  tournament!: any;
  allSeries!: any;
  allTeams!: any;
  matchForm!: FormGroup;
  mostCatchesArray!: FormArray;
  mostRunsArray!: FormArray;
  mostWicketsArray!: FormArray;
  mostSixesArray!: FormArray;
  createMatch = false;
  team1: any;
  team2: any;
  editFormValue: any;
  updateMatch = false;
  history = false
  constructor(
    private route: ActivatedRoute,
    private matchService: MatchService,
    private fb: FormBuilder
  ) {
    this.route.queryParams.subscribe((params) => {
      if (params['tournamentId']) {
        this.getTournamentByTournamentId(params['tournamentId']);
      }
    });
  }
  ngOnInit(): void {
    this.getAllTeamInfo();
    this.getAllSeries();
  }

  getTournamentByTournamentId(tournamentId: string) {
    this.matchService
      .getTournamentByTournamentId(tournamentId)
      .subscribe((res) => {
        this.tournament = res.data;
      });
  }

  createMatchForm() {
    this.matchForm = this.fb.group({
      id: ['', Validators.required],
      matchType: ['ipl'],
      date: [''],
      status: ['Match has not started yet.'],
      t1: [''],
      t2: [''],
      t1s: [''],
      t2s: [''],
      tossWinner: [''],
      matchWinner: [''],
      manOfTheMatch: [''],
      mostCatches: this.fb.array([]),
      mostRuns: this.fb.array([]),
      mostWickets: this.fb.array([]),
      mostSixes: this.fb.array([]),
    });
    this.mostCatchesArray = this.matchForm.get('mostCatches') as FormArray;
    this.mostRunsArray = this.matchForm.get('mostRuns') as FormArray;
    this.mostWicketsArray = this.matchForm.get('mostWickets') as FormArray;
    this.mostSixesArray = this.matchForm.get('mostSixes') as FormArray;
    if (this.updateMatch) {
      this.patchValuesToForm(this.editFormValue);
    }
  }

  getAllTeamInfo() {
    this.matchService.getAllTeamInfo().subscribe((res) => {
      this.allTeams = res.data;
    });
  }

  updateStatus(accept: boolean, requestId: string) {
    this.matchService
      .updateRequest(this.tournament.tournamentId, requestId, accept)
      .subscribe({
        next: (res) => {
          this.getTournamentByTournamentId(this.tournament.tournamentId);
        },
      });
  }

  getAllSeries(history?: boolean, fullList?: boolean) {
    this.updateMatch = false
    this.matchService.getAllSeries({ history, fullList, viewAsAdmin: true }).subscribe({
      next: (res) => {
        this.allSeries = res.data;
      },
    });
  }

  addMostCatchesField() {
    (this.matchForm.get('mostCatches') as FormArray).push(this.fb.control(''));
  }

  addMostRunsField() {
    (this.matchForm.get('mostRuns') as FormArray).push(this.fb.control(''));
  }

  addMostWicketsField() {
    (this.matchForm.get('mostWickets') as FormArray).push(this.fb.control(''));
  }

  addMostSixesField() {
    (this.matchForm.get('mostSixes') as FormArray).push(this.fb.control(''));
  }

  getControls(array: any) {
    return this.matchForm.controls[array] as AbstractControl;
  }

  saveMatch({ valid, value }: FormGroup) {
    if (valid) {
      if (this.updateMatch) {
        this.matchService
          .updateMatch(this.editFormValue._id, value)
          .subscribe((res) => {
            this.createMatch = false;
            this.getAllSeries();
          });
      } else {
        this.matchService.createMatch(value).subscribe((res) => {
          this.createMatch = false;
          this.getAllSeries();
        });
      }
    }
  }

  patchValuesToForm(values: any) {
    this.matchForm.patchValue({
      id: values.id,
      matchType: values.matchType,
      date: values.date,
      status: values.status,
      t1: values.t1,
      t2: values.t2,
      t1s: values.t1s,
      t2s: values.t2s,
      tossWinner: values.tossWinner,
      matchWinner: values.matchWinner,
      manOfTheMatch: values.manOfTheMatch,
    });

    this.patchFormArrayValues(this.mostCatchesArray, values.mostCatches);
    this.patchFormArrayValues(this.mostRunsArray, values.mostRuns);
    this.patchFormArrayValues(this.mostWicketsArray, values.mostWickets);
    this.patchFormArrayValues(this.mostSixesArray, values.mostSixes);
  }

  patchFormArrayValues(array: FormArray, values: any[]) {
    array.clear();
    if (values && values.length > 0) {
      values.forEach((value) => {
        array.push(this.fb.control(value));
      });
    }
  }

  updateActiveStatus(id: string, isActive: boolean) {
    this.matchService.updateActiveStatus(id, isActive).subscribe(() => {
      this.getAllSeries();
    });
  }

  updateMatchStatus(id: string, isActive: boolean) {
    this.matchService.updateMatchStatus(id, isActive).subscribe(() => {
      this.getAllSeries();
    });
  }

  updateCompleteStatus(id: string, history: boolean, matchId: string) {
    this.matchService
      .updateCompleteStatus(id, history, matchId)
      .subscribe(() => {
        this.getAllSeries();
      });
  }

  calculate(matchId: string) {
    this.matchService.calculate(matchId).subscribe((res) => { });
  }
}
