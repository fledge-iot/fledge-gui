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
): false | string {
  const paths = connections.map(([id, element]) => {
    const path = element.querySelector("path");

    if (!path) throw new Error("path not found");

    return [id, element, path] as const;
  });

  for (const [id, , path] of paths) {
    if (checkElementIntersectPath({ ...position, ...size }, path)) {
      return id;
    }
  }
  return false;
}

type Props<S extends Schemes> = {
  createConnections: (
    node: S["Node"],
    connection: S["Connection"]
  ) => Promise<void>;
};


export function insertableNodes<S extends Schemes>(
  area: AreaPlugin<S, any>,
  props: Props<S>
) {
  area.addPipe(async (context) => {
    if (context.type == 'nodetranslated') {
      const editor = area.parentScope<NodeEditor<S>>(NodeEditor);
      const node = editor.getNode(context.data.id) as South | Filter | North;
      const view = area.nodeViews.get(context.data.id);
      const cons = Array.from(area.connectionViews.entries()).map(
        ([id, view]) => [id, view.element] as const
      );
      if (view) {
        const id = checkIntersection(view.position, node, cons);
        if (id) {
          setTimeout(async () => {
            const exist = editor.getConnection(id);
            if (exist && exist.source !== node.id && exist.target !== node.id) {
              // stop storage drag & drop
              if (["Storage", "North", "South"].includes(node.label)) {
                return;
              }
              const connectionEvents = {
                click: () => { },
                remove: () => { }
              }
              // remove old connection while inserting new node in the connection
              removeOldConnection(connectionEvents, node, editor)
              await editor.removeConnection(id);
              await props.createConnections(node, exist);
            }
          }, 0);
        }
      }
    }
    return context;
  });
}

async function removeOldConnection(connectionEvents, node, editor) {
  let connections = await editor.getConnections();
  let source;
  let target = [];
  let inputConnId;
  let outputConnections = [];
  for (const element of connections) {
    if (element.source === node.id) {
      target.push(await editor.getNode(element.target) as ClassicPreset.Node);
      outputConnections.push(element.id);
    }
    if (element.target === node.id) {
      source = await editor.getNode(element.source) as ClassicPreset.Node;
      inputConnId = element.id;
    }
  }
  for (let t of target) {
    await editor.addConnection(new Connection(connectionEvents, source, t));
  }
  if (inputConnId) {
    await editor.removeConnection(inputConnId);
  }
  for (let c of outputConnections) {
    await editor.removeConnection(c);
  }
}
