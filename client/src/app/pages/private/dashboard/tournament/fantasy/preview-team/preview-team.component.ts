import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-preview-team',
  templateUrl: './preview-team.component.html',
  styleUrl: './preview-team.component.scss'
})
export class PreviewTeamComponent {

  @Input() selectedPlayers: any;
  @Input() captain!: string;
  @Input() viceCaptain!: string;
  @Input() showPoints: boolean = false;


  points(player: any): number {
    if (player.isCaptain) {
      return player.points * 2;
    }
    if (player.isViceCaptain) {
      return player.points * 1.5;
    }
    return player.points;
  }

}
