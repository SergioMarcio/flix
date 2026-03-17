import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  menuOpen = false;
  userEmail: string | null = null;

  private sub?: Subscription;

  constructor(private supabase: SupabaseService, private router: Router) { }

  ngOnInit(): void {
    this.sub = this.supabase.currentUser$.subscribe(user => {
      this.userEmail = user?.email ?? null;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  async logout(): Promise<void> {
    await this.supabase.signOut();
    this.menuOpen = false;
    this.router.navigate(['/login']);
  }
}
