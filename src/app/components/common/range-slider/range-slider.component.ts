import { Component, OnInit, ViewChild } from '@angular/core';
import { RangeSliderService } from './range-slider.service';

@Component({
  selector: 'app-range-slider',
  templateUrl: './range-slider.component.html',
  styleUrls: ['./range-slider.component.css']
})
export class RangeSliderComponent implements OnInit {
  @ViewChild('range') set range(element) {
    if (element) {
      element.nativeElement
        .addEventListener('input', (element: any) => { this.setBubble(element) });
    }
  }
  constructor(public rangeSliderService: RangeSliderService) { }

  ngOnInit(): void {
    // set default color alpha to 0.7 on page load
    this.rangeSliderService.setAlpha(this.rangeSliderService.getAlpha());
  }

  setBubble(range: any) {
    let bubble: HTMLElement = document.getElementById('bubble');
    let newPlace;
    const val = range.target.value;
    this.rangeSliderService.setAlpha(val);
    // Measure width of range input
    const sliderWidth = parseInt(range.target.offsetWidth, 10);
    const minValue = range.min ? range.min : 0;
    const maxValue = range.max ? range.max : 1;
    const newVal = (val - minValue) / (maxValue - minValue);
    bubble.innerHTML = val;
    // Prevent bubble from going beyond left or right
    if (newVal < 0) {
      newPlace = 0;
    } else if (newVal > 1) {
      newPlace = sliderWidth;
    } else {
      newPlace = sliderWidth * newVal;
    }
    bubble.style.left = `${newPlace}px`;
  }

}
