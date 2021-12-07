import { Component, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-opacity-slider',
  templateUrl: './opacity-slider.component.html',
  styleUrls: ['./opacity-slider.component.css']
})
export class OpacitySliderComponent implements OnInit {

  @ViewChild('range') set range(element) {
    if (element) {
      element.nativeElement
        .addEventListener('input', this.setBubble.bind(element));
    }
  }
  constructor() { }

  ngOnInit(): void {
  }

  setBubble(range: any) {
    let bubble: HTMLElement = document.getElementById('bubble');
    let newPlace;
    const val = range.target.value;
    // Measure width of range input
    const sliderWidth = parseInt(range.target.offsetWidth, 10);
    const minValue = range.min ? range.min : 0;
    const maxValue = range.max ? range.max : 100;
    const newVal = (val - minValue) / (maxValue - minValue);
    bubble.innerHTML = val;
    console.log(newVal);

    // Prevent bubble from going beyond left or right
    if (newVal < 0) {
      newPlace = 0;
    } else if (newVal > 1) {
      newPlace = sliderWidth;
    } else {
      newPlace = sliderWidth * newVal;
      console.log('newPlace', newPlace);
    }

    bubble.style.left = `${newPlace}px`;
  }

}
