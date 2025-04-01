import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { matchDeactivateGuard } from './match-deactivate.guard';

describe('matchDeactivateGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => matchDeactivateGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
