import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  templateUrl: './auth-layout.component.html',
})
export class AuthLayoutComponent {
  router = inject(Router);
  getTitle() {
    const title = this.router.url;
    if ( title === '/auth/register') {
      return true;
    }
    return false;
  }

}
