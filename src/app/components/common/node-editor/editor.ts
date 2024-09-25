import { Injector } from "@angular/core";
import { curveBasis, CurveFactory } from "d3-shape";
import { isEmpty } from 'lodash';
import { easeInOut } from "popmotion";
import { ClassicPreset, GetSchemes, NodeEditor } from "rete";
import { AngularArea2D, AngularPlugin, Presets } from "rete-angular-plugin/16";
import { AreaExtensions, AreaPlugin } from "rete-area-plugin";
import { ArrangeAppliers, Presets as ArrangePresets, AutoArrangePlugin } from "rete-auto-arrange-plugin";
import { ConnectionPathPlugin } from 'rete-connection-path-plugin';
import { ConnectionPlugin } from "rete-connection-plugin";
import { ContextMenuExtra, ContextMenuPlugin } from "rete-context-menu-plugin";
import { DockPresets } from "rete-dock-plugin";
import { HistoryPlugin, Presets as HistoryPresets } from "rete-history-plugin";
import { MinimapExtra, MinimapPlugin } from "rete-minimap-plugin";
import { NorthTask } from '../../core/north/north-task';
import { colors } from "./color-palette";
import { Connector } from "./connector";
import { EnabledControl, StatusControl } from './controls/common-custom-control';
import { SentReadingsControl } from './controls/north-custom-control';
import { ChannelControl, NotificationTypeControl, RuleControl, ServiceStatusControl } from "./controls/notification-custom-control";
import { AssetControl, ReadingControl } from "./controls/south-custom-control";
import { addCustomBackground } from "./custom-background";
import { CustomConnectionComponent } from "./custom-connection/custom-connection.component";
import { CustomNodeComponent } from "./custom-node/custom-node.component";
import { CustomNotificationNodeComponent } from "./custom-notification-node/custom-notification-node.component";
import { CustomSocketComponent } from "./custom-socket/custom-socket.component";
import { Filter, PseudoNodeControl } from "./filter";
import { insertableNodes } from "./insert-node";
import { AddNotification } from "./nodes/add-notification";
import { AddService } from "./nodes/add-service";
import { AddTask } from "./nodes/add-task";
import { North } from "./nodes/north";
import { Notification } from "./nodes/notification";
import { South } from "./nodes/south";
import { createSelector } from "./selector";
import { Storage } from "./storage";
import { DropNodePlugin } from "./drop-plugin";

type Node = South | North | Filter | Notification;
type Schemes = GetSchemes<Node, Connection<Node, Node>>;
type AreaExtra = AngularArea2D<Schemes> | MinimapExtra | ContextMenuExtra;

export class Connection<A extends Node, B extends Node> extends ClassicPreset.Connection<A, B> {
  selected?: boolean
  click: (data: Connection<A, B>) => void
  remove: (data: Connection<A, B>) => void
  curve?: CurveFactory

  constructor(events: { click: (data: Connection<A, B>) => void, remove: (data: Connection<A, B>) => void }, source: A, target: B, public isLoop?: boolean) {
    super(source, 'port', target, 'port')
    this.click = events.click;
    this.remove = events.remove;
    this.isLoop = false;
  }
}

let editor = new NodeEditor<Schemes>();
let area: AreaPlugin<Schemes, AreaExtra>;
let history: HistoryPlugin<Schemes>;
let dock: DropNodePlugin;
let newDockFilter;
let arrange: AutoArrangePlugin<Schemes>;

export const animatedApplier = new ArrangeAppliers.TransitionApplier<Schemes, never>(
  {
    duration: 500,
    timingFunction: easeInOut
  }
);

export async function createEditor(container: HTMLElement, injector: Injector, flowEditorService, rolesService, alertService, data) {
  const socket = new ClassicPreset.Socket("socket");
  editor = new NodeEditor<Schemes>();
  area = new AreaPlugin<Schemes, AreaExtra>(container);
  const connection = new ConnectionPlugin<Schemes, AreaExtra>();
  const render = new AngularPlugin<Schemes, AreaExtra>({ injector });
  arrange = new AutoArrangePlugin<Schemes>();
  history = new HistoryPlugin<Schemes>();
  dock = new DropNodePlugin(editor, area);
  const minimap = new MinimapPlugin<Schemes>({
    boundViewport: true
  });

  const pathPlugin = new ConnectionPathPlugin<Schemes, AreaExtra>({
    curve: (c) => c.curve || curveBasis,
    arrow: () => { return { marker: 'M4,-4 L4,4 L16,0 z' } }
  });

  // @ts-ignore
  render.use(pathPlugin);

  insertableNodes(area, {
    async createConnections(node, connection) {
      if (!isEmpty(node.inputs) && !isEmpty(node.outputs) && node?.label == 'Filter') {
        const pseudoNodeControl = (node.controls.pseudoNodeControl) as PseudoNodeControl;
        pseudoNodeControl.pseudoConnection = true;
      }
      if (!isEmpty(node.inputs)) {
        await editor.addConnection(
          new Connection(
            connectionEvents,
            editor.getNode(connection.source),
            node
          )
        );
      }
      if (!isEmpty(node.outputs)) {
        await editor.addConnection(
          new Connection(
            connectionEvents,
            node,
            editor.getNode(connection.target)
          )
        )
      }
      arrange.layout({
        applier: animatedApplier
      });
    }
  });

  const contextMenu = new ContextMenuPlugin<Schemes>({
    items(context) {
      if (context === 'root') {
        return {
          searchBar: false,
          list: []
        }
      }
      if ('source' in context && 'target' in context) {
        const deleteItem = {
          label: 'Delete',
          key: 'delete',
          async handler() {
            // connection
            const connectionId = context.id
            const connection = editor.getConnection(connectionId);
            const source = editor.getNode(connection.source);
            const destination = editor.getNode(connection.target);
            if (source.label == 'Filter' || destination.label == 'Filter') {
              const pseudoNodeControl = (source.controls.pseudoNodeControl || destination.controls.pseudoNodeControl) as PseudoNodeControl;
              pseudoNodeControl.pseudoConnection = false;
            }
            await editor.removeConnection(connectionId);
          }
        }
        return {
          searchBar: false,
          list: [deleteItem]
        }
      }
      return {
        searchBar: false,
        list: []
      }
    }
  })

  render.addPreset(Presets.classic.setup(
    {
      customize: {
        node() {
          if (data.from == 'notifications') {
            return CustomNotificationNodeComponent;
          }
          return CustomNodeComponent;
        },
        connection() {
          return CustomConnectionComponent
        },
        socket() {
          return CustomSocketComponent
        }
      }
    }
  ));

  const connectionEvents = {
    click: (data: Schemes['Connection']) => {
      selector.selectConnection(data)
    },
    remove: (data: Schemes['Connection']) => {
      editor.removeConnection(data.id)
    }
  }

  const selector = createSelector(area, flowEditorService);
  connection.addPreset(() => new Connector(connectionEvents));
  arrange.addPreset(ArrangePresets.classic.setup());
  render.addPreset(Presets.contextMenu.setup());
  dock.addPreset(DockPresets.classic.setup({ area, size: 70, scale: 0.6 }));
  // scopes.addPreset(ScopesPresets.classic.setup());
  history.addPreset(HistoryPresets.classic.setup());
  render.addPreset(Presets.minimap.setup({ size: 150 }));

  editor.use(area);
  area.use(connection);
  area.use(render);
  area.use(arrange);
  area.use(dock);
  area.use(history);
  // stop dock item click event
  dock.clickStrategy = { add() { } }

  if (data.source) {
    if (rolesService.hasEditPermissions()) {
      area.use(minimap);
      area.use(contextMenu);
      newDockFilter = () => {
        const index = editor.getNodes().findIndex(n => (n.label == 'Filter'));
        if (index == -1) {
          return new Filter(socket, { pluginName: '', enabled: 'false', filterName: 'Filter', color: "#F9CB9C" }, true)
        } else {
          alertService.message({ type: 'warning', message: 'An unconfigured filter node already exists on canvas.' }, true)
        }
      }
      dock.add(newDockFilter);
    }
  }
  setCustomBackground(area) // Set custom background

  if (data.from !== 'notifications') {
    createNodesAndConnections(socket, editor, arrange, area, data, connectionEvents);
  } else {
    nodesGrid(area, data.notifications, socket, data.from, data.isServiceEnabled);
  }
}

async function createNodesAndConnections(socket: ClassicPreset.Socket,
  editor: NodeEditor<Schemes>,
  arrange: AutoArrangePlugin<Schemes, never>,
  area: AreaPlugin<Schemes, AreaExtra>,
  data: any,
  connectionEvents) {
  if (data.source) {
    const db = new Storage(socket);
    const plugin = data.from == 'south' ? new South(socket, data.service) : new North(socket, data.task);
    //  FIX ME: Array index based change
    if (data.from == 'south') {
      await editor.addNode(plugin);
      await editor.addNode(db);
    } else {
      await editor.addNode(db);
      await editor.addNode(plugin);
    }

    let fpLen = data.filterPipeline.length;
    const lastNode = data.from == 'south' ? db : plugin;
    let previousNode = data.from == 'south' ? plugin : db;
    let colorNumber = 0;
    for (let i = 0; i < fpLen; i++) {
      let pipelineItem = data.filterPipeline[i];
      if (typeof (pipelineItem) === "string") {
        let nextNodeConfig = data.filterConfigurations.find((f: any) => f.filterName === pipelineItem)
        let nextNode = new Filter(socket, nextNodeConfig, false);
        await editor.addNode(nextNode);
        await editor.addConnection(
          new Connection(connectionEvents, previousNode, nextNode)
        );
        previousNode = nextNode;
      }
      else {
        let piLen = pipelineItem.length;
        let tempNode = previousNode;
        for (let j = 0; j < piLen; j++) {
          let nextNodeConfig = data.filterConfigurations.find((f: any) => f.filterName === pipelineItem[j])
          nextNodeConfig.color = colors[colorNumber];
          let nextNode = new Filter(socket, nextNodeConfig, false);
          await editor.addNode(nextNode);
          await editor.addConnection(
            new Connection(connectionEvents, tempNode, nextNode));
          tempNode = nextNode;
        }

        await editor.addConnection(
          new Connection(connectionEvents, tempNode, lastNode));
        colorNumber = (colorNumber + 1) % (colors.length);
      }
    }

    await editor.addConnection(
      new Connection(connectionEvents, previousNode, lastNode)
    );
    await arrange.layout();
    AreaExtensions.zoomAt(area, editor.getNodes());
    history.clear();
  }
  else {
    const nodes = data.from == 'south' ? data.services : data.tasks;
    nodesGrid(area, nodes, socket, data.from);
  }
}

function setCustomBackground(area: AreaPlugin<Schemes, AreaExtra>,) {
  addCustomBackground(area);
  // AreaExtensions.simpleNodesOrder(area);
  AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
    accumulating: AreaExtensions.accumulateOnCtrl()
  });
  AreaExtensions.restrictor(area, {
    scaling: () => ({ min: 0.5, max: 2 }),
  });
}

// Show Nodes in a Grid layout
async function nodesGrid(area: AreaPlugin<Schemes,
  AreaExtra>, nodeItems: [],
  socket: ClassicPreset.Socket,
  from: string, isServiceAvailable = null) {
  const service = from == 'south' ? new AddService() : from == 'north' ? new AddTask() : new AddNotification(isServiceAvailable);
  await editor.addNode(service);
  await area.translate(service.id, { x: 0, y: 0 });

  const canvasWidth = area.container.parentElement.clientWidth;
  const itemCount = Math.round(canvasWidth / 275);
  let j = 1;
  let k = 0;
  for (let i = 0; i < nodeItems.length; i++) {
    const plugin = from == 'south' ? new South(socket, nodeItems[i]) : from == 'north' ? new North(socket, nodeItems[i]) : new Notification(socket, nodeItems[i]);
    await editor.addNode(plugin);
    if (j < itemCount) {
      await area.translate(plugin.id, { x: 250 * j, y: 130 * k });
      j++;
      if (j == itemCount) {
        j = 0; k++;
      }
    }
  }
  history.clear();
}

export function getUpdatedFilterPipeline() {
  let nodes = editor.getNodes();
  let connections = editor.getConnections();

  for (let i = 0; i < nodes.length; i++) {
    if (i == 0) {
      // check if starting node of pipeline i.e. south/storage is connected
      if (!connections.find(c => c.source === nodes[i].id)) {
        console.log("Dangling connection");
        return false;
      }
    }
    else if (i == 1) {
      // check if last node of pipeline i.e. storage/north is connected
      if (!connections.find(c => c.target === nodes[i].id)) {
        console.log("Dangling connection");
        return false;
      }
    }
    else {
      // check if all the filters are connected from both sides
      if (!connections.find(c => c.source === nodes[i].id) || !connections.find(c => c.target === nodes[i].id)) {
        console.log("Dangling connection");
        return false;
      }
    }
  }

  // check for self loop
  for (let i = 0; i < connections.length; i++) {
    if (connections[i].source === connections[i].target) {
      console.log("self loop exist in pipeline")
      return false;
    }
  }

  // Remove duplicate connections
  connections = connections.filter((connection, index) => {
    return index === connections.findIndex(c => connection.source === c.source && connection.target === c.target);
  });

  let updatedFilterPipeline = [];
  let sourceNode = nodes[0];
  while (connections.find(c => c.source === sourceNode.id)) {
    let previousSourceNode = sourceNode;
    let connlist = connections.filter(c => c.source === sourceNode.id);
    if (connlist.length === 1) {
      let filterNode = editor.getNode(connlist[0].target);
      // do not push storage or north node in the filter pipeline
      if (filterNode.label !== "Storage" && filterNode.label != 'North') {
        if (existsInPipeline(updatedFilterPipeline, filterNode.label)) {
          console.log("invalid pipeline");
          return false;
        }
        updatedFilterPipeline.push(filterNode.label);
      }
      sourceNode = filterNode;
    }
    else {
      let masterBranchStartIndex = [];
      let i;
      for (i = 0; i < connlist.length; i++) {
        let node = editor.getNode(connlist[i].target);
        let branch = getBranchNodes(updatedFilterPipeline, connections, node);
        // check if it is a slave branch
        if (branch) {
          if (branch.length === 0) {
            console.log("invalid pipeline");
            return false;
          }
          updatedFilterPipeline.push(branch);
        }
        else {
          masterBranchStartIndex.push(i);
        }
      }
      // check if more than one master branch
      if (masterBranchStartIndex.length > 1) {
        console.log("Multi level deep pipeline not supported.")
        return false;
      }
      if (masterBranchStartIndex.length === 1) {
        let node = editor.getNode(connlist[masterBranchStartIndex[0]].target);
        if (node.label !== "Storage" && node.label != 'North') {
          updatedFilterPipeline.push(node.label);
        }
        sourceNode = node;
      }
      else {
        updatedFilterPipeline.pop();
        let node = editor.getNode(connlist[i - 1].target);
        updatedFilterPipeline.push(node.label);
        sourceNode = node;
      }
    }
    if (previousSourceNode === sourceNode) {
      break;
    }
  }
  return updatedFilterPipeline;
}

function getBranchNodes(pipeline, connections, node) {
  if (node.label === "Storage" || node.label === "North") {
    return;
  }
  if (existsInPipeline(pipeline, node.label)) {
    return [];
  }
  let branchNodes = [];
  branchNodes.push(node.label);
  while (connections.find(c => c.source === node.id)) {
    let connlist = connections.filter(c => c.source === node.id);
    if (connlist.length === 1) {
      let filterNode = editor.getNode(connlist[0].target);
      if (filterNode.label !== "Storage" && filterNode.label !== "North" && (existsInPipeline(pipeline, filterNode.label) || existsInPipeline(branchNodes, filterNode.label))) {
        return [];
      }
      branchNodes.push(filterNode.label);
      node = filterNode;
    }
    else {
      return;
    }
  }
  branchNodes.pop();
  return branchNodes;
}

export function updateFilterNode(filterConfiguration) {
  editor.getNodes().forEach(async (node) => {
    if (!isEmpty(node.controls)) {
      if (node.label == filterConfiguration.filterName) {
        const enabledControl = node.controls.enabledControl as EnabledControl;
        enabledControl.enabled = filterConfiguration.enabled;
        area.update("control", enabledControl.id);
        area.update('node', node.id);
      }
    }
  });
}

export function updateNode(data) {
  editor.getNodes().forEach(async (node) => {
    const assetControls = node.controls.assetCountControl as AssetControl
    const readingControl = node.controls.readingCountControl as ReadingControl;
    const enabledControl = node.controls.enabledControl as EnabledControl;
    const statusControl = node.controls.statusControl as StatusControl;
    if (!isEmpty(node.controls)) {
      if (node.label == 'South' && data.from == 'south') {
        const service = data.services.find(s => s.name === node.controls.nameControl['name'])
        if (service) {
          let assetCount = service.assets.length;
          let readingCount = service.assets.reduce((total, asset) => {
            return total + asset.count;
          }, 0)

          assetControls.count = assetCount;
          readingControl.count = readingCount;
          enabledControl.enabled = service.schedule_enabled;
          statusControl.status = service.status;

          area.update("control", assetControls.id);
          area.update("control", readingControl.id);
          area.update("control", enabledControl.id);
          area.update("control", statusControl.id);
          area.update('node', node.id);
        }

      }
      if (node.label == 'North' && data.from == 'north') {
        const sentReadingControl = node.controls.sentReadingControl as SentReadingsControl;
        const task = data.tasks.find(t => t.name === node.controls.nameControl['name']) as NorthTask;
        if (task) {
          sentReadingControl.sent = task.sent;
          enabledControl.enabled = task.enabled;
          statusControl.status = task.status;
          area.update("control", sentReadingControl.id);
          area.update("control", enabledControl.id);
          area.update('node', node.id);
        }
      }
      if (node.label == 'Notification' && data.from == 'notifications') {
        const serviceStatusControl = node.controls.serviceStatusControl as ServiceStatusControl;
        const channelControl = node.controls.channelControl as ChannelControl;
        const ruleControl = node.controls.ruleControl as RuleControl;
        const notificationTypeControl = node.controls.notificationTypeControl as NotificationTypeControl;
        const notification = data.notifications.find(n => n.name === node.controls.nameControl['name']);
        if (notification) {
          channelControl.pluginName = notification.channel;
          ruleControl.pluginName = notification.rule;
          enabledControl.enabled = notification.enable;
          notificationTypeControl.type = notification.notificationType;
          serviceStatusControl.enabled = data.isServiceEnabled;

          area.update("control", channelControl.id);
          area.update("control", ruleControl.id);
          area.update("control", enabledControl.id);
          area.update("control", notificationTypeControl.id);
          area.update("control", serviceStatusControl.id);
          area.update('node', node.id);
        }
      }
    }
  });
}

export function deleteConnection(connectionId) {
  editor.removeConnection(connectionId);
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function existsInPipeline(pipeline, filterName) {
  for (const element of pipeline) {
    if (typeof (element) === "string") {
      if (element === filterName) {
        return true;
      }
    }
    else if (element.indexOf(filterName) !== -1) {
      return true;
    }
  }
  return false;
}

export async function removeNode(nodeId) {
  const connectionEvents = {
    click: () => { },
    remove: () => { }
  }
  let source: Node;
  let target: Node;
  const connections = editor.getConnections()
    .filter(c => (c.source === nodeId || c.target === nodeId))
  for (const c of connections) {
    await editor.removeConnection(c.id);
    if (editor.getNode(c.source).label !== 'Filter') {
      source = editor.getNode(c.source);
    }
    if (editor.getNode(c.target).label !== 'Filter') {
      target = editor.getNode(c.target);
    }
  }
  editor.removeNode(nodeId);
  // pull back the removed connection when filter placeholder node removed
  if (source && target) {
    await editor.addConnection(new Connection(connectionEvents, source, target));
    area.update('node', source.id)
    area.update('node', source.id)
    arrange.layout({
      applier: animatedApplier
    });
  }
}

export function applyContentReordering(nodeId: string) {
  let view = area.nodeViews.get(nodeId);
  let { content } = area.area;
  // Bring selected node in front of other nodes for better visual clarity
  content.reorder(view.element, null);
}

export function undoAction() {
  setTimeout(() => {
    // To hide the (+) icon on filter node when no connecrtion with that node
    const node = editor.getNodes().find(node => node.label == 'Filter')
    const connections = editor.getConnections();
    if (node) {
      const nodeExistInConnection = connections.some(con => (con.source == node.id || con.target == node.id));
      if (!nodeExistInConnection) {
        const pseudoNodeControl = node.controls.pseudoNodeControl as PseudoNodeControl;
        pseudoNodeControl.pseudoConnection = false;
        area.update('control', pseudoNodeControl.id);
        area.update('node', node.id);
      }
    }
  }, 100);

  history.undo().then(() => {
  });
}

export function redoAction() {
  setTimeout(() => {
    // To hide the (+) icon on filter node when no connecrtion with that node
    const node = editor.getNodes().find(node => node.label == 'Filter')
    const connections = editor.getConnections();
    if (node) {
      const nodeExistInConnection = connections.some(con => (con.source == node.id || con.target == node.id));
      if (nodeExistInConnection) {
        const pseudoNodeControl = node.controls.pseudoNodeControl as PseudoNodeControl;
        pseudoNodeControl.pseudoConnection = true;
        area.update('control', pseudoNodeControl.id);
        area.update('node', node.id);
      }
    }
  }, 100);
  history.redo().then(() => {
  });
}



