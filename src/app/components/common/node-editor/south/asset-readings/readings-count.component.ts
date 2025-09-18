import { Component, Input } from '@angular/core';
import { FlowEditorService } from '../../flow-editor.service';

@Component({
    selector: 'readings-count',
    templateUrl: './readings-count.component.html',
    styleUrls: ['./readings-count.component.css'],
    standalone: false
})
export class ReadingsCountComponent {
  @Input() readingCount: string;
  @Input() assetCount: string;
  @Input() serviceName;
  @Input() debug: any = {};

  constructor(public flowEditorService: FlowEditorService) { }

  showReadingsPerAsset() {
    this.flowEditorService.showItemsInQuickview.next({ showReadings: true, serviceName: this.serviceName });
  }
}
