import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible) {
      <div class="toast" [class.toast-ok]="tipo === 'ok'" [class.toast-error]="tipo === 'error'">
        {{ mensaje }}
      </div>
    }
  `,
  styles: [`
    .toast {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      padding: 0.85rem 1.8rem;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      z-index: 2000;
      box-shadow: 0 6px 20px rgba(0,0,0,0.15);
      animation: toastIn 0.3s ease;
    }
    .toast-ok { background: #059669; color: white; }
    .toast-error { background: #dc2626; color: white; }
    @keyframes toastIn {
      from { opacity: 0; transform: translateX(-50%) translateY(20px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
  `]
})
export class ToastComponent implements OnChanges {
  @Input() mensaje = '';
  @Input() tipo: 'ok' | 'error' = 'ok';
  @Input() mostrar = false;
  visible = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['mostrar'] && this.mostrar) {
      this.visible = true;
      setTimeout(() => this.visible = false, 3000);
    }
  }
}