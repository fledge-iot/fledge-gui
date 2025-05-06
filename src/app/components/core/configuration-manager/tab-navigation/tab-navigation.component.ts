import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from "@angular/core";
import { StorageService } from '../../../../services/storage.service';

@Component({
  selector: 'app-tab-navigation',
  templateUrl: './tab-navigation.component.html',
  styleUrls: ['./tab-navigation.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabNavigationComponent {

  currentTab = {};
  @Input() tabs: string[] = [];
  activeTab = 0;
  @Output() selectedTabEvent = new EventEmitter<any>();

  constructor(private cdrf: ChangeDetectorRef,
    private storageService: StorageService
  ) { }

  prevTab() {
    this.activeTab--;
    this.setCurrentTab();
  }

  nextTab() {
    if (this.isLastTab()) {
      return;
    }
    this.activeTab++;
    this.setCurrentTab();
  }

  setCurrentTab() {
    this.currentTab = this.tabs[this.activeTab];
    this.storageService.setActiveTab('ACTIVE_CONFIG_TAB', this.currentTab['key']);
    this.selectedTabEvent.emit(this.currentTab);
  }

  isFirstTab() {
    return this.activeTab === 0;
  }

  isLastTab() {
    return this.activeTab === this.tabs.length - 1;
  }

  setTab(index: number) {
    this.activeTab = index;
    this.currentTab = this.tabs[index];
    this.cdrf.detectChanges();
  }
}

