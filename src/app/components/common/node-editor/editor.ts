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
import { HistoryExtensions, HistoryPlugin, Presets as HistoryPresets } from "rete-history-plugin";
import { addCustomBackground } from "./custom-background";
import { easeInOut } from "popmotion";
import { insertableNodes } from "./insert-node";
import { CustomConnectionComponent } from "./custom-connection/custom-connection.component";
import { CustomSocketComponent } from "./custom-socket/custom-socket.component";
import { South } from "./nodes/south";
import { Storage } from "./storage";
import { Filter } from "./filter";
import { AddService } from "./nodes/add-service";
import { MinimapExtra, MinimapPlugin } from "rete-minimap-plugin";
import { curveStep, curveMonotoneX, curveLinear, CurveFactory } from "d3-shape";
import { ConnectionPathPlugin } from "rete-connection-path-plugin";
import { North } from "./nodes/north";
import { AddTask } from "./nodes/add-task";
import { RolesService } from "../../../services/roles.service"
import { Service } from "../../core/south/south-service";
import { ReadingControl } from "./controls/south-custom-control";
import { SentReadingsControl } from './controls/north-custom-control';


type Node = South | North | Filter;
type Schemes = GetSchemes<Node, Connection<Node, Node>>;
type AreaExtra = AngularArea2D<Schemes> | MinimapExtra | ContextMenuExtra;

class Connection<A extends Node, B extends Node> extends ClassicPreset.Connection<A, B> { curve?: CurveFactory; }

let editor = new NodeEditor<Schemes>();
let area: AreaPlugin<Schemes, AreaExtra>;
export async function createEditor(container: HTMLElement, injector: Injector, flowEditorService, rolesService, data) {
  //console.log('create editor', data);

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
    curve: (c) => c.curve || curveStep,
    // transformer: () => Transformers.classic({ vertical: false }),
    arrow: () => true
  });

  // @ts-ignore
  // render.use(pathPlugin);

  insertableNodes(area, {
    async createConnections(node, connection) {
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
  dock.addPreset(DockPresets.classic.setup({ area, size: 100, scale: 0.6 }));
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
  if (data.from == 'south') {
    createNodesAndConnections(socket, editor, arrange, area, rolesService, data);
    return;
  }
  createNorthNodesAndConnections(socket, editor, arrange, area, rolesService, data);
}

async function createNorthNodesAndConnections(socket: ClassicPreset.Socket,
  editor: NodeEditor<Schemes>,
  arrange: AutoArrangePlugin<Schemes, never>,
  area: AreaPlugin<Schemes, AreaExtra>,
  rolesService: RolesService,
  data: any) {
  if (data.source) {
    // Storage Node
    const db = new Storage(socket);
    await editor.addNode(db);
    // North Node
    const plugin = new North(socket, data.task);
    await editor.addNode(plugin);

    let fpLen = data.filterPipeline.length;
    let previousNode = db;
    for (let i = 0; i < fpLen; i++) {
      let pipelineItem = data.filterPipeline[i];
      if (typeof (pipelineItem) === "string") {
        let nextNodeConfig = data.filterConfigurations.find((f: any) => f.filterName === pipelineItem)
        let nextFilterNode = new Filter(socket, nextNodeConfig);
        await editor.addNode(nextFilterNode);
        await editor.addConnection(
          new ClassicPreset.Connection(previousNode, "port", nextFilterNode, "port")
        );
        previousNode = nextFilterNode;
      }
    }
    await editor.addConnection(
      new ClassicPreset.Connection(previousNode, "port", plugin, "port")
    );
    await arrange.layout();
    AreaExtensions.zoomAt(area, editor.getNodes());
  }
  else {
    nodesGrid(area, data.tasks, socket, rolesService, data.from);
  }
}

async function createNodesAndConnections(
  socket: ClassicPreset.Socket,
  editor: NodeEditor<Schemes>,
  arrange: AutoArrangePlugin<Schemes, never>,
  area: AreaPlugin<Schemes, AreaExtra>,
  rolesService: RolesService,
  data: any) {
  if (data.source) {
    // South node
    const plugin = new South(socket, data.service);
    await editor.addNode(plugin);

    // Storage node
    const db = new Storage(socket);
    await editor.addNode(db);

    let fpLen = data.filterPipeline.length;
    let previousNode = plugin;
    for (let i = 0; i < fpLen; i++) {
      let pipelineItem = data.filterPipeline[i];
      if (typeof (pipelineItem) === "string") {
        let nextNodeConfig = data.filterConfigurations.find((f: any) => f.filterName === pipelineItem)
        let nextFilterNode = new Filter(socket, nextNodeConfig);
        await editor.addNode(nextFilterNode);
        await editor.addConnection(
          new ClassicPreset.Connection(previousNode, "port", nextFilterNode, "port")
        );
        previousNode = nextFilterNode;
      }
    }
    await editor.addConnection(
      new ClassicPreset.Connection(previousNode, "port", db, "port")
    );

    await arrange.layout();
    AreaExtensions.zoomAt(area, editor.getNodes());
  }
  else {
    nodesGrid(area, data.services, socket, rolesService, data.from);
  }
};

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
  rolesService: RolesService,
  from: string) {
  const canvasWidth = area.container.parentElement.clientWidth;
  const itemCount = Math.round(canvasWidth / 275);
  let j = 0;
  let k = 0;
  for (let i = 0; i < nodeItems.length; i++) {
    const plugin = from == 'south' ? new South(socket, nodeItems[i]) : new North(socket, nodeItems[i]);
    await editor.addNode(plugin);
    if (j < itemCount) {
      await area.translate(plugin.id, { x: 250 * j, y: 150 * k });
      j++;
      if (j == itemCount) {
        j = 0; k++;
      }
    }
  }
  if (rolesService.hasEditPermissions()) {
    const service = from == 'south' ? new AddService() : new AddTask();
    await editor.addNode(service);
    await area.translate(service.id, { x: 250 * j, y: 150 * k });
  }
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

  let updatedFilterPipeline = [];
  let sourceNode = nodes[0];
  while (connections.find(c => c.source === sourceNode.id)) {
    let previousSourceNode = sourceNode;
    let connlist = connections.filter(c => c.source === sourceNode.id);
    if (connlist.length === 1) {
      let filterNode = editor.getNode(connlist[0].target);
      if (filterNode.label !== "Storage") {
        updatedFilterPipeline.push(filterNode.label);
      }
      sourceNode = filterNode;
    }
    else {
      for (let i = 0; i < connlist.length; i++) {
        let node = editor.getNode(connlist[i].target);
        let branch = getBranchNodes(connections, node);
        if (branch) {
          updatedFilterPipeline.push(branch);
        }
        else {
          if (node.label !== "Storage") {
            updatedFilterPipeline.push(node.label);
          }
          sourceNode = node;
        }
      }
    }
    if (previousSourceNode === sourceNode) {
      break;
    }
  }
  return updatedFilterPipeline;
}

function getBranchNodes(connections, node) {
  if (node.label === "Storage") {
    return;
  }
  let branchNodes = [];
  branchNodes.push(node.label);
  while (connections.find(c => c.source === node.id)) {
    let connlist = connections.filter(c => c.source === node.id);
    if (connlist.length === 1) {
      let filterNode = editor.getNode(connlist[0].target);
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

export function updateNode(data) {
  editor.getNodes().forEach(async (node) => {
    if (!isEmpty(node.controls)) {
      if (node.label == 'South') {
        const readingControl = node.controls.readingCountControl as ReadingControl;
        const service = data.services.find(s => s.name === node.controls.nameControl['name'])
        let readingCount = service.assets.reduce((total, asset) => {
          return total + asset.count;
        }, 0)
        readingControl.count = readingCount;
        area.update("control", readingControl.id);
        area.update('node', node.id)
      }
      if (node.label == 'North') {
        const sentReadingControl = node.controls.sentReadingControl as SentReadingsControl;
        const task = data.tasks.find(t => t.name === node.controls.nameControl['name'])
        sentReadingControl.sent = task.sent;
        area.update("control", sentReadingControl.id);
        area.update('node', node.id)
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
