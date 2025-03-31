import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { matchActiveGuard } from './match-active.guard';

describe('matchActiveGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => matchActiveGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
