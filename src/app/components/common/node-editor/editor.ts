import { isEmpty } from 'lodash';
import { Injector } from "@angular/core";
import { NodeEditor, GetSchemes, ClassicPreset } from "rete";
import { AreaPlugin, AreaExtensions, Area2D } from "rete-area-plugin";
import { AngularPlugin, Presets, AngularArea2D } from "rete-angular-plugin/16";
import { ConnectionPlugin, Presets as ConnectionPresets, ClassicFlow, BidirectFlow } from "rete-connection-plugin";
import { AutoArrangePlugin, Presets as ArrangePresets, ArrangeAppliers } from "rete-auto-arrange-plugin";
import { ContextMenuExtra, ContextMenuPlugin, Presets as ContextMenuPresets } from "rete-context-menu-plugin";
import { DockPlugin, DockPresets } from "rete-dock-plugin";
import { CustomNodeComponent } from "./custom-node/custom-node.component";
import { CustomNotificationNodeComponent } from "./custom-notification-node/custom-notification-node.component";
import { HistoryExtensions, HistoryPlugin, Presets as HistoryPresets } from "rete-history-plugin";
import { addCustomBackground } from "./custom-background";
import { easeInOut } from "popmotion";
import { insertableNodes } from "./insert-node";
import { CustomConnectionComponent } from "./custom-connection/custom-connection.component";
import { CustomSocketComponent } from "./custom-socket/custom-socket.component";
import { South } from "./nodes/south";
import { Notification } from "./nodes/notification";
import { Storage } from "./storage";
import { Filter } from "./filter";
import { AddService } from "./nodes/add-service";
import { MinimapExtra, MinimapPlugin } from "rete-minimap-plugin";
import { CurveFactory, curveBasis } from "d3-shape";
import { ConnectionPathPlugin } from "rete-connection-path-plugin";
import { colors } from "./color-palette";
import { North } from "./nodes/north";
import { AddTask } from "./nodes/add-task";
import { AddNotification } from "./nodes/add-notification";
import { ChannelControl, RuleControl, NotificationTypeControl, ServiceStatusControl } from "./controls/notification-custom-control";
import { AssetControl, ReadingControl } from "./controls/south-custom-control";
import { SentReadingsControl } from './controls/north-custom-control';
import { EnabledControl, StatusControl } from './controls/common-custom-control';
import { NorthTask } from '../../core/north/north-task';

type Node = South | North | Filter | Notification;
type Schemes = GetSchemes<Node, Connection<Node, Node>>;
type AreaExtra = AngularArea2D<Schemes> | MinimapExtra | ContextMenuExtra;

class Connection<A extends Node, B extends Node> extends ClassicPreset.Connection<A, B> { curve?: CurveFactory; }

let editor = new NodeEditor<Schemes>();
let area: AreaPlugin<Schemes, AreaExtra>;


export async function createEditor(container: HTMLElement, injector: Injector, flowEditorService, rolesService, data) {
  const socket = new ClassicPreset.Socket("socket");
  editor = new NodeEditor<Schemes>();
  area = new AreaPlugin<Schemes, AreaExtra>(container);
  const connection = new ConnectionPlugin<Schemes, AreaExtra>();
  const render = new AngularPlugin<Schemes, AreaExtra>({ injector });
  const arrange = new AutoArrangePlugin<Schemes>();
  const history = new HistoryPlugin<Schemes>();
  const animatedApplier = new ArrangeAppliers.TransitionApplier<Schemes, never>(
    {
      duration: 500,
      timingFunction: easeInOut
    }
  );
  const minimap = new MinimapPlugin<Schemes>({
    boundViewport: true
  });
  const pathPlugin = new ConnectionPathPlugin<Schemes, Area2D<Schemes>>({
    curve: (c) => c.curve || curveBasis,
    // transformer: () => Transformers.classic({ vertical: false }),
    arrow: () => { return { marker: 'M6,-6 L6,6 L20,0 z' } }
  });

  // @ts-ignore
  // render.use(pathPlugin);

  insertableNodes(area, {
    async createConnections(node, connection) {
      removeOldConnection(node.id)
      await editor.addConnection(
        new Connection(
          editor.getNode(connection.source),
          connection.sourceOutput,
          node,
          "port"
        )
      );
      await editor.addConnection(
        new Connection(
          node,
          "port",
          editor.getNode(connection.target),
          connection.targetInput
        )
      );
      arrange.layout({
        applier: animatedApplier
      });
    }
  });

  // const contextMenu = new ContextMenuPlugin<Schemes>({
  //     items: ContextMenuPresets.classic.setup([
  //         ["Filter", () => new Filter(socket, 'Filter')]
  //     ])
  // });

  const contextMenu = new ContextMenuPlugin<Schemes>({
    items(context) {
      if (context === 'root') {
        return {
          searchBar: false,
          list: [
            {
              label: 'Filter', key: '1', handler: () => {
                let filter = new Filter(socket, { pluginName: '', enabled: 'false', filterName: 'Filter' });
                editor.addNode(filter);
              }
            }
          ]
        }
      }
    }
  })

  const dock = new DockPlugin<Schemes>();

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

  // connection.addPreset(ConnectionPresets.classic.setup());
  connection.addPreset(() => new BidirectFlow())
  arrange.addPreset(ArrangePresets.classic.setup());
  render.addPreset(Presets.contextMenu.setup());
  dock.addPreset(DockPresets.classic.setup({ area, size: 70, scale: 0.6 }));
  // scopes.addPreset(ScopesPresets.classic.setup());
  HistoryExtensions.keyboard(history);
  history.addPreset(HistoryPresets.classic.setup());
  render.addPreset(Presets.minimap.setup({ size: 150 }));

  editor.use(area);
  area.use(connection);
  area.use(render);
  area.use(arrange);
  area.use(dock);
  area.use(history);
  if (data.source) {
    area.use(minimap);
    if (rolesService.hasEditPermissions()) {
      // area.use(contextMenu);
      let newDockFilter = () => {
        setTimeout(() => {
          let dropStrategy: any = dock.dropStrategy;
          let dsEditorNodes = dropStrategy.editor.nodes;
          let addedFiltersIdColl = [];
          for (let i = 0; i < dsEditorNodes.length; i++) {
            if (dsEditorNodes[i].label === 'Filter') {
              addedFiltersIdColl.push(dsEditorNodes[i].id)
            }
          }
          if (addedFiltersIdColl.length > 0) {
            dock.remove(newDockFilter);
            flowEditorService.showAddFilterIcon.next({ addedFiltersIdColl: addedFiltersIdColl });
          }
        }, 10);
        return new Filter(socket, { pluginName: '', enabled: 'false', filterName: 'Filter', color: "#F9CB9C" })
      }
      dock.add(newDockFilter);
    }
  }
  setCustomBackground(area) // Set custom background
  
  if (data.from !== 'notifications') {
    createNodesAndConnections(socket, editor, arrange, area, data);
  } else {
    nodesGrid(area, data.notifications, socket, data.from, data.isServiceEnabled);
  }
}

async function createNodesAndConnections(socket: ClassicPreset.Socket,
  editor: NodeEditor<Schemes>,
  arrange: AutoArrangePlugin<Schemes, never>,
  area: AreaPlugin<Schemes, AreaExtra>,
  data: any) {

  if (data.source) {
    const db = new Storage(socket);
    const plugin = data.from == 'south' ? new South(socket, data.service) : new North(socket, data.task);;
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
        let nextNode = new Filter(socket, nextNodeConfig);
        await editor.addNode(nextNode);
        await editor.addConnection(
          new ClassicPreset.Connection(previousNode, "port", nextNode, "port")
        );
        previousNode = nextNode;
      }
      else {
        let piLen = pipelineItem.length;
        let tempNode = previousNode;
        for (let j = 0; j < piLen; j++) {
          let nextNodeConfig = data.filterConfigurations.find((f: any) => f.filterName === pipelineItem[j])
          nextNodeConfig.color = colors[colorNumber];
          let nextNode = new Filter(socket, nextNodeConfig);
          await editor.addNode(nextNode);
          await editor.addConnection(
            new ClassicPreset.Connection(tempNode, "port", nextNode, "port")
          );
          tempNode = nextNode;
        }

        await editor.addConnection(
          new ClassicPreset.Connection(tempNode, "port", lastNode, "port")
        );
        colorNumber = (colorNumber + 1) % (colors.length);
      }
    }
    await editor.addConnection(
      new ClassicPreset.Connection(previousNode, "port", lastNode, "port")
    );
    await arrange.layout();
    AreaExtensions.zoomAt(area, editor.getNodes());
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
  const canvasWidth = area.container.parentElement.clientWidth;
  const itemCount = Math.round(canvasWidth / 275);
  let j = 0;
  let k = 0;
  for (let i = 0; i < nodeItems.length; i++) {
    const plugin = from == 'south' ? new South(socket, nodeItems[i]) : from == 'north' ? new North(socket, nodeItems[i]) : new Notification(socket, nodeItems[i]);
    await editor.addNode(plugin);
    if (j < itemCount) {
      await area.translate(plugin.id, { x: 250 * j, y: 150 * k });
      j++;
      if (j == itemCount) {
        j = 0; k++;
      }
    }
  }
  const service = from == 'south' ? new AddService() : from == 'north' ? new AddTask() : new AddNotification(isServiceAvailable);
  await editor.addNode(service);
  await area.translate(service.id, { x: 250 * j, y: 150 * k });
}

export function getUpdatedFilterPipeline() {
  let nodes = editor.getNodes();
  let connections = editor.getConnections();

  for (let i = 0; i < nodes.length; i++) {
    if (i == 0) {
      if (!connections.find(c => c.source === nodes[i].id)) {
        console.log("Dangling connection");
        return false;
      }
    }
    else if (i == 1) {
      if (!connections.find(c => c.target === nodes[i].id)) {
        console.log("Dangling connection");
        return false;
      }
    }
    else {
      if (!connections.find(c => c.source === nodes[i].id) || !connections.find(c => c.target === nodes[i].id)) {
        console.log("Dangling connection");
        return false;
      }
    }
  }

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
      let mainBranchStartIndex = [];
      let i;
      for (i = 0; i < connlist.length; i++) {
        let node = editor.getNode(connlist[i].target);
        let branch = getBranchNodes(updatedFilterPipeline, connections, node);
        if (branch) {
          if (branch.length === 0) {
            console.log("invalid pipeline");
            return false;
          }
          updatedFilterPipeline.push(branch);
        }
        else {
          mainBranchStartIndex.push(i);
        }
      }
      if (mainBranchStartIndex.length > 1) {
        console.log("Multi level deep pipeline not supported.")
        return false;
      }
      if (mainBranchStartIndex.length === 1) {
        let node = editor.getNode(connlist[mainBranchStartIndex[0]].target);
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
  if (node.label === "Storage") {
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
      if (filterNode.label !== "Storage" && (existsInPipeline(pipeline, filterNode.label) || existsInPipeline(branchNodes, filterNode.label))) {
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
  for (let i = 0; i < pipeline.length; i++) {
    if (typeof (pipeline[i]) === "string") {
      if (pipeline[i] === filterName) {
        return true;
      }
    }
    else {
      if (pipeline[i].indexOf(filterName) !== -1) {
        return true;
      }
    }
  }
  return false;
}

export function removeNode(nodeId) {
  for (const c of editor
    .getConnections()
    .filter((c) => c.source === nodeId || c.target === nodeId)) {
    editor.removeConnection(c.id);
  }
  editor.removeNode(nodeId);
}

async function removeOldConnection(nodeId) {
  let connections = editor.getConnections();
  let source: Node;
  let target: Node[] = [];
  let inputConnId;
  let outputConnections = [];
  for (let i = 0; i < connections.length; i++) {
    if (connections[i].source === nodeId) {
      target.push(editor.getNode(connections[i].target));
      outputConnections.push(connections[i].id);
    }
    if (connections[i].target === nodeId) {
      source = editor.getNode(connections[i].source);
      inputConnId = connections[i].id;
    }
  }
  for (let t of target) {
    await editor.addConnection(
      new ClassicPreset.Connection(source, "port", t, "port")
    );
  }
  if (inputConnId) {
    await editor.removeConnection(inputConnId);
  }
  for (let c of outputConnections) {
    await editor.removeConnection(c);
  }

}

export function applyContentReordering(nodeId: string) {
  let view = area.nodeViews.get(nodeId);
  let { content } = area.area;
  // Bring selected node in front of other nodes for better visual clarity
  content.reorder(view.element, null);
}
