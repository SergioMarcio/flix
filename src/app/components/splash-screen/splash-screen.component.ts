import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash-screen.component.html',
  styleUrl: './splash-screen.component.scss'
})
export class SplashScreenComponent implements OnInit {
  @Output() done = new EventEmitter<void>();

  visible = true;
  hiding = false;

  ngOnInit(): void {
    setTimeout(() => {
      this.hiding = true;
      setTimeout(() => {
        this.visible = false;
        this.done.emit();
      }, 700);
    }, 2200);
  }
}
