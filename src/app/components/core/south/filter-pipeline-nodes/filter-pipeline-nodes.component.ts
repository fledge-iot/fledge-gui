import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-filter-pipeline-nodes',
  templateUrl: './filter-pipeline-nodes.component.html',
  styleUrls: ['./filter-pipeline-nodes.component.css']
})
export class FilterPipelineNodesComponent implements OnInit {

  @Input() pipeline: string[];
  @Output() openFilterModal = new EventEmitter();

  filterNodes = [];
  constructor() { }
  // inputArray = ['F1', ['F0', 'Fx'], 'F2', ['F3', 'F4', 'F5'], 'F6'];
  // inputArray = ['F1', 'F2', 'F3', 'F4', 'F5'];
  // inputArray = ['F1', 'F2', ['F3']];
  inputArray = ['F1', ['F2'], 'F3'];
  // inputArray = [['F1'], 'F2', 'F6'];
  rootFilter = false;

  ngOnInit(): void {
    console.log(this.createTreeFromArray(this.inputArray));
    this.filterNodes = this.createTreeFromArray(this.inputArray);
    console.log('pipeline', this.filterNodes);
  }


  createTreeFromArray(pipeline) {
    const tree = [];

    // Helper function to find a node by its ID
    function findNodeById(id, nodes) {
      for (const node of nodes) {
        if (node.id === id) {
          return node;
        }
      }
      return null;
    }

    for (const item of pipeline) {
      if (Array.isArray(item)) {
        // It's an array of child elements
        const parent = tree[tree.length - 1];
        for (const childId of item) {
          const child = {
            id: childId,
            parent: parent ? parent.id : null,
            children: [],
          };
          if (parent) {
            parent.children.push(child);
          } else {
            tree.push(child);
          }
        }
      } else {
        // It's a standalone element
        const node = {
          id: item,
          parent: null,
          children: [],
        };
        tree.push(node);
      }
    }
    // Set the correct parent values for each node
    for (const node of tree) {
      if (node.parent !== null) {
        const parentNode = findNodeById(node.parent, tree);
        if (parentNode) {
          node.parent = parentNode.id;
        }
      }
    }
    return tree;
  }


  addNode(parentFilter: string) {
    const children = this.filterNodes.find(f => f.id === parentFilter).children;
    if (!children.some(c => c.id == '')) {
      children.push({ id: '', parent: parentFilter, children: [] });
    }
  }

  removeNode(parentFilter: string) {
    const node = this.filterNodes.find(f => f.id === parentFilter);
    node.children = node.children.filter(c => c.id !== '');
  }

  openAddFilterModal(node: any) {
    console.log('node page', node);
    this.openFilterModal.emit(node);
  }

  drop(event: CdkDragDrop<string[]>) {
    console.log("drop");
    if (event.previousContainer === event.container) {
      console.log("move");
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      console.log("trans");
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }
}
