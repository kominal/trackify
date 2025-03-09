import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../components/header/header.component';

@Component({
  selector: 'app-shell',
  imports: [HeaderComponent, RouterModule],
  templateUrl: './shell.component.html',
  host: { class: 'h-full flex flex-col' },
})
export class ShellComponent {}
