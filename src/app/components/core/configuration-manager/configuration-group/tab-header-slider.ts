const SETTINGS = {
  navBarTravelling: false,
  navBarTravelDirection: "",
  // no. of pixels content will travel on left or right slider click
  navBarTravelDistance: 150
}

export class TabHeader {

  groupNavigation: any;
  groupNavContents: any;

  constructor(domElement, groupNavigation) {
    this.groupNavContents = domElement;
    this.groupNavigation = groupNavigation;
    this.setOverFlow();

    let ticking = false;
    this.groupNavigation.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.setOverFlow();
          ticking = false;
        });
      }
      ticking = true;
    });

    this.groupNavContents.addEventListener(
      "transitionend",
      () => {
        // get the value of the transform, apply that to the current scroll position (so get the scroll pos first) and then remove the transform
        let styleOfTransform = window.getComputedStyle(this.groupNavContents, null);
        let transform = styleOfTransform.getPropertyValue("-webkit-transform") || styleOfTransform.getPropertyValue("transform");
        // If there is no transition we want to default to 0 and not null
        let contentTravelDistance = Math.abs(parseInt(transform.split(",")[4]) || 0);
        this.groupNavContents.style.transform = "none";
        // We do not want to show backward transition that is why transition duration is 0s
        this.groupNavContents.style.transition = "transform 0s";
        // Now lets set the scroll position
        if (SETTINGS.navBarTravelDirection === "left") {
          this.groupNavigation.scrollLeft = this.groupNavigation.scrollLeft - contentTravelDistance;
        } else {
          this.groupNavigation.scrollLeft = this.groupNavigation.scrollLeft + contentTravelDistance;
        }
        SETTINGS.navBarTravelling = false;
      },
      false
    );
  }

  scrollToLeft() {
    // If in the middle of a move return
    if (SETTINGS.navBarTravelling === true) {
      return;
    }
    // If we have content overflowing both sides or on the left
    if (this.determineOverflow() === "left" || this.determineOverflow() === "both") {
      // Find how far this panel has been scrolled
      let availableScrollLeft = this.groupNavigation.scrollLeft;
      // If the space available is less than two lots of our desired distance, just move the whole amount
      // otherwise, move by the amount in the settings
      if (availableScrollLeft < SETTINGS.navBarTravelDistance * 2) {
        this.groupNavContents.style.transform = "translateX(" + availableScrollLeft + "px)";
      } else {
        this.groupNavContents.style.transform = "translateX(" + SETTINGS.navBarTravelDistance + "px)";
      }
      // Show transition only in forward stroke
      this.groupNavContents.style.transition = "transform 0.2s ease-in-out";
      // Update settings
      SETTINGS.navBarTravelDirection = "left";
      SETTINGS.navBarTravelling = true;
    }
    // Now update the attribute in the DOM
    this.setOverFlow();
  }

  scrollToRight() {
    // If in the middle of a move return
    if (SETTINGS.navBarTravelling === true) {
      return;
    }
    // If we have content overflowing both sides or on the right
    if (this.determineOverflow() === "right" || this.determineOverflow() === "both") {
      // Get the right edge of the container and content
      let navBarRightEdge = this.groupNavContents.getBoundingClientRect().right;
      let navBarScrollerRightEdge = this.groupNavigation.getBoundingClientRect().right;
      // Now we know how much space we have available to scroll
      let availableScrollRight = Math.floor(navBarRightEdge - navBarScrollerRightEdge);
      // If the space available is less than two lots of our desired distance, just move the whole amount
      // otherwise, move by the amount in the settings
      if (availableScrollRight < SETTINGS.navBarTravelDistance * 2) {
        this.groupNavContents.style.transform = "translateX(-" + availableScrollRight + "px)";
      } else {
        this.groupNavContents.style.transform = "translateX(-" + SETTINGS.navBarTravelDistance + "px)";
      }
      // Show transition only in forward stroke
      this.groupNavContents.style.transition = "transform 0.2s ease-in-out";
      // Update settings
      SETTINGS.navBarTravelDirection = "right";
      SETTINGS.navBarTravelling = true;
    }
    // Now update the attribute in the DOM
    this.setOverFlow();
  }

  setOverFlow() {
    this.groupNavigation.setAttribute("data-overflowing", this.determineOverflow());
  }


  determineOverflow() {
    let content = this.groupNavContents;
    let container = this.groupNavigation;
    const containerMetrics = container.getBoundingClientRect();
    const containerMetricsRight = Math.floor(containerMetrics.right);
    const containerMetricsLeft = Math.floor(containerMetrics.left);

    const contentMetrics = content.getBoundingClientRect();
    const contentMetricsRight = Math.floor(contentMetrics.right);
    const contentMetricsLeft = Math.floor(contentMetrics.left);

    if (containerMetricsLeft > contentMetricsLeft && containerMetricsRight < contentMetricsRight - 2) {
      return "both";
    }
    if (contentMetricsLeft < containerMetricsLeft) {
      return "left";
    }
    if (contentMetricsRight > containerMetricsRight) {
      return "right";
    }
    return "none";
  }
}
