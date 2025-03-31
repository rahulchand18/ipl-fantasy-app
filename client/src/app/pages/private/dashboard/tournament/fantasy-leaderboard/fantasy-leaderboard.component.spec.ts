import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FantasyLeaderboardComponent } from './fantasy-leaderboard.component';

describe('FantasyLeaderboardComponent', () => {
  let component: FantasyLeaderboardComponent;
  let fixture: ComponentFixture<FantasyLeaderboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FantasyLeaderboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FantasyLeaderboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
