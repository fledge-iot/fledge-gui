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
  @Input() from: string;
  @Input() sourceName: string;
  activeTab = 0;
  @Output() selectedTabEvent = new EventEmitter<any>();

  constructor(private cdrf: ChangeDetectorRef,
    private storageService: StorageService
  ) { }

  prevTab() {
    this.activeTab--;
    this.setCurrentTab();
    this.scrollToActiveTab();
  }

  nextTab() {
    if (this.isLastTab()) {
      return;
    }
    this.activeTab++;
    this.setCurrentTab();
    this.scrollToActiveTab();
  }

  setCurrentTab() {
    this.currentTab = this.tabs[this.activeTab];
    this.storageService.setSessionItem('ACTIVE_CONFIG_TAB', this.currentTab['key']);
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

  private scrollToActiveTab() {
    setTimeout(() => {
      const idSuffix = this.from + '_' + this.sourceName;
      const selectedTabElement = document.querySelector(`[id="group_navigation_${idSuffix}"] li.is-active`);
      const navContainer = document.getElementById(`group_navigation_${idSuffix}`);

      if (selectedTabElement && navContainer) {
        const tabRect = selectedTabElement.getBoundingClientRect();
        const containerRect = navContainer.getBoundingClientRect();

        // Check if tab is not fully visible in the container
        const isTabVisible = (
          tabRect.left >= containerRect.left &&
          tabRect.right <= containerRect.right
        );
        if (!isTabVisible) {
          selectedTabElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });
        }
      }
    }, 200);
  }
}
