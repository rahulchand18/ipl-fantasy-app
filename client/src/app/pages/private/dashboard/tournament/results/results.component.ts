import { Component } from '@angular/core';
import { MatchService } from 'src/app/core/services/match.service';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrl: './results.component.scss'
})
export class ResultsComponent {

  results!: any;
  constructor(private matchService: MatchService) {
    this.getAllSeries()

  }
  getAllSeries() {
    this.matchService.getAllSeries().subscribe(res => {
      this.results = res.data
    })
  }

  formatArray(arr: string[]): string {
    return arr && arr.length ? arr.join(', ') : 'N/A';
  }

}
