import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ConfigurationControlService, ConfigurationService, RolesService } from '../../../../services';
import { DeveloperFeaturesService } from '../../../../services/developer-features.service';
import { chain, cloneDeep } from 'lodash';

@Component({
  selector: 'app-configuration-group',
  templateUrl: './configuration-group.component.html',
  styleUrls: ['./configuration-group.component.css']
})
export class ConfigurationGroupComponent implements AfterViewInit {

  selectedGroup = 'Default Configuration';
  @Input() category;
  groups = [];

  @Output() changedConfigEvent = new EventEmitter<any>();
  @Output() formStatusEvent = new EventEmitter<boolean>();
  @Output() changedAdvanceConfigEvent = new EventEmitter<any>();

  // To hold the changed configuration values of a plugin
  configFormValues = {};

  pages = ['south', 'north', 'notification'];
  @Input() from;
  categoryKey = '';

  advanceConfiguration: any
  securityConfiguration: any;
  changedAdvanceConfiguration: any;
  changedSecurityConfiguration: any;

  constructor(
    public developerFeaturesService: DeveloperFeaturesService,
    public rolesService: RolesService,
    private configService: ConfigurationService,
    private configurationControlService: ConfigurationControlService,
  ) { }

  ngAfterViewInit() {

    var SETTINGS = {
      navBarTravelling: false,
      navBarTravelDirection: "",
      navBarTravelDistance: 150
    }

    var colours = {
      0: "#fead00"
      /*
      Add Numbers And Colors if you want to make each tab's indicator in different color for eg:
      1: "#FF0000",
      2: "#00FF00", and so on...
      */
    }

    var AdvancerLeft2 = document.getElementById("AdvancerLeft2");
    var AdvancerRight2 = document.getElementById("AdvancerRight2");

    var Indicator2 = document.getElementById("Indicator2");
    var ProductNav2 = document.getElementById("ProductNav2");
    var ProductNavContents2 = document.getElementById("ProductNavContents2");
    ProductNav2.setAttribute("data-overflowing", this.determineOverflow(ProductNavContents2, ProductNav2));
    this.moveIndicator2(ProductNav2.querySelector("[aria-selected=\"true\"]"), colours[0]);
    // Handle the scroll of the horizontal container
    var last_known_scroll_position = 0;
    var ticking = false;

    ProductNav2.addEventListener("scroll", () => {
      last_known_scroll_position = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.doSomething();
          ticking = false;
        });
      }
      ticking = true;
    });

    AdvancerLeft2.addEventListener("click", () => {
      // If in the middle of a move return
      if (SETTINGS.navBarTravelling === true) {
        return;
      }
      // If we have content overflowing both sides or on the left
      if (this.determineOverflow(ProductNavContents2, ProductNav2) === "left" || this.determineOverflow(ProductNavContents2, ProductNav2) === "both") {
        // Find how far this panel has been scrolled
        var availableScrollLeft = ProductNav2.scrollLeft;
        // If the space available is less than two lots of our desired distance, just move the whole amount
        // otherwise, move by the amount in the settings
        if (availableScrollLeft < SETTINGS.navBarTravelDistance * 2) {
          ProductNavContents2.style.transform = "translateX(" + availableScrollLeft + "px)";
        } else {
          ProductNavContents2.style.transform = "translateX(" + SETTINGS.navBarTravelDistance + "px)";
        }
        // We do want a transition (this is set in CSS) when moving so remove the class that would prevent that
        ProductNavContents2.classList.remove("ProductNav_Contents-no-transition");
        // Update our settings
        SETTINGS.navBarTravelDirection = "left";
        SETTINGS.navBarTravelling = true;
      }
      // Now update the attribute in the DOM
      ProductNav2.setAttribute("data-overflowing", this.determineOverflow(ProductNavContents2, ProductNav2));
    });

    AdvancerRight2.addEventListener("click", () => {
      // If in the middle of a move return
      if (SETTINGS.navBarTravelling === true) {
        return;
      }
      // If we have content overflowing both sides or on the right
      if (this.determineOverflow(ProductNavContents2, ProductNav2) === "right" || this.determineOverflow(ProductNavContents2, ProductNav2) === "both") {
        // Get the right edge of the container and content
        var navBarRightEdge = ProductNavContents2.getBoundingClientRect().right;
        var navBarScrollerRightEdge = ProductNav2.getBoundingClientRect().right;
        // Now we know how much space we have available to scroll
        var availableScrollRight = Math.floor(navBarRightEdge - navBarScrollerRightEdge);
        // If the space available is less than two lots of our desired distance, just move the whole amount
        // otherwise, move by the amount in the settings
        if (availableScrollRight < SETTINGS.navBarTravelDistance * 2) {
          ProductNavContents2.style.transform = "translateX(-" + availableScrollRight + "px)";
        } else {
          ProductNavContents2.style.transform = "translateX(-" + SETTINGS.navBarTravelDistance + "px)";
        }
        // We do want a transition (this is set in CSS) when moving so remove the class that would prevent that
        ProductNavContents2.classList.remove("ProductNav_Contents-no-transition");
        // Update our settings
        SETTINGS.navBarTravelDirection = "right";
        SETTINGS.navBarTravelling = true;
      }
      // Now update the attribute in the DOM
      ProductNav2.setAttribute("data-overflowing", this.determineOverflow(ProductNavContents2, ProductNav2));
    });

    ProductNavContents2.addEventListener(
      "transitionend",
      function () {
        // get the value of the transform, apply that to the current scroll position (so get the scroll pos first) and then remove the transform
        var styleOfTransform = window.getComputedStyle(ProductNavContents2, null);
        var tr = styleOfTransform.getPropertyValue("-webkit-transform") || styleOfTransform.getPropertyValue("transform");
        // If there is no transition we want to default to 0 and not null
        var amount = Math.abs(parseInt(tr.split(",")[4]) || 0);
        ProductNavContents2.style.transform = "none";
        ProductNavContents2.classList.add("ProductNav_Contents-no-transition");
        // Now lets set the scroll position
        if (SETTINGS.navBarTravelDirection === "left") {
          ProductNav2.scrollLeft = ProductNav2.scrollLeft - amount;
        } else {
          ProductNav2.scrollLeft = ProductNav2.scrollLeft + amount;
        }
        SETTINGS.navBarTravelling = false;
      },
      false
    );


  }

  doSomething() {

    var ProductNav2 = document.getElementById("ProductNav2");
    var ProductNavContents2 = document.getElementById("ProductNavContents2");
    ProductNav2.setAttribute("data-overflowing", this.determineOverflow(ProductNavContents2, ProductNav2));
  }

  // var count = 0;
  moveIndicator2(item, color) {
    var Indicator2 = document.getElementById("Indicator2");
    var textPosition = item.getBoundingClientRect();
    var ProductNavContents2 = document.getElementById("ProductNavContents2");
    var container = ProductNavContents2.getBoundingClientRect().left;
    var distance = textPosition.left - container;
    var scroll = ProductNavContents2.scrollLeft;
    Indicator2.style.transform = "translateX(" + (distance + scroll) + "px) scaleX(" + textPosition.width * 0.01 + ")";
    // count = count += 100;
    // Indicator.style.transform = "translateX(" + count + "px)";

    if (color) {
      Indicator2.style.backgroundColor = color;
    }
  }

  determineOverflow(content, container) {
    var containerMetrics = container.getBoundingClientRect();
    var containerMetricsRight = Math.floor(containerMetrics.right);
    var containerMetricsLeft = Math.floor(containerMetrics.left);
    var contentMetrics = content.getBoundingClientRect();
    var contentMetricsRight = Math.floor(contentMetrics.right);
    var contentMetricsLeft = Math.floor(contentMetrics.left);
    if (containerMetricsLeft > contentMetricsLeft && containerMetricsRight < contentMetricsRight) {
      return "both";
    } else if (contentMetricsLeft < containerMetricsLeft) {
      return "left";
    } else if (contentMetricsRight > containerMetricsRight) {
      return "right";
    } else {
      return "none";
    }
  }

  ngOnChanges() {
    this.categeryConfiguration();
    this.getChildConfigData();
  }

  public updateCategroyConfig(config) {
    this.category.config = config;
    this.getChildConfigData();
    this.categeryConfiguration();
  }

  categeryConfiguration() {
    this.groups = [];
    const configItems = Object.keys(this.category.config).map(k => {
      this.category.config[k].key = k;
      return this.category.config[k];
    });

    this.groups = chain(configItems).groupBy(x => x.group).map((v, k) => {
      if (k != "undefined") {
        return { category: this.category.name, group: k, config: Object.assign({}, ...v.map(vl => { return { [vl.key]: vl } })) }
      } else {
        return { category: this.category.name, group: "Default Configuration", config: Object.assign({}, ...v.map(vl => { return { [vl.key]: vl } })) }
      }
    }).value();
  }

  /**
   * Set configuration of the selected child category
   * @param category Object{key, description, displayName}
   */
  selectTab(tab: string) {
    if (tab !== this.selectedGroup) {
      this.selectedGroup = tab;
    }
  }

  public getChildConfigData() {
    // No advance configuration on add form
    if (this.pages.includes(this.from) && this.category) {
      this.categoryKey = this.category.name;
      this.checkIfAdvanceConfig(this.category.name)
    }
  }

  checkIfAdvanceConfig(categoryName: string) {
    this.configService.getCategoryConfigChildren(categoryName).
      subscribe(
        (data: any) => {
          const categoryChildren = data.categories?.filter(cat => (cat.key == `${this.categoryKey}Advanced`) || (cat.key == `${this.categoryKey}Security`));
          categoryChildren.forEach(cat => {
            // Set group of advance/security configuration
            cat.group = cat?.key.includes(`${this.categoryKey}Advanced`) ? 'Advanced Configuration' :
              (cat?.key.includes(`${this.categoryKey}Security`) ? 'Security Configuration' : cat?.displayName);
            // Get child category configuration
            this.getConfig(cat);
          });
        },
        error => {
          console.log('error ', error);
        }
      );
  }

  /**
  * Get configuration of the child category
  * @param categoryName : String
  */
  getConfig(category: any) {
    this.configService.getCategory(category.key).
      subscribe(
        (data: any) => {
          if (category.key == `${this.categoryKey}Advanced`) {
            this.advanceConfiguration = { key: category.key, config: cloneDeep(data) };
          }
          if (category.key == `${this.categoryKey}Security`) {
            this.securityConfiguration = { key: category.key, config: cloneDeep(data) };
          }

          this.upsertAdvanceConfiguration(this.groups, { category: category.key, group: category.group, config: data });
        },
        error => {
          console.log('error ', error);
        }
      );
  }

  getChangeConfiguration(values: {}) {
    this.configFormValues = Object.assign({}, this.configFormValues, values);
    this.changedConfigEvent.emit(this.configFormValues)
  }

  /**
   * Get edited advance configuration
   * @param changedConfiguration changed configuration
   */
  getChangedAdvanceConfiguration(changedConfiguration: any) {
    Object.keys(this.advanceConfiguration.config).map(k => {
      this.advanceConfiguration.config[k].key = k;
      return this.advanceConfiguration.config[k]
    });
    this.changedAdvanceConfiguration = Object.assign({}, this.changedAdvanceConfiguration, changedConfiguration);
    const change = this.configurationControlService.getChangedConfiguration(this.changedAdvanceConfiguration, this.advanceConfiguration);
    this.changedAdvanceConfigEvent.emit({ key: this.advanceConfiguration.key, config: change });
  }

  /**
   * Get edited advance security configuration
   * @param changedConfiguration changed configuration of security category
   */
  getChangedSecurityConfiguration(changedConfiguration: any) {
    Object.keys(this.securityConfiguration.config).map(k => {
      this.securityConfiguration.config[k].key = k;
      return this.securityConfiguration.config[k]
    });
    this.changedSecurityConfiguration = Object.assign({}, this.changedSecurityConfiguration, changedConfiguration);
    const change = this.configurationControlService.getChangedConfiguration(this.changedSecurityConfiguration, this.securityConfiguration);
    this.changedAdvanceConfigEvent.emit({ key: this.securityConfiguration.key, config: change });
  }

  /**
   *
   * @param groups configuration groups
   * @param config advance cofiguration
   */
  upsertAdvanceConfiguration(groups, config) {
    const i = groups.findIndex(_config => _config.category === config.category);
    if (i > -1) {
      groups[i] = config;
    }
    else {
      groups.push(config);
    }
  }

  formStatus(status: boolean) {
    this.formStatusEvent.emit(status);
  }
}

