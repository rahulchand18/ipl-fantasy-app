import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from 'src/app/core/auth/auth.service';
import { MatchService } from 'src/app/core/services/match.service';
import { TournamentFormComponent } from './tournament-form/tournament-form.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AlertComponent } from './alert/alert.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  currentUser: any;
  allSeries: any;
  selected = 'joined';
  tournaments!: any;
  joinClicked = false;
  tournamentId = '';
  selectedTournament = '';
  balance!: number;
  allUsers: any;
  statements: any;
  amount = 0;
  notifications: any = [];

  constructor(
    private authService: AuthService,
    private matchService: MatchService,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private router: Router
  ) {
    this.currentUser = authService.getUserData();
  }
  ngOnInit(): void {
    this.getAllSeries();
    this.getAllTournaments();
    this.getBalanceById();
    this.getAllUsers();
    this.getNotifications();
  }

  getBalanceById(email?: string) {
    this.matchService
      .getBalanceById(email ?? this.currentUser.email)
      .subscribe((res) => {
        this.balance = res.data.balance;
        this.statements = res.data.statements;

        if (this.balance < 0) {
          this.dialog.open(AlertComponent, {
            data: {
              message: 'Your balance is negative. Please settle the outstanding amount to maintain a positive balance.',
              title: 'Balance Alert!!',
              balance: this.balance,
            }, panelClass: 'custom-dialog-container'

          })
        }
      });
  }

  logout() {
    this.authService.logout();
    this.authService.navigateToLogin();
  }

  getAllSeries() {
    this.matchService.getAllSeries().subscribe({
      next: (res) => {
        this.allSeries = res.data;
      },
    });
  }

  getAllTournaments() {
    this.matchService
      .getAllTournaments(this.selected, this.currentUser.email)
      .subscribe({
        next: (res) => {
          this.tournaments = res.data;
        },
        error: (err) => {
          this.tournaments = [];
        },
      });
  }

  openCreateForm() {
    this.dialog
      .open(TournamentFormComponent, {
        width: '50%',
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.getAllTournaments();
        }
      });
  }

  joinTournament() {
    this.matchService
      .joinTournament(this.tournamentId, {
        email: this.currentUser.email,
        name: this.currentUser.fullName,
      })
      .subscribe({
        next: (res) => {
          this.joinClicked = false;
          this.getAllTournaments();
          this.snackbar.open(res.message, 'Close');
        },
        error: (err) => {
          this.snackbar.open(err.message, 'Close');
        },
      });
  }

  openTournamentPage(tournament: any) {
    if (tournament.tournamentAdmin === this.currentUser.email) {
      this.router.navigate([`/u/tournament/configuration`], {
        queryParams: { tournamentId: tournament.tournamentId },
      });
    } else {
      this.router.navigate([`/u/tournament`], {
        queryParams: { tournamentId: tournament.tournamentId },
      });
    }
  }

  getAllUsers() {
    this.matchService.getAllUsers().subscribe((res) => {
      this.allUsers = res.data;
    });
  }

  userBalance(email: string) {
    this.matchService
      .getBalanceById(email ?? this.currentUser.email)
      .subscribe((res) => {
        return res.data.balance;
      });
  }

  updateBalance(balance: number, email: string, action: string) {
    this.matchService
      .addDeductBalance({
        email,
        balance,
        action,
        remarks: 'admin',
      })
      .subscribe((res) => {
        this.getAllUsers();
      });
  }
  getNotifications() {
    this.matchService
      .getNotifications(this.currentUser.email)
      .subscribe((res) => {
        this.notifications = res.data;
      });
  }
}
