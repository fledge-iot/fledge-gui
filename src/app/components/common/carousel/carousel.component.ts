import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.css']
})
export class CarouselComponent implements OnInit {

  slideIndex = 1;
  imageReadingsDimensions = { width: 0, height: 0, depth: 0 };
  @Input() imageReadings: any;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.showSlides(this.slideIndex);
    let time = +localStorage.getItem('PING_INTERVAL');
    setInterval(() => {
      this.slideIndex = 1;
      this.showSlides(this.slideIndex);
    }, time+50);
  }

  changeSlide(n) {
    this.slideIndex += n;
    this.showSlides(this.slideIndex);
  }

  // currentSlide(n) {
  //   this.slideIndex = n;
  //   this.showSlides(this.slideIndex);
  // }

  showSlides(n) {
    let slides = <HTMLCollectionOf<HTMLElement>>document.getElementsByClassName("slides");
    let dots = document.getElementsByClassName("dot");
    if (n >= slides.length) {
      document.getElementById('next').style.display = "none";
    }
    else {
      document.getElementById('next').style.display = "block";
    }
    if (n <= 1) {
      document.getElementById('prev').style.display = "none";
    }
    else {
      document.getElementById('prev').style.display = "block";
    }

    for (let i = 0; i < slides.length; i++) {
      slides[i].style.display = "none";
    }
    // for (i = 0; i < dots.length; i++) {
    //   dots[i].className = dots[i].className.replace(" active", "");
    // }
    // dots[this.slideIndex - 1].className += " active";
    slides[this.slideIndex - 1].style.display = "block";
  }

  getImageReadingsDimensions(value) {
    let val = value.replace('__DPIMAGE:', '');
    let index = val.indexOf('_');
    let dimensions = val.slice(0, index).split(',');
    this.imageReadingsDimensions.width = dimensions[0];
    this.imageReadingsDimensions.height = dimensions[1];
    this.imageReadingsDimensions.depth = dimensions[2];
  }

}
