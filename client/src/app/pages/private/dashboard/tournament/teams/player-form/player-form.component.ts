import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatchService } from 'src/app/core/services/match.service';

@Component({
  selector: 'app-player-form',
  templateUrl: './player-form.component.html',
  styleUrl: './player-form.component.scss',
})
export class PlayerFormComponent {
  playerForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private matchService: MatchService,
    private dialogRef: MatDialogRef<PlayerFormComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { editMode: boolean; playerData: any; team: any }
  ) {
    this.playerForm = this.fb.group({
      id: [''],
      name: [''],
      role: [''],
      battingStyle: [''],
      bowlingStyle: [''],
      country: [''],
      playerImg: ['https://h.cricapi.com/img/icon512.png'],
    });

    if (data.editMode) {
      this.playerForm.patchValue({
        id: data.playerData.id,
        name: data.playerData.name,
        role: data.playerData.role,
        battingStyle: data.playerData.battingStyle,
        bowlingStyle: data.playerData.bowlingStyle,
        country: data.playerData.country,
        playerImg: data.playerData.playerImg,
      });
    }
  }

  saveDetails() {
    const { value } = this.playerForm;
    this.matchService.addPlayers(this.data.team._id, value).subscribe((res) => {
      this.dialogRef.close(res);
    });
  }
}
