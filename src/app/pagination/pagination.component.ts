import { Component, EventEmitter, Input, Output, OnInit, SimpleChanges, OnChanges } from '@angular/core';
import { AssetsComponent } from '../asset-readings/assets/index';

@Component({
    selector: 'app-pagination',
    templateUrl: 'pagination.component.html'
})

export class PaginationComponent implements OnInit, OnChanges {
    @Input() page: number; // the current page
    @Input() count: number; // how many total items there are in all pages
    @Input() perPage: number; // how many items we want to show per page
    @Input() totalPage: number;

    @Output() goPrev = new EventEmitter<boolean>();
    @Output() goNext = new EventEmitter<boolean>();
    @Output() goPage = new EventEmitter<number>();
    @Output() goFirst = new EventEmitter<boolean>();
    @Output() goLast = new EventEmitter<number>();

    middlePg: any;

    constructor() { }

    ngOnInit() { }

    ngOnChanges(changes: SimpleChanges) {
        this.totalPages();
    }

    onPage(n: number): void {
        this.goPage.emit(n);
    }

    onPrev(): void {
        this.goPrev.emit(true);
    }

    onNext(): void {
        this.goNext.emit(true);
    }

    onFirst(): void {
        this.goFirst.emit(true);
    }

    onLast(): void {
        this.goLast.emit(this.totalPage);
    }

    public totalPages() {
        this.totalPage = Math.ceil(this.count / this.perPage) || 0;
        if (this.totalPage > 2) {
            this.middlePage();
        } else {
            this.middlePg = 0;
        }
    }

    lastPage(): boolean {
        return this.perPage * this.page >= this.count;
    }

    middlePage() {
        this.middlePg = Math.ceil(this.totalPage / 2);
    }
}
