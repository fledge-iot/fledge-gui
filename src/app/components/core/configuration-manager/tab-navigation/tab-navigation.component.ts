import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
  selector: 'app-tab-navigation',
  templateUrl: './tab-navigation.component.html',
  styleUrls: ['./tab-navigation.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabNavigationComponent {

  currentTab = '';
  @Input() tabs: string[] = [];
  activeTab = 0;
  @Output() selectedTabEvent = new EventEmitter<string>();

  constructor(private cdrf: ChangeDetectorRef) { }

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

