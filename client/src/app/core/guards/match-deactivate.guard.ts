import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { MatchService } from '../services/match.service';
import { map } from 'rxjs/operators';

export const matchDeactivateGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const matchService = inject(MatchService);
  const router = inject(Router);

  const matchId = (route.paramMap.get('matchId'));

  return matchService.getMatchByMatchId(matchId ?? '').pipe(
    map((match) => {
      const isActive = match.data.active
      if (!isActive) {
        return true;
      } else {
        router.navigate([`/u/tournament/fantasy/${match.data.id}`]);
        return false;
      }
    })
  );
};
