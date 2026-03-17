import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const authenticated = await supabase.isAuthenticated();
  if (!authenticated) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};
