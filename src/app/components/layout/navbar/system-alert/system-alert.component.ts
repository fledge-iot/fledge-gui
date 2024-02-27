import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-system-alert',
  templateUrl: './system-alert.component.html',
  styleUrls: ['./system-alert.component.css']
})

export class SystemAlertComponent {
  @Input() alertCount: number;

  ngOnInit() { }
}
