import { DOCUMENT } from '@angular/common';
import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { DropNodeInfo, TreeNode } from './tree-node';

@Component({
  selector: 'tree-node-control',
  templateUrl: './tree-node-control.component.html',
  styleUrls: ['./tree-node-control.component.css']
})

export class TreeNodeControlComponent implements OnInit {

  @Output() openAddFilterModal = new EventEmitter();
  @Output() filterConfigurationModal = new EventEmitter();
  @Input() nodes: TreeNode[];
  nodeLookup = {};
  dropActionTodo: DropNodeInfo = null;
  dropTargetIds = [];

  constructor(@Inject(DOCUMENT) private document: Document) { }

  ngOnChanges() {
    this.prepareDragDrop(this.nodes);
  }

  ngOnInit() { }

  prepareDragDrop(nodes: TreeNode[]) {
    nodes.forEach(node => {
      this.dropTargetIds.push(node.id);
      this.nodeLookup[node.id] = node;
      this.prepareDragDrop(node.children);
    });
  }

  dragMoved(event) {

    let e = this.document.elementFromPoint(event.pointerPosition.x, event.pointerPosition.y);


    if (!e) {
      this.clearDragInfo();
      return;
    }
    let container = e.classList.contains("node-item") ? e : e.closest(".node-item");
    // console.log('container', container);

    if (!container) {
      this.clearDragInfo();
      return;
    }
    this.dropActionTodo = {
      targetId: container.getAttribute("data-id")
    };
    // console.log('container', container);
    // console.log('targetId', this.dropActionTodo);


    const targetRect = container.getBoundingClientRect();
    const oneThird = targetRect.height / 3;

    if (event.pointerPosition.y - targetRect.top < oneThird) {
      // before
      this.dropActionTodo["action"] = "before";
    } else if (event.pointerPosition.y - targetRect.top > 2 * oneThird) {
      // after
      this.dropActionTodo["action"] = "after";
    } else {
      // inside
      this.dropActionTodo["action"] = "inside";
    }
    this.showDragInfo();
  }

  clearDragInfo(dropped = false) {
    if (dropped) {
      this.dropActionTodo = null;
    }
    // clear border after drop item
    this.document
      .querySelectorAll(".drop-before")
      .forEach(element => element.classList.remove("drop-before"));
    this.document
      .querySelectorAll(".drop-after")
      .forEach(element => element.classList.remove("drop-after"));
    this.document
      .querySelectorAll(".drop-inside")
      .forEach(element => element.classList.remove("drop-inside"));
  }

  showDragInfo() {
    this.clearDragInfo();
    if (this.dropActionTodo) {
      console.log(this.dropActionTodo);

      this.document.getElementById("dropZone")?.classList.add("drop-" + this.dropActionTodo.action);
    }
  }

  drop(event) {
    if (!this.dropActionTodo) return;
    const draggedItemId = event.item.data;
    // console.log('draggedItemId', draggedItemId);

    const parentItemId = event.previousContainer.id;
    // console.log('parentItemId', parentItemId);

    const targetListId = this.getParentNodeId(this.dropActionTodo.targetId, this.nodes, 'main');
    // console.log('targetListId', targetListId);


    console.log(
      '\nmoving\n[' + draggedItemId + '] from list [' + parentItemId + ']',
      '\n[' + this.dropActionTodo.action + ']\n[' + this.dropActionTodo.targetId + '] from list [' + targetListId + ']');

    const draggedItem = this.nodeLookup[draggedItemId];
    // console.log('draggedItem', draggedItem);

    const oldItemContainer = parentItemId != 'main' ? this.nodeLookup[parentItemId].children : this.nodes;
    // console.log('oldItemContainer', oldItemContainer);


    const newContainer = targetListId != 'main' ? this.nodeLookup[targetListId].children : this.nodes;
    // console.log('new container', newContainer);

    let i = oldItemContainer.findIndex(c => c.id === draggedItemId);
    oldItemContainer.splice(i, 1);

    switch (this.dropActionTodo.action) {
      case 'before':
      case 'after':
        const targetIndex = newContainer.findIndex(c => c.id === this.dropActionTodo.targetId);
        if (this.dropActionTodo.action == 'before') {
          newContainer.splice(targetIndex, 0, draggedItem);
        } else {
          newContainer.splice(targetIndex + 1, 0, draggedItem);
        }
        break;

      case 'inside':
        // console.log(draggedItemId);
        // console.log(parentItemId);
        // console.log(this.dropActionTodo);
        // console.log(this.nodeLookup);
        // console.log(this.nodeLookup[this.dropActionTodo.targetId]);
        if (this.dropActionTodo.targetId == '') {
          this.nodeLookup[targetListId].children.push(draggedItem);
          this.nodeLookup[targetListId].isExpanded = true;
          this.nodeLookup[targetListId].children = this.nodeLookup[targetListId].children.filter(child => (child.id != ''))
          // console.log('this.nodeLookup[targetListId]', this.nodeLookup[targetListId]);

        }
        else {
          this.nodeLookup[this.dropActionTodo.targetId].children.push(draggedItem);
          this.nodeLookup[this.dropActionTodo.targetId].isExpanded = true;
        }
        break;
    }

    this.clearDragInfo(true)
  }

  getParentNodeId(id: string, nodesToSearch: TreeNode[], parentId: string): string {
    for (let node of nodesToSearch) {
      if (node.id == id) return parentId;
      let ret = this.getParentNodeId(id, node.children, node.id);
      if (ret) return ret;
    }
    return null;
  }

  checkNewNode(node: TreeNode) {
    return node.children.some(f => f.id == '');
  }

  removeEmptyBranch(node: TreeNode) {
    node.children = node.children.filter(f => (f.id != ''));
    console.log('empty', this.nodes);
    return node;
  }

  addFilterModal() {
    this.openAddFilterModal.emit();
  }

  addEmptyBranch(node: TreeNode) {
    if (this.checkNewNode(node)) {
      return;
    }
    node.children.push({ id: '', children: [] });
  }

  showBranch(node: TreeNode) {
    // remove empty node row from the child array
    const nodes = node.children.filter(n => n.id != '').map(c => c.id)
    // return branch nodes array, removing double quote from the items in the array
    return nodes.length > 0 ? '' + JSON.stringify(nodes).replace(/"/g, '') : '';
  }

  openConfigurationModal($event) {
    this.filterConfigurationModal.emit($event)
  }
}
