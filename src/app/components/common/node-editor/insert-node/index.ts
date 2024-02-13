import { BaseSchemes, GetSchemes, NodeEditor } from "rete";
import { AreaPlugin } from "rete-area-plugin";
import { Size } from "rete-area-plugin/_types/types";
import { Position } from "./types";
import { checkElementIntersectPath } from "./utils";

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
    if (context.type === "nodedragged") {
      const editor = area.parentScope<NodeEditor<S>>(NodeEditor);
      const node = editor.getNode(context.data.id);
      const view = area.nodeViews.get(context.data.id);
      const cons = Array.from(area.connectionViews.entries()).map(
        ([id, view]) => [id, view.element] as const
      );

      if (view) {
        const id = checkIntersection(view.position, node, cons);

        if (id) {
          const exist = editor.getConnection(id);

          if (exist.source !== node.id && exist.target !== node.id) {
            await editor.removeConnection(id);
            await props.createConnections(node, exist);
          }
        }
      }
    }
    return context;
  });
}
