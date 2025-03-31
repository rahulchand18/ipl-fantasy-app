import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewTeamComponent } from './preview-team.component';

describe('PreviewTeamComponent', () => {
  let component: PreviewTeamComponent;
  let fixture: ComponentFixture<PreviewTeamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PreviewTeamComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PreviewTeamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
