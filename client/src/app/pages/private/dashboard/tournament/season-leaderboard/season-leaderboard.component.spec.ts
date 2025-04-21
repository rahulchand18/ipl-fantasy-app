import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeasonLeaderboardComponent } from './season-leaderboard.component';

describe('SeasonLeaderboardComponent', () => {
  let component: SeasonLeaderboardComponent;
  let fixture: ComponentFixture<SeasonLeaderboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SeasonLeaderboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SeasonLeaderboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
