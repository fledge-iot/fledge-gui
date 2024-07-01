import { ClassicPreset, GetSchemes, NodeEditor } from "rete";
import { AreaPlugin } from "rete-area-plugin";
import { Size } from "rete-area-plugin/_types/types";
import { Position } from "./types";
import { checkElementIntersectPath } from "./utils";
import { North } from "../nodes/north";
import { South } from "../nodes/south";

type Node = South | North;
type Schemes = GetSchemes<Node & Size, Connection<Node, Node>>;
class Connection<A extends Node, B extends Node> extends ClassicPreset.Connection<A, B> { };

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
  for (const [id, , path] of paths.reverse()) {
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

export function insertableNodes<S extends Schemes>(
  area: AreaPlugin<S, any>,
  props: Props<S>
) {
  area.addPipe(async (context) => {
    if (context.type === "nodedragged") {
      const editor = area.parentScope<NodeEditor<S>>(NodeEditor);
      const node = editor.getNode(context.data.id);
      const view = area.nodeViews.get(context.data.id);
      const cons = Array.from(area.connectionViews.entries()).map(
        ([id, view]) => [id, view.element] as const
      );

      if (view && node.label !== "South" && node.label !== "Storage" && node.label !== "North") {
        const intersectedConnections = checkIntersection(view.position, node, cons);
        for (let id of intersectedConnections) {
          const exist = editor.getConnection(id);
          if (exist && (exist.source !== node.id && exist.target !== node.id)) {
            await editor.removeConnection(id);
            await props.createConnections(node, exist);
          }
        }
      }
    }
    return context;
  });
}
