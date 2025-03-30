import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { URL_CONSTANT } from '../constants';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root',
})
export class MatchService {
  constructor(private http: HttpService) { }

  getAllSeries(query?: {
    history?: boolean;
    fullList?: boolean;
    viewAsAdmin?: boolean;
  }): Observable<any> {
    console.log(query)
    return this.http.get('/getAllSeries', query);
  }

  getAllTournaments(type: string, email: string): Observable<any> {
    return this.http.get(`/getAllTournaments/${type}/${email}`);
  }

  createTournament(data: any): Observable<any> {
    return this.http.post(`/createNewTournament`, { tournament: data });
  }

  joinTournament(
    tournamentId: string,
    data: { email: string; name: string }
  ): Observable<any> {
    return this.http.post(`/joinTournament/${tournamentId}`, data);
  }

  getTournamentByTournamentId(tournamentId: string): Observable<any> {
    return this.http.get(`/getTournamentByTournamentId/${tournamentId}`);
  }

  getAllTeamInfo(): Observable<any> {
    return this.http.get(`/getAllTeamInfo`);
  }

  updateRequest(
    tournamentId: string,
    requestId: string,
    accept: boolean
  ): Observable<any> {
    return this.http.put(
      `/updateRequest/${tournamentId}/${requestId}/${accept}`
    );
  }
  createMatch(match: any): Observable<any> {
    return this.http.post(`/createMatch`, { match });
  }
  updateMatch(id: string, match: any): Observable<any> {
    return this.http.put(`/updateMatch/${id}`, { updatedData: match });
  }
  updateActiveStatus(id: string, active: boolean): Observable<any> {
    return this.http.put(`/updateActiveStatus/${id}`, { active });
  }
  updateMatchStatus(id: string, active: boolean): Observable<any> {
    return this.http.put(`/updateMatchStatus/${id}`, { active });
  }
  updateCompleteStatus(
    id: string,
    history: boolean,
    matchId: string
  ): Observable<any> {
    return this.http.put(`/updateCompleteStatus/${id}`, { history, matchId });
  }
  getPrediction(matchId: string, email: string): Observable<any> {
    return this.http.get(`/getPrediction/${matchId}/${email}`);
  }
  getPlayers(matchId: string): Observable<any> {
    return this.http.get(`/getPlayers/${matchId}`);
  }
  getPlayersForFantasy(matchId: string): Observable<any> {
    return this.http.get(`/getPlayersForFantasy/${matchId}`);
  }
  updatePrediction(body: any): Observable<any> {
    return this.http.put(`/updatePrediction/`, body);
  }
  createPrediction(body: any): Observable<any> {
    return this.http.post(`/createPrediction/`, body);
  }
  calculate(matchId: string): Observable<any> {
    return this.http.put(`/calculate/${matchId}`);
  }
  getPointsTable(matchId: string): Observable<any> {
    return this.http.get(`/getPointsTable/${matchId}`);
  }
  getAllPredictions(matchId: string): Observable<any> {
    return this.http.get(`/getAllPredictions/${matchId}`);
  }
  getBalanceById(email: string): Observable<any> {
    return this.http.get(`/getBalanceById/${email}`);
  }
  getAllUsers(): Observable<any> {
    return this.http.get(`/getAllUsers`);
  }
  addDeductBalance(body: any): Observable<any> {
    return this.http.post(`/addDeductBalance/`, body);
  }
  getSeasonPointsTable(): Observable<any> {
    return this.http.get(`/getSeasonPointsTable/`);
  }
  getMatchByMatchId(matchId: string): Observable<any> {
    return this.http.get(`/getMatchByMatchId/${matchId}`);
  }
  getSummary(): Observable<any> {
    return this.http.get(`/getSummary`);
  }
  getNotifications(email: string): Observable<any> {
    return this.http.get(`/getNotifications/${email}`);
  }
}
