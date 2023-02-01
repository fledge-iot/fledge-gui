const SETTINGS = {
  navBarTravelling: false,
  navBarTravelDirection: "",
  navBarTravelDistance: 150
}

export class TabHeader {

  colours = {
    0: "#fead00"
    /*
    Add Numbers And Colors if you want to make each tab's indicator in different color for eg:
    1: "#FF0000",
    2: "#00FF00", and so on...
    */
  }

  AdvancerLeft2 = document.getElementById("AdvancerLeft2");
  AdvancerRight2 = document.getElementById("AdvancerRight2");
  Indicator2 = document.getElementById("Indicator2");
  groupNavigation = document.getElementById("group_navigation");
  groupNavContents

  constructor(domElement) {
    this.groupNavContents = domElement;
    console.log('group nav', this.groupNavContents);

    this.groupNavigation.setAttribute("data-overflowing", this.determineOverflow(this.groupNavContents, this.groupNavigation));
    // this.moveIndicator2(this.groupNavigation.querySelector("[aria-selected=\"true\"]"), this.colours[0]);
    // Handle the scroll of the horizontal container
    var last_known_scroll_position = 0;
    var ticking = false;

    this.groupNavigation.addEventListener("scroll", () => {
      last_known_scroll_position = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.doSomething();
          ticking = false;
        });
      }
      ticking = true;
    });

    this.AdvancerLeft2.addEventListener("click", () => {
      // If in the middle of a move return
      if (SETTINGS.navBarTravelling === true) {
        return;
      }
      // If we have content overflowing both sides or on the left
      if (this.determineOverflow(this.groupNavContents, this.groupNavigation) === "left" || this.determineOverflow(this.groupNavContents, this.groupNavigation) === "both") {
        // Find how far this panel has been scrolled
        var availableScrollLeft = this.groupNavigation.scrollLeft;
        // If the space available is less than two lots of our desired distance, just move the whole amount
        // otherwise, move by the amount in the settings
        if (availableScrollLeft < SETTINGS.navBarTravelDistance * 2) {
          this.groupNavContents.style.transform = "translateX(" + availableScrollLeft + "px)";
        } else {
          this.groupNavContents.style.transform = "translateX(" + SETTINGS.navBarTravelDistance + "px)";
        }
        // We do want a transition (this is set in CSS) when moving so remove the class that would prevent that
        this.groupNavContents.classList.remove("groupNav_Contents-no-transition");
        // Update our settings
        SETTINGS.navBarTravelDirection = "left";
        SETTINGS.navBarTravelling = true;
      }
      // Now update the attribute in the DOM
      this.groupNavigation.setAttribute("data-overflowing", this.determineOverflow(this.groupNavContents, this.groupNavigation));
    });

    this.AdvancerRight2.addEventListener("click", () => {
      // If in the middle of a move return
      if (SETTINGS.navBarTravelling === true) {
        return;
      }
      // If we have content overflowing both sides or on the right
      if (this.determineOverflow(this.groupNavContents, this.groupNavigation) === "right" || this.determineOverflow(this.groupNavContents, this.groupNavigation) === "both") {
        // Get the right edge of the container and content
        var navBarRightEdge = this.groupNavContents.getBoundingClientRect().right;
        var navBarScrollerRightEdge = this.groupNavigation.getBoundingClientRect().right;
        // Now we know how much space we have available to scroll
        var availableScrollRight = Math.floor(navBarRightEdge - navBarScrollerRightEdge);
        // If the space available is less than two lots of our desired distance, just move the whole amount
        // otherwise, move by the amount in the settings
        if (availableScrollRight < SETTINGS.navBarTravelDistance * 2) {
          this.groupNavContents.style.transform = "translateX(-" + availableScrollRight + "px)";
        } else {
          this.groupNavContents.style.transform = "translateX(-" + SETTINGS.navBarTravelDistance + "px)";
        }
        // We do want a transition (this is set in CSS) when moving so remove the class that would prevent that
        this.groupNavContents.classList.remove("groupNav_Contents-no-transition");
        // Update our settings
        SETTINGS.navBarTravelDirection = "right";
        SETTINGS.navBarTravelling = true;
      }
      // Now update the attribute in the DOM
      this.groupNavigation.setAttribute("data-overflowing", this.determineOverflow(this.groupNavContents, this.groupNavigation));
    });

    this.groupNavContents.addEventListener(
      "transitionend",
      () => {
        // get the value of the transform, apply that to the current scroll position (so get the scroll pos first) and then remove the transform
        var styleOfTransform = window.getComputedStyle(this.groupNavContents, null);
        var tr = styleOfTransform.getPropertyValue("-webkit-transform") || styleOfTransform.getPropertyValue("transform");
        // If there is no transition we want to default to 0 and not null
        var amount = Math.abs(parseInt(tr.split(",")[4]) || 0);
        this.groupNavContents.style.transform = "none";
        this.groupNavContents.classList.add("groupNav_Contents-no-transition");
        // Now lets set the scroll position
        if (SETTINGS.navBarTravelDirection === "left") {
          this.groupNavigation.scrollLeft = this.groupNavigation.scrollLeft - amount;
        } else {
          this.groupNavigation.scrollLeft = this.groupNavigation.scrollLeft + amount;
        }
        SETTINGS.navBarTravelling = false;
      },
      false
    );

  }


  doSomething() {
    // var groupNavigation = document.getElementById("group_navigation");
    // var groupNavContents = document.getElementById("this.groupNavContents");
    this.groupNavigation.setAttribute("data-overflowing", this.determineOverflow(this.groupNavContents, this.groupNavigation));
  }

  // var count = 0;
  moveIndicator2(item, color) {
    var Indicator2 = document.getElementById("Indicator2");
    var textPosition = item.getBoundingClientRect();
    // var groupNavContents = document.getElementById("this.groupNavContents");
    var container = this.groupNavContents.getBoundingClientRect().left;
    var distance = textPosition.left - container;
    var scroll = this.groupNavContents.scrollLeft;
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

}

