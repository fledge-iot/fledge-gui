import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  OnDestroy,
  Renderer2,
  TemplateRef,
  Injector,
  ApplicationRef,
  EmbeddedViewRef,
  OnInit,
  SimpleChanges
} from '@angular/core';

@Component({
  selector: 'app-popover',
  template: `<ng-template #popoverTemplate>
    <div class="popover-content"
         (mouseenter)="onPopoverMouseEnter()"
         (mouseleave)="onPopoverMouseLeave()">
      <ng-content></ng-content>
    </div>
  </ng-template>`,
  styleUrls: ['./popover.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopoverComponent implements OnInit, OnDestroy {
  @ViewChild('popoverTemplate', { static: true }) popoverTemplate: TemplateRef<any>;

  @Input() position: 'top' | 'bottom' | 'left' | 'right' | 'auto' = 'auto';
  @Input() trigger: 'hover' | 'click' = 'hover';
  @Input() offset: number = 10;
  @Input() hideDelay: number = 300;

  @Output() popoverShown = new EventEmitter<void>();
  @Output() popoverHidden = new EventEmitter<void>();

  private popoverRef: EmbeddedViewRef<any> | null = null;
  private hideTimeout: any;
  private isVisible = false;
  private triggerElement: HTMLElement | null = null;

  constructor(
    private renderer: Renderer2,
    private appRef: ApplicationRef,
    private injector: Injector
  ) { }

  ngOnInit() {
    // Component initialization
  }

  ngOnChanges(changes: SimpleChanges) {
    // no-op
  }

  ngOnDestroy() {
    this.hide();
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
  }

  /**
   * Show the popover relative to the trigger element
   */
  show(triggerElement: HTMLElement): void {
    if (this.isVisible) {
      return;
    }

    // Clear any existing hide timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    this.triggerElement = triggerElement;
    this.createPopover();
    this.isVisible = true;
    this.popoverShown.emit();

  }

  /**
   * Hide the popover with optional delay
   */
  hide(delay: number = 0): void {
    if (!this.isVisible) {
      return;
    }

    if (delay > 0) {
      this.hideTimeout = setTimeout(() => {
        this.destroyPopover();
      }, delay);
    } else {
      this.destroyPopover();
    }
  }

  /**
   * Hide popover with configured delay
   */
  hideWithDelay(): void {
    this.hide(this.hideDelay);
  }

  /**
   * Cancel any pending hide operation
   */
  keepVisible(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  /**
   * Handle mouse enter on popover content
   */
  onPopoverMouseEnter(): void {
    this.keepVisible();
  }

  /**
   * Handle mouse leave on popover content
   */
  onPopoverMouseLeave(): void {
    this.hideWithDelay();
  }

  /**
 * Create and position the popover
 */
  private createPopover(): void {
    if (!this.triggerElement || !this.popoverTemplate) {
      return;
    }

    // Create embedded view from template
    const embeddedView = this.popoverTemplate.createEmbeddedView({});
    this.appRef.attachView(embeddedView);

    // Get the DOM element
    const popoverElement = (embeddedView.rootNodes[0] as HTMLElement);

    // Add to document body
    document.body.appendChild(popoverElement);

    // Position the popover
    this.positionPopover(popoverElement);

    // Store reference for cleanup
    this.popoverRef = embeddedView;
  }

  /**
   * Position popover relative to trigger element
   */
  private positionPopover(popoverElement: HTMLElement): void {
    if (!this.triggerElement) {
      return;
    }

    // Defer DOM reads/writes to the next animation frame to avoid layout thrashing
    requestAnimationFrame(() => {
      const triggerRect = this.triggerElement!.getBoundingClientRect();
      const popoverRect = popoverElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let top = 0;
      let left = 0;
      let transformX = '0%';
      let transformY = '0%';
      let finalPosition = this.position;

      if (this.position === 'auto') {
        const spaceAbove = triggerRect.top;
        const spaceBelow = viewportHeight - triggerRect.bottom;
        const spaceLeft = triggerRect.left;
        const spaceRight = viewportWidth - triggerRect.right;

        if (spaceAbove >= popoverRect.height + this.offset && spaceAbove >= spaceBelow) {
          finalPosition = 'top';
        } else if (spaceBelow >= popoverRect.height + this.offset) {
          finalPosition = 'bottom';
        } else if (spaceRight >= popoverRect.width + this.offset) {
          finalPosition = 'right';
        } else {
          finalPosition = 'left';
        }
      }

      switch (finalPosition) {
        case 'top':
          left = triggerRect.left + (triggerRect.width / 2);
          top = triggerRect.top - this.offset;
          transformX = '-50%';
          transformY = '-100%';
          break;
        case 'bottom':
          left = triggerRect.left + (triggerRect.width / 2);
          top = triggerRect.bottom + this.offset;
          transformX = '-50%';
          transformY = '0%';
          break;
        case 'left':
          left = triggerRect.left - this.offset;
          top = triggerRect.top + (triggerRect.height / 2);
          transformX = '-100%';
          transformY = '-50%';
          break;
        case 'right':
          left = triggerRect.right + this.offset;
          top = triggerRect.top + (triggerRect.height / 2);
          transformX = '0%';
          transformY = '-50%';
          break;
      }

      const margin = 10;
      left = Math.max(margin, Math.min(left, viewportWidth - margin));
      top = Math.max(margin, Math.min(top, viewportHeight - margin));

      this.renderer.setStyle(popoverElement, 'position', 'fixed');
      this.renderer.setStyle(popoverElement, 'left', `${left}px`);
      this.renderer.setStyle(popoverElement, 'top', `${top}px`);
      this.renderer.setStyle(popoverElement, 'transform', `translate(${transformX}, ${transformY})`);
      this.renderer.setStyle(popoverElement, 'z-index', '99999');
      this.renderer.addClass(popoverElement, `popover-${finalPosition}`);
    });
  }

  /**
 * Remove popover from DOM and clean up
 */
  private destroyPopover(): void {
    if (this.popoverRef) {
      // Remove from DOM
      this.popoverRef.rootNodes.forEach((node: HTMLElement) => {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      });

      // Detach view
      this.appRef.detachView(this.popoverRef);
      this.popoverRef.destroy();
      this.popoverRef = null;
    }

    this.isVisible = false;
    this.triggerElement = null;
    this.popoverHidden.emit();
  }

  /**
   * Check if popover is currently visible
   */
  get visible(): boolean {
    return this.isVisible;
  }
}
