import { AsyncPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SplashScreenComponent } from './components/splash-screen/splash-screen.component';
import { SupabaseService } from './services/supabase.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, AsyncPipe, SplashScreenComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  splashDone = false;

  constructor(public supabase: SupabaseService, private router: Router) { }

  ngOnInit(): void {
    this.router.navigate(['/']);
  }
}
