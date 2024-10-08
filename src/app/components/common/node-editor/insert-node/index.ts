import { BaseSchemes, ClassicPreset, GetSchemes, NodeEditor } from "rete";
import { AreaPlugin } from "rete-area-plugin";
import { Position, Size } from "./types";
import { checkElementIntersectPath } from "./utils";
import { Filter } from "../filter";
import { South } from "../nodes/south";
import { North } from "../nodes/north";
import { Connection } from "../editor";

type Schemes = GetSchemes<
  BaseSchemes["Node"] & Size,
  BaseSchemes["Connection"]
>;

export function checkIntersection(
  position: Position,
  size: { width: number; height: number },
  connections: (readonly [string, HTMLElement])[]
) {
  const paths = connections.map(([id, element]) => {
    const path = element.querySelector("path");

    if (!path) throw new Error("path not found");

    return [id, element, path] as const;
  });
  let intersectedConnections = []
  for (const [id, , path] of paths) {
    if (checkElementIntersectPath({ ...position, ...size }, path)) {
      intersectedConnections.push(id);
    }
  }
  return intersectedConnections;
}

type Props<S extends Schemes> = {
  createConnections: (
    node: S["Node"],
    connection: S["Connection"]
  ) => Promise<void>;
};


export const connectionEvents = {
  click: () => { },
  remove: () => { }
}

export function insertableNodes<S extends Schemes>(
  area: AreaPlugin<S, any>,
  props: Props<S>
) {
  area.addPipe(async (context) => {
    if (!(context && typeof context === 'object' && 'type' in context)) return context;
    if (context.type == 'nodedragged' || (context.type === 'rendered' && context.data?.payload?.label == 'Filter' && ['node', 'connection'].includes(context.data.type))) {
      const id = context.type === 'rendered' ? context.data.payload.id : context.data.id;
      const editor = area.parentScope<NodeEditor<S>>(NodeEditor);
      const node = editor.getNode(id) as South | Filter | North;
      const view = area.nodeViews.get(id);
      const cons = Array.from(area.connectionViews.entries()).map(
        ([id, view]) => [id, view.element] as const
      );


      if (view && node.label !== "South" && node.label !== "Storage" && node.label !== "North") {
        const intersectedConnections = checkIntersection(view.position, node, cons);
        for (let id of intersectedConnections) {
          const exist = editor.getConnection(id);
          if (exist && (exist.source !== node.id && exist.target !== node.id)) {
            removeOldConnection(node, editor);
            await editor.removeConnection(id);
            await props.createConnections(node, exist);
          }
        }
      }
    }
    return context;
  });
}

async function removeOldConnection(node, editor) {
  let connections = await editor.getConnections();
  let source;
  let targets = [];
  let inputConnId;
  let outputConnections = [];
  for (const element of connections) {
    if (element.source === node.id) {
      targets.push(await editor.getNode(element.target) as ClassicPreset.Node);
      outputConnections.push(element.id);
    }
    if (element.target === node.id) {
      source = await editor.getNode(element.source) as ClassicPreset.Node;
      inputConnId = element.id;
    }
  }
  if(source) {
    for (let target of targets) {
      await editor.addConnection(new Connection(connectionEvents, source, target));
    }
  }
  if (inputConnId) {
    await editor.removeConnection(inputConnId);
  }
  for (let c of outputConnections) {
    await editor.removeConnection(c);
  }
}
